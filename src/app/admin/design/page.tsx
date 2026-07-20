import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
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

  const settings = await prisma.siteSettings.upsert({
    where: { siteId: siteConfig.id },
    create: {
      siteId: siteConfig.id,

      name: siteConfig.name,
      tagline: "",
      logoSrc: "",
      logoAlt: siteConfig.name,
      faviconSrc: null,

      primary: "",
      secondary: "",
      accent: "",
      background: "",
      foreground: "",
      muted: "",
      mutedForeground: "",
      border: "",

      fontSans: "inter",
      fontDisplay: "inter",

      heroTitle: null,
      heroHighlight: null,
      heroSubtitle: null,
      heroCtas: undefined,

      showCategories: true,
      showLatestGuides: true,
      showTopBrands: true,

      categoryTiles: undefined,
      topBrands: undefined,

      robotsIndex: true,
      robotsFollow: true,
      robotsNoarchive: false,
    },
    update: {},
  });

  const name = settings.name ?? siteConfig.name;
  const tagline = settings.tagline ?? "";
  const logoSrc = settings.logoSrc ?? "";
  const logoAlt = settings.logoAlt ?? siteConfig.name;
  const faviconSrc = settings.faviconSrc ?? "";

  const primary = settings.primary;
  const secondary = settings.secondary;
  const accent = settings.accent;
  const background = settings.background;
  const foreground = settings.foreground;
  const muted = settings.muted;
  const mutedForeground = settings.mutedForeground;
  const border = settings.border;

  const fontSans = settings.fontSans as FontKey;
  const fontDisplay = settings.fontDisplay as FontKey;

  const heroTitle = settings.heroTitle ?? "";
  const heroHighlight = settings.heroHighlight ?? "";
  const heroSubtitle = settings.heroSubtitle ?? "";
  const heroCtas = safeJsonStringify(settings.heroCtas, "[]");
  const pagesContent = safeJsonStringify(settings.pagesContent, "{}");

  const footerTrustTitle = settings.footerTrustTitle ?? "";
  const footerTrustItems = safeJsonStringify(settings.footerTrustItems, "[]");
  const footerCopyright = settings.footerCopyright ?? "";

  const showCategories = settings.showCategories;
  const showLatestGuides = settings.showLatestGuides;
  const showTopBrands = settings.showTopBrands;

  const robotsIndex = settings.robotsIndex;
  const robotsFollow = settings.robotsFollow;
  const robotsNoarchive = settings.robotsNoarchive;

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
          Configuration par site (<span className="font-medium">{siteConfig.id}</span>) :
          logo, couleurs, polices et homepage.
        </p>
      </div>

      <form action={saveDesign} className="space-y-6">
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
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Logo</span>
              <input
                name="logoSrc"
                defaultValue={logoSrc}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              />
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
              <span className="text-sm font-medium text-ink">Favicon</span>
              <input
                name="faviconSrc"
                defaultValue={faviconSrc}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
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
                  <input
                    type="color"
                    defaultValue={f.value || "#000000"}
                    className="h-10 w-12 rounded-lg border border-ring bg-white p-1"
                  />
                  <input
                    name={f.key}
                    defaultValue={f.value}
                    className="w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Polices</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Font texte</span>
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
              <span className="text-sm font-medium text-ink">Font titres</span>
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

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Homepage</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-ink">Hero title</span>
              <input
                name="heroTitle"
                defaultValue={heroTitle}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Hero highlight</span>
              <input
                name="heroHighlight"
                defaultValue={heroHighlight}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
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
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-3">
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
          </div>
        </section>
		
		<section className="rounded-2xl border border-ring bg-white p-5">
		  <h2 className="text-base font-semibold text-ink">Pages système</h2>
		  <p className="mt-1 text-sm text-slate-600">
			Contenus personnalisés par site pour les pages automatiques : marques,
			catégories, guides, recherche, etc.
		  </p>

		  <label className="mt-4 block">
			<span className="text-sm font-medium text-ink">Contenus des pages JSON</span>
			<textarea
			  name="pagesContent"
			  defaultValue={pagesContent}
			  className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs"
			  rows={18}
			/>
		  </label>
		</section>

		<section className="rounded-2xl border border-ring bg-white p-5">
		  <h2 className="text-base font-semibold text-ink">Footer</h2>
		  <p className="mt-1 text-sm text-slate-600">
			Configuration multisite du footer : bloc confiance et copyright.
			Les catégories, guides, marques et comparatifs sont pilotés depuis leurs fiches respectives.
		  </p>

		  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<label className="block md:col-span-2">
			  <span className="text-sm font-medium text-ink">Titre du bloc confiance</span>
			  <input
				name="footerTrustTitle"
				defaultValue={footerTrustTitle}
				className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
			  />
			</label>

			<label className="block md:col-span-2">
			  <span className="text-sm font-medium text-ink">Items du bloc confiance JSON</span>
			  <textarea
				name="footerTrustItems"
				defaultValue={footerTrustItems}
				className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 font-mono text-xs"
				rows={6}
			  />
			</label>

			<label className="block md:col-span-2">
			  <span className="text-sm font-medium text-ink">Copyright</span>
			  <input
				name="footerCopyright"
				defaultValue={footerCopyright}
				className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
			  />
			</label>
		  </div>
		</section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">SEO / Robots</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex items-start gap-3 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="robotsIndex" defaultChecked={robotsIndex} className="mt-1" />
              <span className="text-sm text-ink">Autoriser l’indexation</span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="robotsFollow" defaultChecked={robotsFollow} className="mt-1" />
              <span className="text-sm text-ink">Autoriser le suivi des liens</span>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input
                type="checkbox"
                name="robotsNoarchive"
                defaultChecked={robotsNoarchive}
                className="mt-1"
              />
              <span className="text-sm text-ink">Interdire l’archive Google</span>
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}