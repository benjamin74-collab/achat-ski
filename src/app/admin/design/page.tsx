// src/app/admin/design/page.tsx
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import type { SiteSettings } from "@prisma/client";
import { saveDesign } from "@/app/actions/design";

type FontKey = "inter" | "manrope" | "plusJakarta";

function safeJsonStringify(v: unknown, fallback = "[]") {
  if (v === null || v === undefined) return fallback;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return fallback;
  }
}

export default async function AdminDesignPage() {
  const siteConfig = getSiteConfig();

  const settings: SiteSettings | null = await prisma.siteSettings.findUnique({
    where: { siteId: siteConfig.id },
  });

  // ---------- Defaults (config -> DB) ----------
  const name = settings?.name ?? siteConfig.name;
  const tagline = settings?.tagline ?? "";
  const logoSrc = settings?.logoSrc ?? siteConfig.brand.logoSrc;
  const logoAlt = settings?.logoAlt ?? siteConfig.brand.logoAlt;
  const faviconSrc = settings?.faviconSrc ?? siteConfig.brand.faviconSrc ?? "";

  const primary = settings?.primary ?? siteConfig.colors.primary;
  const secondary = settings?.secondary ?? siteConfig.colors.secondary;
  const accent = settings?.accent ?? siteConfig.colors.accent;
  const background = settings?.background ?? siteConfig.colors.background;
  const foreground = settings?.foreground ?? siteConfig.colors.foreground;
  const muted = settings?.muted ?? siteConfig.colors.muted;
  const mutedForeground = settings?.mutedForeground ?? siteConfig.colors.mutedForeground;
  const border = settings?.border ?? siteConfig.colors.border;

  const fontSans = (settings?.fontSans ?? siteConfig.fonts.sans) as FontKey;
  const fontDisplay = (settings?.fontDisplay ?? siteConfig.fonts.display) as FontKey;

  const heroTitle = settings?.heroTitle ?? "";
  const heroHighlight = settings?.heroHighlight ?? "";
  const heroSubtitle = settings?.heroSubtitle ?? "";
  const heroCtas = safeJsonStringify(settings?.heroCtas, "[]");

  const showCategories = settings?.showCategories ?? true;
  const showLatestGuides = settings?.showLatestGuides ?? true;
  const showTopBrands = settings?.showTopBrands ?? true;

  const categoryTiles = safeJsonStringify(settings?.categoryTiles, "[]");
  const topBrands = safeJsonStringify(settings?.topBrands, "[]");

  const fontOptions: Array<{ value: FontKey; label: string }> = [
    { value: "inter", label: "Inter (sans)" },
    { value: "manrope", label: "Manrope (display)" },
    { value: "plusJakarta", label: "Plus Jakarta Sans (display)" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ring bg-white p-5">
        <h1 className="text-lg font-semibold text-ink">Design</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configuration par site (<span className="font-medium">{siteConfig.id}</span>) : logo, couleurs, polices et homepage.
        </p>
      </div>

      <form action={saveDesign} className="space-y-6">
        {/* -------- Identité -------- */}
        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Identité</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Nom du site</span>
              <input
                name="name"
                defaultValue={name}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Tagline</span>
              <input
                name="tagline"
                defaultValue={tagline}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="Ex: Comparer & gagner"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Logo (chemin public)</span>
              <input
                name="logoSrc"
                defaultValue={logoSrc}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="/brands/meilleur-ski/logo.svg"
              />
              <p className="mt-1 text-xs text-slate-500">Le fichier doit être dans /public. Ex: public/brands/…</p>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Alt du logo</span>
              <input
                name="logoAlt"
                defaultValue={logoAlt}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Favicon (chemin public)</span>
              <input
                name="faviconSrc"
                defaultValue={faviconSrc}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="/brands/meilleur-ski/favicon.ico"
              />
            </label>
          </div>
        </section>

        {/* -------- Couleurs -------- */}
        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Couleurs</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ["primary", "Primary", primary],
              ["secondary", "Secondary", secondary],
              ["accent", "Accent", accent],
              ["background", "Background", background],
              ["foreground", "Foreground", foreground],
              ["muted", "Muted", muted],
              ["mutedForeground", "Muted foreground", mutedForeground],
              ["border", "Border", border],
            ].map(([key, label, value]) => (
              <label key={key} className="block">
                <span className="text-sm font-medium text-ink">{label}</span>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue={String(value)}
                    onChange={() => {}}
                    className="h-10 w-12 rounded-lg border border-ring bg-white p-1"
                    aria-label={String(label)}
                    // pas de name sur color => on envoie la valeur via l'input texte ci-dessous
                  />
                  <input
                    name={String(key)}
                    defaultValue={String(value)}
                    className="w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                  />
                </div>
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Format attendu : HEX (#rrggbb). Ces couleurs alimentent les variables CSS du thème.
          </p>
        </section>

        {/* -------- Polices -------- */}
        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Polices</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Font “sans” (texte)</span>
              <select
                name="fontSans"
                defaultValue={fontSans}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Font “display” (titres)</span>
              <select
                name="fontDisplay"
                defaultValue={fontDisplay}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* -------- Homepage -------- */}
        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Homepage</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero title</span>
              <input
                name="heroTitle"
                defaultValue={heroTitle}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="Ex: Le comparateur des passionnés de ski"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Hero highlight</span>
              <input
                name="heroHighlight"
                defaultValue={heroHighlight}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="Ex: comparateur"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero subtitle</span>
              <textarea
                name="heroSubtitle"
                defaultValue={heroSubtitle}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                rows={3}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero CTAs (JSON)</span>
              <textarea
                name="heroCtas"
                defaultValue={heroCtas}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs"
                rows={6}
                placeholder='[{"label":"Comparer","href":"/search","variant":"primary"}]'
              />
              <p className="mt-1 text-xs text-slate-500">
                JSON attendu (array). Tu peux laisser vide si tu n’utilises pas les CTAs custom.
              </p>
            </label>

            <div className="md:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
                <input type="checkbox" name="showCategories" defaultChecked={showCategories} />
                <span className="text-sm text-ink">Afficher les catégories</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
                <input type="checkbox" name="showLatestGuides" defaultChecked={showLatestGuides} />
                <span className="text-sm text-ink">Afficher les derniers guides</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
                <input type="checkbox" name="showTopBrands" defaultChecked={showTopBrands} />
                <span className="text-sm text-ink">Afficher les top marques</span>
              </label>
            </div>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Category tiles (JSON)</span>
              <textarea
                name="categoryTiles"
                defaultValue={categoryTiles}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs"
                rows={10}
                placeholder='[{"slug":"skis-all-mountain","title":"...","desc":"...","cta":"...","img":"/categories/....jpg"}]'
              />
              <p className="mt-1 text-xs text-slate-500">
                JSON attendu (array). Les images doivent exister dans <span className="font-medium">/public/categories</span>.
              </p>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Top brands (JSON)</span>
              <textarea
                name="topBrands"
                defaultValue={topBrands}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs"
                rows={10}
                placeholder='[{"name":"...","slug":"...","logo":"https://..."}]'
              />
              <p className="mt-1 text-xs text-slate-500">JSON attendu (array).</p>
            </label>
          </div>
        </section>

        {/* -------- Submit -------- */}
        <div className="flex items-center justify-end gap-3">
          <button type="submit" className="btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
