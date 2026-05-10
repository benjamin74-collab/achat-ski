// src/app/admin/design/page.tsx
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import type { SiteSettings } from "@prisma/client";
import { saveDesign } from "@/app/actions/design";

type FontKey = "inter" | "manrope" | "plusJakarta";

type SelectedCategoryTile = {
  slug: string;
  title?: string;
  desc?: string;
  cta?: string;
  img?: string;
  order?: number;
};

type SelectedTopBrand = {
  name?: string;
  slug: string;
  logo?: string;
  order?: number;
};

function safeJsonStringify(v: unknown, fallback = "[]") {
  if (v === null || v === undefined) return fallback;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return fallback;
  }
}

function parseSelectedCategories(v: unknown): Map<string, SelectedCategoryTile> {
  const map = new Map<string, SelectedCategoryTile>();
  if (!Array.isArray(v)) return map;

  v.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const o = item as Record<string, unknown>;
    if (typeof o.slug !== "string") return;

    map.set(o.slug, {
      slug: o.slug,
      title: typeof o.title === "string" ? o.title : undefined,
      desc: typeof o.desc === "string" ? o.desc : undefined,
      cta: typeof o.cta === "string" ? o.cta : undefined,
      img: typeof o.img === "string" ? o.img : undefined,
      order: typeof o.order === "number" ? o.order : index + 1,
    });
  });

  return map;
}

function parseSelectedBrands(v: unknown): Map<string, SelectedTopBrand> {
  const map = new Map<string, SelectedTopBrand>();
  if (!Array.isArray(v)) return map;

  v.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const o = item as Record<string, unknown>;
    if (typeof o.slug !== "string") return;

    map.set(o.slug, {
      slug: o.slug,
      name: typeof o.name === "string" ? o.name : undefined,
      logo: typeof o.logo === "string" ? o.logo : undefined,
      order: typeof o.order === "number" ? o.order : index + 1,
    });
  });

  return map;
}

export default async function AdminDesignPage() {
  const siteConfig = getSiteConfig();

  const [settings, categories, brands]: [
    SiteSettings | null,
    Array<{ id: number; slug: string; name: string; intro: string | null }>,
    Array<{
      id: number;
      name: string;
      slug: string;
      logoUrl: string | null;
      logo: { publicUrl: string } | null;
    }>,
  ] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { siteId: siteConfig.id },
    }),
    prisma.category.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        intro: true,
      },
    }),
    prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        logo: { select: { publicUrl: true } },
      },
    }),
  ]);

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

  const robotsIndex = settings?.robotsIndex ?? true;
  const robotsFollow = settings?.robotsFollow ?? true;
  const robotsNoarchive = settings?.robotsNoarchive ?? false;

  const selectedCategories = parseSelectedCategories(settings?.categoryTiles);
  const selectedBrands = parseSelectedBrands(settings?.topBrands);

  const fontOptions: Array<{ value: FontKey; label: string }> = [
    { value: "inter", label: "Inter (sans)" },
    { value: "manrope", label: "Manrope (display)" },
    { value: "plusJakarta", label: "Plus Jakarta Sans (display)" },
  ];

  const colorFields: Array<{ key: string; label: string; value: string }> = [
    { key: "primary", label: "Primary", value: primary },
    { key: "secondary", label: "Secondary", value: secondary },
    { key: "accent", label: "Accent", value: accent },
    { key: "background", label: "Background", value: background },
    { key: "foreground", label: "Foreground", value: foreground },
    { key: "muted", label: "Muted", value: muted },
    { key: "mutedForeground", label: "Muted foreground", value: mutedForeground },
    { key: "border", label: "Border", value: border },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ring bg-white p-5">
        <h1 className="text-lg font-semibold text-ink">Design</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configuration par site (<span className="font-medium">{siteConfig.id}</span>) : logo, couleurs, polices, homepage et SEO.
        </p>
      </div>

      <form action={saveDesign} className="space-y-6">
        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Identité</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Nom du site</span>
              <input name="name" defaultValue={name} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" />
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
              <input name="logoAlt" defaultValue={logoAlt} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" />
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

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Couleurs</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {colorFields.map((f) => (
              <label key={f.key} className="block">
                <span className="text-sm font-medium text-ink">{f.label}</span>
                <div className="mt-2 flex items-center gap-3">
                  <input type="color" defaultValue={f.value} className="h-10 w-12 rounded-lg border border-ring bg-white p-1" aria-label={f.label} />
                  <input name={f.key} defaultValue={f.value} className="w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" />
                </div>
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">Format attendu : HEX (#rrggbb).</p>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Polices</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Font “sans” (texte)</span>
              <select name="fontSans" defaultValue={fontSans} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm">
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Font “display” (titres)</span>
              <select name="fontDisplay" defaultValue={fontDisplay} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm">
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Homepage</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero title</span>
              <input name="heroTitle" defaultValue={heroTitle} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Hero highlight</span>
              <input name="heroHighlight" defaultValue={heroHighlight} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero subtitle</span>
              <textarea name="heroSubtitle" defaultValue={heroSubtitle} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" rows={3} />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero CTAs (JSON)</span>
              <textarea name="heroCtas" defaultValue={heroCtas} className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs" rows={6} />
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

            <div className="md:col-span-2 rounded-2xl border border-ring bg-white p-4">
              <h3 className="text-sm font-semibold text-ink">Catégories affichées en homepage</h3>
              <p className="mt-1 text-xs text-slate-500">Coche les catégories à afficher, puis règle leur ordre, textes et image.</p>

              <div className="mt-4 space-y-3">
                {categories.map((cat, index) => {
                  const selected = selectedCategories.get(cat.slug);

                  return (
                    <div key={cat.id} className="rounded-2xl border border-ring bg-muted/20 p-4">
                      <label className="flex flex-wrap items-center gap-3">
                        <input type="checkbox" name="homeCategorySlugs" value={cat.slug} defaultChecked={Boolean(selected)} />
                        <span className="font-medium text-sm text-ink">{cat.name}</span>
                        <span className="text-xs text-slate-500">/{cat.slug}</span>
                      </label>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
                        <label className="md:col-span-1">
                          <span className="text-xs font-medium text-slate-600">Ordre</span>
                          <input
                            name={`homeCategoryOrder_${cat.slug}`}
                            type="number"
                            defaultValue={selected?.order ?? index + 1}
                            className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="md:col-span-2">
                          <span className="text-xs font-medium text-slate-600">Titre</span>
                          <input
                            name={`homeCategoryTitle_${cat.slug}`}
                            defaultValue={selected?.title ?? cat.name}
                            className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="md:col-span-3">
                          <span className="text-xs font-medium text-slate-600">Image</span>
                          <input
                            name={`homeCategoryImg_${cat.slug}`}
                            defaultValue={selected?.img ?? ""}
                            placeholder="/images/categories/skis.jpg"
                            className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="md:col-span-4">
                          <span className="text-xs font-medium text-slate-600">Description</span>
                          <input
                            name={`homeCategoryDesc_${cat.slug}`}
                            defaultValue={selected?.desc ?? cat.intro ?? ""}
                            className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="md:col-span-2">
                          <span className="text-xs font-medium text-slate-600">CTA</span>
                          <input
                            name={`homeCategoryCta_${cat.slug}`}
                            defaultValue={selected?.cta ?? "Comparer les prix"}
                            className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-ring bg-white p-4">
              <h3 className="text-sm font-semibold text-ink">Marques affichées en homepage</h3>
              <p className="mt-1 text-xs text-slate-500">Coche les marques à afficher dans le bloc Top marques.</p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {brands.map((brand, index) => {
                  const selected = selectedBrands.get(brand.slug);
                  const logo = selected?.logo ?? brand.logo?.publicUrl ?? brand.logoUrl ?? "";

                  return (
                    <div key={brand.id} className="rounded-2xl border border-ring bg-muted/20 p-4">
                      <label className="flex flex-wrap items-center gap-3">
                        <input type="checkbox" name="homeBrandSlugs" value={brand.slug} defaultChecked={Boolean(selected)} />
                        <span className="font-medium text-sm text-ink">{brand.name}</span>
                        <span className="text-xs text-slate-500">/marques/{brand.slug}</span>
                      </label>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <label>
                          <span className="text-xs font-medium text-slate-600">Ordre</span>
                          <input
                            name={`homeBrandOrder_${brand.slug}`}
                            type="number"
                            defaultValue={selected?.order ?? index + 1}
                            className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="md:col-span-3">
                          <span className="text-xs font-medium text-slate-600">Logo</span>
                          <input name={`homeBrandLogo_${brand.slug}`} defaultValue={logo} className="mt-1 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">SEO / Robots</h2>
          <p className="mt-1 text-sm text-slate-600">Réglages d’exploration et d’indexation pour ce site.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-start gap-3 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="robotsIndex" defaultChecked={robotsIndex} className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-ink">Autoriser l’indexation</span>
                <span className="block text-xs text-slate-500">index / noindex</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="robotsFollow" defaultChecked={robotsFollow} className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-ink">Autoriser le suivi des liens</span>
                <span className="block text-xs text-slate-500">follow / nofollow</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="robotsNoarchive" defaultChecked={robotsNoarchive} className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-ink">Interdire l’archive Google</span>
                <span className="block text-xs text-slate-500">noarchive</span>
              </span>
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button type="submit" className="btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}