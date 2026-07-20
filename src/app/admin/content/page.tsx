import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { resolveBrandsContent } from "@/lib/siteContent";
import { saveContentSettings } from "@/app/actions/content";

export default async function AdminContentPage() {
  const siteId = await getCurrentSiteId();

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId },
    select: {
      contentSettings: true,
    },
  });

  const brands = resolveBrandsContent(
    settings?.contentSettings,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ring bg-white p-5">
        <h1 className="text-lg font-semibold text-ink">
          Contenus
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Configuration des textes propres au site{" "}
          <span className="font-medium">{siteId}</span>.
        </p>
      </div>

      <form action={saveContentSettings} className="space-y-6">
        <section className="rounded-2xl border border-ring bg-white p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Page système
            </p>

            <h2 className="mt-1 text-base font-semibold text-ink">
              Marques
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Textes affichés sur la page publique /marques.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="brandsEyebrow"
              label="Sur-titre"
              defaultValue={brands.eyebrow}
            />

            <Field
              name="brandsTitle"
              label="Titre principal"
              defaultValue={brands.title}
            />

            <Textarea
              name="brandsDescription"
              label="Description d’introduction"
              defaultValue={brands.description}
              rows={4}
              className="md:col-span-2"
            />

            <Field
              name="brandsSearchLabel"
              label="Libellé accessible de la recherche"
              defaultValue={brands.searchLabel}
            />

            <Field
              name="brandsSearchPlaceholder"
              label="Placeholder de recherche"
              defaultValue={brands.searchPlaceholder}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">
            Résultats et recherche
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="brandsResultSingular"
              label="Nom au singulier"
              defaultValue={brands.resultSingular}
            />

            <Field
              name="brandsResultPlural"
              label="Nom au pluriel"
              defaultValue={brands.resultPlural}
            />

            <Field
              name="brandsDisplayedSingular"
              label="Texte affiché au singulier"
              defaultValue={brands.displayedSingular}
            />

            <Field
              name="brandsDisplayedPlural"
              label="Texte affiché au pluriel"
              defaultValue={brands.displayedPlural}
            />

            <Field
              name="brandsEmptyTitle"
              label="Titre si aucun résultat"
              defaultValue={brands.emptyTitle}
            />

            <Field
              name="brandsEmptyDescription"
              label="Description si aucun résultat"
              defaultValue={brands.emptyDescription}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">
            Marques populaires
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              name="brandsPopularTitle"
              label="Titre du bloc"
              defaultValue={brands.popularTitle}
            />

            <Textarea
              name="brandsPopularDescription"
              label="Description du bloc"
              defaultValue={brands.popularDescription}
              rows={3}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">
            Contenu SEO
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              name="brandsSeoTitle"
              label="Titre du bloc SEO"
              defaultValue={brands.seoTitle}
            />

            <Textarea
              name="brandsSeoParagraphs"
              label="Paragraphes SEO"
              description="Sépare chaque paragraphe par une ligne vide."
              defaultValue={brands.seoParagraphs.join("\n\n")}
              rows={10}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">
            Libellés complémentaires
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="brandsCardCta"
              label="Lien des cartes"
              defaultValue={brands.cardCta}
            />

            <Field
              name="brandsItemListName"
              label="Nom de la liste JSON-LD"
              defaultValue={brands.itemListName}
            />

            <Field
              name="brandsBreadcrumbHomeLabel"
              label="Breadcrumb : accueil"
              defaultValue={brands.breadcrumbHomeLabel}
            />

            <Field
              name="brandsBreadcrumbBrandsLabel"
              label="Breadcrumb : marques"
              defaultValue={brands.breadcrumbBrandsLabel}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" className="btn">
            Enregistrer les contenus
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">
        {label}
      </span>

      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}

function Textarea({
  name,
  label,
  description,
  defaultValue,
  rows,
  className = "",
}: {
  name: string;
  label: string;
  description?: string;
  defaultValue: string;
  rows: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-ink">
        {label}
      </span>

      {description ? (
        <span className="mt-1 block text-xs text-slate-500">
          {description}
        </span>
      ) : null}

      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}