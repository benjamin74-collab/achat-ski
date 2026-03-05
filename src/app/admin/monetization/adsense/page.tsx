// src/app/admin/monetization/adsense/page.tsx
import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";
import { saveAdsenseSettings } from "@/app/actions/adsense";

export default async function AdminAdsensePage() {
  const siteId = getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const settings = await prisma.adSettings.findUnique({
    where: { siteId },
  });

  const enabled = settings?.enabled ?? false;
  const adsenseClient = settings?.adsenseClient ?? "";
  const slotPageTop = settings?.slotPageTop ?? "";
  const slotPageInline = settings?.slotPageInline ?? "";
  const slotPageSidebar = settings?.slotPageSidebar ?? "";
  const slotPageBottom = settings?.slotPageBottom ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ring bg-white p-5">
        <h1 className="text-lg font-semibold text-ink">Monétisation · Adsense</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configuration Adsense pour le site{" "}
          <span className="font-medium">{siteConfig.id}</span>.
        </p>
      </div>

      <form action={saveAdsenseSettings} className="space-y-6">
        <input type="hidden" name="siteId" value={siteId} />

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Activation</h2>

          <div className="mt-4">
            <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="enabled" defaultChecked={enabled} />
              <span className="text-sm text-ink">Activer Adsense sur ce site</span>
            </label>

            <p className="mt-2 text-xs text-slate-500">
              Les annonces ne seront affichées que si Adsense est activé ici et
              si l’utilisateur accepte les cookies non essentiels.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Compte Adsense</h2>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Client Adsense</span>
              <input
                name="adsenseClient"
                defaultValue={adsenseClient}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="ca-pub-1234567890123456"
              />
              <p className="mt-1 text-xs text-slate-500">
                Format attendu : <code>ca-pub-xxxxxxxxxxxxxxxx</code>
              </p>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Emplacements des annonces</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-ink">Slot haut de page</span>
              <input
                name="slotPageTop"
                defaultValue={slotPageTop}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="1234567890"
              />
              <p className="mt-1 text-xs text-slate-500">
                Emplacement sous le H1 / l’introduction.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Slot dans l’article</span>
              <input
                name="slotPageInline"
                defaultValue={slotPageInline}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="1234567890"
              />
              <p className="mt-1 text-xs text-slate-500">
                Emplacement au milieu du contenu.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Slot sidebar</span>
              <input
                name="slotPageSidebar"
                defaultValue={slotPageSidebar}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="1234567890"
              />
              <p className="mt-1 text-xs text-slate-500">
                Emplacement colonne latérale desktop.
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Slot bas de page</span>
              <input
                name="slotPageBottom"
                defaultValue={slotPageBottom}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="1234567890"
              />
              <p className="mt-1 text-xs text-slate-500">
                Emplacement après le contenu / avant ou après les blocs finaux.
              </p>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Rappel important</h2>
          <div className="mt-3 text-sm text-slate-600 space-y-2">
            <p>
              Les annonces Adsense ne seront chargées qu’après consentement
              utilisateur si ton composant de cookies renvoie <code>all</code>.
            </p>
            <p>
              Tu peux laisser certains slots vides pour ne pas afficher d’annonce
              sur certains emplacements.
            </p>
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