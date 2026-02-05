// src/app/admin/design/page.tsx
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import { saveDesign, resetDesign } from "@/app/actions/design";

type Props = {
  searchParams?: Promise<{ site?: string }>;
};

function prettyJson(v: unknown) {
  if (!v) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

const SITE_IDS = ["meilleur-ski", "meilleur-robot"] as const;

export default async function AdminDesignPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const siteId = SITE_IDS.includes(sp.site as any)
    ? (sp.site as (typeof SITE_IDS)[number])
    : (process.env.SITE_ID as any) || "meilleur-ski";

  const cfg = getSiteConfig(siteId);
  const settings = await prisma.siteSettings.findUnique({ where: { siteId } });

  // valeurs "finales" (DB -> fallback config)
  const value = {
    siteId,

    name: settings?.name ?? cfg.name,
    tagline: settings?.tagline ?? (cfg as any).tagline ?? "",
    logoSrc: settings?.logoSrc ?? cfg.brand.logoSrc,
    logoAlt: settings?.logoAlt ?? cfg.brand.logoAlt,
    faviconSrc: settings?.faviconSrc ?? cfg.brand.faviconSrc ?? "",

    primary: settings?.primary ?? cfg.colors.primary,
    secondary: settings?.secondary ?? cfg.colors.secondary,
    accent: settings?.accent ?? cfg.colors.accent,
    background: settings?.background ?? cfg.colors.background,
    foreground: settings?.foreground ?? cfg.colors.foreground,
    muted: settings?.muted ?? cfg.colors.muted,
    mutedForeground: settings?.mutedForeground ?? cfg.colors.mutedForeground,
    border: settings?.border ?? cfg.colors.border,

    fontSans: settings?.fontSans ?? cfg.fonts.sans,
    fontDisplay: settings?.fontDisplay ?? cfg.fonts.display,

    heroTitle: settings?.heroTitle ?? "",
    heroHighlight: settings?.heroHighlight ?? "",
    heroSubtitle: settings?.heroSubtitle ?? "",

    heroCtas: prettyJson(settings?.heroCtas),
    categoryTiles: prettyJson(settings?.categoryTiles),
    topBrands: prettyJson(settings?.topBrands),

    showCategories: settings?.showCategories ?? true,
    showLatestGuides: settings?.showLatestGuides ?? true,
    showTopBrands: settings?.showTopBrands ?? true,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Design</h1>
          <p className="text-sm text-slate-600">
            Configure le branding, les couleurs, les polices et la homepage (par site).
          </p>
        </div>

        <form action="/admin/design" className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Site</label>
          <select
            name="site"
            defaultValue={siteId}
            className="rounded-xl border border-ring bg-white px-3 py-2 text-sm"
          >
            {SITE_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            Ouvrir
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-ring bg-white p-4 shadow-card">
        <form action={saveDesign} className="space-y-8">
          <input type="hidden" name="siteId" value={value.siteId} />

          {/* Branding */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Branding</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Nom" name="name" defaultValue={value.name} />
              <Field label="Tagline" name="tagline" defaultValue={value.tagline} />
              <Field label="Logo (src)" name="logoSrc" defaultValue={value.logoSrc} />
              <Field label="Logo (alt)" name="logoAlt" defaultValue={value.logoAlt} />
              <Field label="Favicon (src)" name="faviconSrc" defaultValue={value.faviconSrc} />
            </div>
          </section>

          {/* Colors */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Couleurs</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Primary" name="primary" defaultValue={value.primary} />
              <Field label="Secondary" name="secondary" defaultValue={value.secondary} />
              <Field label="Accent" name="accent" defaultValue={value.accent} />
              <Field label="Background" name="background" defaultValue={value.background} />
              <Field label="Foreground" name="foreground" defaultValue={value.foreground} />
              <Field label="Muted" name="muted" defaultValue={value.muted} />
              <Field label="Muted foreground" name="mutedForeground" defaultValue={value.mutedForeground} />
              <Field label="Border" name="border" defaultValue={value.border} />
            </div>
            <p className="text-xs text-slate-500">
              Format recommandé : <code>#RRGGBB</code>
            </p>
          </section>

          {/* Fonts */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Polices</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Sans" name="fontSans" defaultValue={value.fontSans} placeholder="inter | manrope | plusJakarta" />
              <Field label="Display" name="fontDisplay" defaultValue={value.fontDisplay} placeholder="inter | manrope | plusJakarta" />
            </div>
          </section>

          {/* Homepage */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-ink">Homepage</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Hero title" name="heroTitle" defaultValue={value.heroTitle} />
              <Field label="Hero highlight" name="heroHighlight" defaultValue={value.heroHighlight} />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <TextArea label="Hero subtitle" name="heroSubtitle" defaultValue={value.heroSubtitle} rows={3} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Toggle label="Afficher catégories" name="showCategories" defaultChecked={value.showCategories} />
              <Toggle label="Afficher derniers guides" name="showLatestGuides" defaultChecked={value.showLatestGuides} />
              <Toggle label="Afficher top marques" name="showTopBrands" defaultChecked={value.showTopBrands} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TextArea
                label="Hero CTAs (JSON)"
                name="heroCtas"
                defaultValue={value.heroCtas}
                rows={10}
                hint={`Ex: [{"label":"Comparer","href":"/search","variant":"primary"}]`}
              />
              <TextArea
                label="Category tiles (JSON)"
                name="categoryTiles"
                defaultValue={value.categoryTiles}
                rows={10}
                hint={`Ex: [{"slug":"robots-tondeuse","title":"Robots tondeuse","desc":"...","cta":"Comparer","img":"/categories/robots-tondeuse.jpg"}]`}
              />
              <TextArea
                label="Top brands (JSON)"
                name="topBrands"
                defaultValue={value.topBrands}
                rows={10}
                hint={`Ex: [{"name":"Husqvarna","slug":"husqvarna","logo":"https://..."}]`}
              />
            </div>
          </section>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Les changements s’appliquent au site <span className="font-semibold">{siteId}</span>.
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn">
                Enregistrer
              </button>

              <form
                action={async () => {
                  "use server";
                  await resetDesign(siteId);
                }}
              >
                <button type="submit" className="btn-outline">
                  Réinitialiser (config)
                </button>
              </form>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field(props: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-ink">{props.label}</div>
      <input
        className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
        name={props.name}
        defaultValue={props.defaultValue ?? ""}
        placeholder={props.placeholder}
      />
    </label>
  );
}

function TextArea(props: { label: string; name: string; defaultValue?: string; rows?: number; hint?: string }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-ink">{props.label}</div>
      <textarea
        className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm font-mono"
        name={props.name}
        defaultValue={props.defaultValue ?? ""}
        rows={props.rows ?? 6}
      />
      {props.hint ? <div className="mt-1 text-xs text-slate-500">{props.hint}</div> : null}
    </label>
  );
}

function Toggle(props: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-ring bg-white px-3 py-2">
      <input type="checkbox" name={props.name} defaultChecked={props.defaultChecked ?? false} />
      <span className="text-sm text-ink">{props.label}</span>
    </label>
  );
}
