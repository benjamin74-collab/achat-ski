// src/app/admin/design/page.tsx
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";

export const revalidate = 0;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 gap-3 py-2 border-b border-ring last:border-b-0">
      <div className="col-span-12 sm:col-span-4 text-sm font-medium text-slate-700">
        {label}
      </div>
      <div className="col-span-12 sm:col-span-8 text-sm text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="text-xs bg-muted rounded-xl p-3 overflow-auto border border-ring">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default async function AdminDesignPage() {
  const siteConfig = getSiteConfig();
  const siteId = siteConfig.id;

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
  });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-title">Design — {siteConfig.name}</div>
        <div className="text-sm text-slate-600">
          Lecture seule (v1). Ces valeurs viennent de la base <b>{siteId}</b>.
        </div>
      </div>

      {!settings ? (
        <div className="card">
          <div className="section-title">Aucune configuration trouvée</div>
          <p className="text-sm text-slate-700">
            Aucun enregistrement <code>SiteSettings</code> pour <b>{siteId}</b>.
            Lance le seed :
            <br />
            <code className="inline-block mt-2 bg-muted px-2 py-1 rounded border border-ring">
              npm run prisma:seed:design
            </code>
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="section-title">Branding</div>
            <div className="divide-y divide-ring">
              <Row label="siteId" value={settings.siteId} />
              <Row label="name" value={settings.name ?? "—"} />
              <Row label="tagline" value={settings.tagline ?? "—"} />
              <Row label="logoSrc" value={settings.logoSrc ?? "—"} />
              <Row label="logoAlt" value={settings.logoAlt ?? "—"} />
              <Row label="faviconSrc" value={settings.faviconSrc ?? "—"} />
            </div>
          </div>

          <div className="card">
            <div className="section-title">Fonts</div>
            <div className="divide-y divide-ring">
              <Row label="fontSans" value={settings.fontSans} />
              <Row label="fontDisplay" value={settings.fontDisplay} />
            </div>
          </div>

          <div className="card">
            <div className="section-title">Couleurs</div>
            <div className="divide-y divide-ring">
              <Row label="primary" value={settings.primary} />
              <Row label="secondary" value={settings.secondary} />
              <Row label="accent" value={settings.accent} />
              <Row label="background" value={settings.background} />
              <Row label="foreground" value={settings.foreground} />
              <Row label="muted" value={settings.muted} />
              <Row label="mutedForeground" value={settings.mutedForeground} />
              <Row label="border" value={settings.border} />
            </div>
          </div>

          <div className="card">
            <div className="section-title">Homepage</div>
            <div className="divide-y divide-ring">
              <Row label="heroTitle" value={settings.heroTitle ?? "—"} />
              <Row label="heroHighlight" value={settings.heroHighlight ?? "—"} />
              <Row label="heroSubtitle" value={settings.heroSubtitle ?? "—"} />
              <Row label="heroCtas" value={<JsonBlock data={settings.heroCtas ?? []} />} />
              <Row
                label="sections"
                value={
                  <div className="flex flex-wrap gap-2">
                    <span className="pill pill-brand">
                      Categories: {settings.showCategories ? "ON" : "OFF"}
                    </span>
                    <span className="pill pill-sec">
                      Guides: {settings.showLatestGuides ? "ON" : "OFF"}
                    </span>
                    <span className="pill pill-accent">
                      Marques: {settings.showTopBrands ? "ON" : "OFF"}
                    </span>
                  </div>
                }
              />
              <Row label="categoryTiles" value={<JsonBlock data={settings.categoryTiles ?? []} />} />
              <Row label="topBrands" value={<JsonBlock data={settings.topBrands ?? []} />} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
