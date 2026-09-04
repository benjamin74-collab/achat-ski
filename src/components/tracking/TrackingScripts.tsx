"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

let gtagInitialized = false;
let lastPageViewKey: string | null = null;

function cleanValue(value?: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function ensureGtag() {
  window.dataLayer = window.dataLayer || [];

window.gtag =
  window.gtag ||
  ((...args: unknown[]) => {
    window.dataLayer.push(args);
  });

  if (!gtagInitialized) {
    window.gtag("js", new Date());
    gtagInitialized = true;
  }
}

function sendGa4PageView(ga4MeasurementId: string) {
  ensureGtag();

  const pagePath = `${window.location.pathname}${window.location.search}`;
  const pageLocation = window.location.href;
  const pageViewKey = `${ga4MeasurementId}:${pageLocation}`;

  if (lastPageViewKey === pageViewKey) {
    return;
  }

  window.gtag?.("config", ga4MeasurementId, {
    page_title: document.title,
    page_location: pageLocation,
    page_path: pagePath,
  });

  lastPageViewKey = pageViewKey;
}

export default function TrackingScripts(props: Props) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null>(null);

  const ga4MeasurementId =
    props.enabledAnalytics
      ? cleanValue(props.ga4MeasurementId)
      : null;

  const googleAdsId =
    props.enabledAds
      ? cleanValue(props.googleAdsId)
      : null;

  const gtmContainerId =
    props.enabledGtm
      ? cleanValue(props.gtmContainerId)
      : null;

  const adsenseClient =
    cleanValue(props.adsenseClient);

  const hasConsent =
    consent === "all";

  const gtagId =
    ga4MeasurementId ??
    googleAdsId;

  useEffect(() => {
    setConsent(getConsentClient());

    const onConsent = (event: Event) => {
      const customEvent =
        event as CustomEvent<Consent>;

      setConsent(
        customEvent.detail ??
          getConsentClient()
      );
    };

    window.addEventListener(
      "ms:consent",
      onConsent
    );

    return () => {
      window.removeEventListener(
        "ms:consent",
        onConsent
      );
    };
  }, []);

  useEffect(() => {
    if (
      !hasConsent ||
      !ga4MeasurementId
    ) {
      return;
    }

    sendGa4PageView(
      ga4MeasurementId
    );
  }, [
    hasConsent,
    ga4MeasurementId,
    pathname,
  ]);

  useEffect(() => {
    if (
      !hasConsent ||
      !googleAdsId
    ) {
      return;
    }

    ensureGtag();

    window.gtag?.(
      "config",
      googleAdsId
    );
  }, [
    hasConsent,
    googleAdsId,
  ]);

  if (!hasConsent) {
    return null;
  }

  return (
    <>
      {gtmContainerId ? (
        <Script
          id="gtm-script"
          src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
            gtmContainerId
          )}`}
          strategy="afterInteractive"
        />
      ) : null}

      {gtagId ? (
        <>
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
                window.gtag('js', new Date());
              `,
            }}
          />

          <Script
            id="gtag-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              gtagId
            )}`}
            strategy="afterInteractive"
            onReady={() => {
              if (ga4MeasurementId) {
                sendGa4PageView(
                  ga4MeasurementId
                );
              }
            }}
          />
        </>
      ) : null}

      {adsenseClient ? (
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
            adsenseClient
          )}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}