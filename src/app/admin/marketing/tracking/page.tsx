import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";
import { saveTrackingSettings } from "@/app/actions/tracking";

export default async function AdminTrackingPage() {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const settings = await prisma.trackingSettings.findUnique({
    where: { siteId },
  });

  const enabledAnalytics = settings?.enabledAnalytics ?? false;
  const enabledAds = settings?.enabledAds ?? false;
  const enabledGtm = settings?.enabledGtm ?? false;

  const ga4MeasurementId = settings?.ga4MeasurementId ?? "";
  const googleAdsId = settings?.googleAdsId ?? "";
  const googleAdsConversionLabel = settings?.googleAdsConversionLabel ?? "";
  const gtmContainerId = settings?.gtmContainerId ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ring bg-white p-5">
        <h1 className="text-lg font-semibold text-ink">Marketing · Tracking</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configuration des scripts de mesure pour le site{" "}
          <span className="font-medium">{siteConfig.id}</span>.
        </p>
      </div>

      <form action={saveTrackingSettings} className="space-y-6">
        <input type="hidden" name="siteId" value={siteId} />

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Google Analytics 4</h2>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="enabledAnalytics" defaultChecked={enabledAnalytics} />
              <span className="text-sm text-ink">Activer Google Analytics 4</span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Measurement ID</span>
              <input
                name="ga4MeasurementId"
                defaultValue={ga4MeasurementId}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="G-XXXXXXXXXX"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Google Ads</h2>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="enabledAds" defaultChecked={enabledAds} />
              <span className="text-sm text-ink">Activer Google Ads</span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Google Ads ID</span>
              <input
                name="googleAdsId"
                defaultValue={googleAdsId}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="AW-123456789"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Conversion label</span>
              <input
                name="googleAdsConversionLabel"
                defaultValue={googleAdsConversionLabel}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="AbCdEfGhIjKlMnOpQr"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Google Tag Manager</h2>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 rounded-xl border border-ring bg-muted/30 px-3 py-3">
              <input type="checkbox" name="enabledGtm" defaultChecked={enabledGtm} />
              <span className="text-sm text-ink">Activer Google Tag Manager</span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Container ID</span>
              <input
                name="gtmContainerId"
                defaultValue={gtmContainerId}
                className="mt-2 w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
                placeholder="GTM-XXXXXXX"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ring bg-white p-5">
          <h2 className="text-base font-semibold text-ink">Rappel</h2>
          <p className="mt-3 text-sm text-slate-600">
            Les scripts ne seront chargés qu’après consentement utilisateur avec la valeur
            <code className="mx-1">all</code>.
          </p>
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