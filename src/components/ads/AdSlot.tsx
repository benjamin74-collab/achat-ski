// src/components/ads/AdSlot.tsx

import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import AdsenseUnit from "@/components/ads/AdsenseUnit";

type Props = {
  slotKey: "pageTop" | "pageInline" | "pageSidebar" | "pageBottom";
  className?: string;
  label?: string;
};

function relValue(nofollow: boolean, sponsored: boolean) {
  const values = [];
  if (nofollow) values.push("nofollow");
  if (sponsored) values.push("sponsored");
  return values.length ? values.join(" ") : undefined;
}

function adBox(children: React.ReactNode) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
      <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Publicité
      </div>
      {children}
    </div>
  );
}

export default async function AdSlot({
  slotKey,
  className,
  label = "Emplacement publicitaire",
}: Props) {
  const siteId = await getCurrentSiteId();

  const [settings, placement] = await Promise.all([
    prisma.adSettings.findUnique({
      where: { siteId },
      select: {
        enabled: true,
        adsenseClient: true,
      },
    }),

    prisma.adPlacement.findUnique({
      where: {
        siteId_key: {
          siteId,
          key: slotKey,
        },
      },
    }),
  ]);

  if (!settings?.enabled || !placement?.enabled) return null;

  if (placement.type === "ADSENSE") {
    if (!settings.adsenseClient || !placement.adsenseSlot) return null;

    return adBox(
      <AdsenseUnit
        client={settings.adsenseClient}
        slot={placement.adsenseSlot}
        className={className}
        testLabel={label}
      />,
    );
  }

  if (placement.type === "AFFILIATE_BANNER") {
    if (!placement.bannerImageUrl || !placement.bannerLinkUrl) return null;

    const banner = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={placement.bannerImageUrl}
        alt={placement.bannerAlt || placement.bannerTitle || "Bannière partenaire"}
        className="h-auto w-full rounded-2xl object-cover"
        loading="lazy"
        decoding="async"
      />
    );

    return adBox(
      <a
        href={placement.bannerLinkUrl}
        target={placement.openInNewTab ? "_blank" : undefined}
        rel={relValue(placement.nofollow, placement.sponsored)}
        title={placement.bannerTitle ?? undefined}
        className="block transition hover:opacity-95"
      >
        {banner}
      </a>,
    );
  }

  if (placement.type === "CUSTOM_HTML") {
    if (!placement.customHtml) return null;

    return adBox(
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: placement.customHtml }}
      />,
    );
  }

  return null;
}