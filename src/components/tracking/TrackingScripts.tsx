"use client";

import { useEffect } from "react";
import { getConsentClient, type Consent } from "@/lib/consent";

type Props = {
  ga4MeasurementId?: string | null;
  googleAdsId?: string | null;
  googleAdsConversionLabel?: string | null;
  gtmContainerId?: string | null;
  adsenseClient?: string | null;
  enabledAnalytics?: boolean;
  enabledAds?: boolean;
  enabledGtm?: boolean;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadScriptOnce(
  src: string,
  key: string,
  options?: {
    crossOrigin?: string;
  }
) {
  if (document.querySelector(`script[data-track-key="${key}"]`)) return;

  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.dataset.trackKey = key;

  if (options?.crossOrigin) {
    s.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(s);
}

function initGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
}

function applyTracking(consent: Consent | null, props: Props) {
  if (consent !== "all") return;

  const {
    ga4MeasurementId,
    googleAdsId,
    gtmContainerId,
	adsenseClient,
    enabledAnalytics,
    enabledAds,
    enabledGtm,
  } = props;

  if (enabledGtm && gtmContainerId) {
    loadScriptOnce(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmContainerId)}`, `gtm-${gtmContainerId}`);
  }

  const needsGtag = (enabledAnalytics && ga4MeasurementId) || (enabledAds && googleAdsId);

  if (needsGtag) {
    const gtagId = ga4MeasurementId || googleAdsId;
    if (gtagId) {
      loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagId)}`, `gtag-${gtagId}`);
      initGtag();

      if (enabledAnalytics && ga4MeasurementId) {
        window.gtag?.("js", new Date());
        window.gtag?.("config", ga4MeasurementId, { anonymize_ip: true });
      }

      if (enabledAds && googleAdsId) {
        window.gtag?.("js", new Date());
        window.gtag?.("config", googleAdsId);
      }
    }
  }
  
  if (adsenseClient) {
  loadScriptOnce(
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
      adsenseClient
    )}`,
    `adsense-${adsenseClient}`,
    {
      crossOrigin: "anonymous",
    }
  );
}
}

export default function TrackingScripts(props: Props) {
  useEffect(() => {
    applyTracking(getConsentClient(), props);

    const onConsent = (event: Event) => {
      const customEvent = event as CustomEvent<Consent>;
      applyTracking(customEvent.detail ?? getConsentClient(), props);
    };

    window.addEventListener("ms:consent", onConsent);
    return () => window.removeEventListener("ms:consent", onConsent);
  }, [
    props.ga4MeasurementId,
    props.googleAdsId,
    props.googleAdsConversionLabel,
    props.gtmContainerId,
	props.adsenseClient,
    props.enabledAnalytics,
    props.enabledAds,
    props.enabledGtm,
  ]);

  return null;
}