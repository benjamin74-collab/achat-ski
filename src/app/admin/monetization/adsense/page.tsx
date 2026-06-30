// src/app/admin/monetization/adsense/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";
import { saveAdvertisingSettings } from "@/app/actions/adsense";
import type { AdPlacementType } from "@prisma/client";

const PLACEMENTS = [
  { key: "pageTop", label: "Haut de page", help: "Sous l’introduction / le hero." },
  { key: "pageInline", label: "Dans l’article", help: "Au milieu du contenu." },
  { key: "pageSidebar", label: "Sidebar", help: "Colonne latérale desktop." },
  { key: "pageBottom", label: "Bas de page", help: "Après le contenu principal." },
] as const;

type PlacementKey = (typeof PLACEMENTS)[number]["key"];

type PlacementData = {
  key: string;
  enabled: boolean;
  type: AdPlacementType;
  adsenseSlot: string | null;
  bannerImageUrl: string | null;
  bannerAlt: string | null;
  bannerLinkUrl: string | null;
  bannerTitle: string | null;
  customHtml: string | null;
  openInNewTab: boolean;
  nofollow: boolean;
  sponsored: boolean;
};

function getPlacement(
  placements: PlacementData[],
  key: PlacementKey,
): PlacementData {
  return (
    placements.find((p) => p.key === key) ?? {
      key,
      enabled: false,
      type: "ADSENSE",
      adsenseSlot: "",
      bannerImageUrl: "",
      bannerAlt: "",
      bannerLinkUrl: "",
      bannerTitle: "",
      customHtml: "",
      openInNewTab: true,
      nofollow: true,
      sponsored: true,
    }
  );
}

export default async function AdminAdsensePage() {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const [settings, placements] = await Promise.all([
    prisma.adSettings.findUnique({
      where: { siteId },
    }),

    prisma.adPlacement.findMany({
      where: { siteId },
      orderBy: { key: "asc" },
    }),
  ]);

  const enabled = settings?.enabled ?? false;
  const adsenseClient = settings?.adsenseClient ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ring bg-white p-5">
        <h1 className="text-lg font-semibold text-ink">
          Monétisation · Emplacements publicitaires
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure Adsense, des bannières affiliées ou du HTML personnalisé pour{" "}
          <span className="font-medium">{siteConfig.id}</span>.
        </p>
      </div>

      <form action={saveAdvertisingSettings} className="space-y-6">
        <input type="hidden" name="siteId" value={siteId} />

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Configuration générale</h2>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="enabled" defaultChecked={enabled} />
              <span className="text-sm text-ink">Activer la monétisation sur ce site</span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Client Adsense</span>
              <input
                name="adsenseClient"
                defaultValue={adsenseClient}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="ca-pub-1234567890123456"
              />
              <p className="mt-1 text-xs text-slate-500">
                Utilisé uniquement pour les emplacements de type Adsense.
              </p>
            </label>
          </div>
        </section>

        {PLACEMENTS.map((meta) => {
          const p = getPlacement(placements, meta.key);

          return (
            <section key={meta.key} className="rounded-2xl border border-ring bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-ink">
                    {meta.label}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{meta.help}</p>
                </div>

                <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-2">
                  <input
                    type="checkbox"
                    name={`${meta.key}_enabled`}
                    defaultChecked={p.enabled}
                  />
                  <span className="text-sm text-ink">Actif</span>
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-ink">Type d’affichage</span>
                  <select
                    name={`${meta.key}_type`}
                    defaultValue={p.type}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                  >
                    <option value="ADSENSE">Adsense</option>
                    <option value="AFFILIATE_BANNER">Bannière affiliation</option>
                    <option value="CUSTOM_HTML">HTML personnalisé</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-ink">Slot Adsense</span>
                  <input
                    name={`${meta.key}_adsenseSlot`}
                    defaultValue={p.adsenseSlot ?? ""}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                    placeholder="1234567890"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-ink">Image bannière</span>
                  <input
                    name={`${meta.key}_bannerImageUrl`}
                    defaultValue={p.bannerImageUrl ?? ""}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-ink">Lien affilié</span>
                  <input
                    name={`${meta.key}_bannerLinkUrl`}
                    defaultValue={p.bannerLinkUrl ?? ""}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-ink">Alt image</span>
                  <input
                    name={`${meta.key}_bannerAlt`}
                    defaultValue={p.bannerAlt ?? ""}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                    placeholder="Bannière Tonton Outdoor"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-ink">Titre</span>
                  <input
                    name={`${meta.key}_bannerTitle`}
                    defaultValue={p.bannerTitle ?? ""}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                    placeholder="Voir l’offre"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-ink">HTML personnalisé</span>
                  <textarea
                    name={`${meta.key}_customHtml`}
                    defaultValue={p.customHtml ?? ""}
                    rows={6}
                    className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs"
                    placeholder="<a href='...'><img src='...' /></a>"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-3">
                  <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
                    <input
                      type="checkbox"
                      name={`${meta.key}_openInNewTab`}
                      defaultChecked={p.openInNewTab}
                    />
                    <span className="text-sm text-ink">Nouvel onglet</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
                    <input
                      type="checkbox"
                      name={`${meta.key}_nofollow`}
                      defaultChecked={p.nofollow}
                    />
                    <span className="text-sm text-ink">nofollow</span>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
                    <input
                      type="checkbox"
                      name={`${meta.key}_sponsored`}
                      defaultChecked={p.sponsored}
                    />
                    <span className="text-sm text-ink">sponsored</span>
                  </label>
                </div>
              </div>
            </section>
          );
        })}

        <div className="flex justify-end">
          <button type="submit" className="btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}