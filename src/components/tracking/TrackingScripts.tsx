"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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

const scriptPromises = new Map<string, Promise<void>>();
const configuredAnalyticsIds = new Set<string>();
const configuredAdsIds = new Set<string>();

let gtagJsInitialized = false;
let lastPageViewKey: string | null = null;

function loadScriptOnce(
  src: string,
  key: string,
  options?: {
    crossOrigin?: string;
  }
): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-track-key="${key}"]`
  );

  if (existing?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  const existingPromise = scriptPromises.get(key);

  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => reject(new Error(`Script loading failed: ${src}`)),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.dataset.trackKey = key;

    if (options?.crossOrigin) {
      script.crossOrigin = options.crossOrigin;
    }

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => reject(new Error(`Script loading failed: ${src}`)),
      { once: true }
    );

    document.head.appendChild(script);
  });

  scriptPromises.set(key, promise);

  return promise;
}

function initGtag() {
  window.dataLayer = window.dataLayer || [];

  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
}

function initGtagJsOnce() {
  if (gtagJsInitialized) {
    return;
  }

  window.gtag?.("js", new Date());
  gtagJsInitialized = true;
}

function sendPageView(
  ga4MeasurementId: string,
  pathname: string,
  search: string
) {
  const pagePath = search ? `${pathname}?${search}` : pathname;
  const pageLocation = `${window.location.origin}${pagePath}`;
  const pageViewKey = `${ga4MeasurementId}:${pageLocation}`;

  if (lastPageViewKey === pageViewKey) {
    return;
  }

  window.gtag?.("event", "page_view", {
    page_title: document.title,
    page_location: pageLocation,
    page_path: pagePath,
  });

  lastPageViewKey = pageViewKey;
}

async function applyTracking(
  consent: Consent | null,
  props: Props,
  pathname: string,
  search: string
) {
  if (consent !== "all") {
    return;
  }

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
    void loadScriptOnce(
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
        gtmContainerId
      )}`,
      `gtm-${gtmContainerId}`
    );
  }

  const needsGtag =
    (enabledAnalytics && ga4MeasurementId) ||
    (enabledAds && googleAdsId);

  if (needsGtag) {
    const gtagId = ga4MeasurementId || googleAdsId;

    if (gtagId) {
      initGtag();

      await loadScriptOnce(
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          gtagId
        )}`,
        `gtag-${gtagId}`
      );

      initGtagJsOnce();

      if (enabledAnalytics && ga4MeasurementId) {
        if (!configuredAnalyticsIds.has(ga4MeasurementId)) {
          window.gtag?.("config", ga4MeasurementId, {
            send_page_view: false,
          });

          configuredAnalyticsIds.add(ga4MeasurementId);
        }

        sendPageView(
          ga4MeasurementId,
          pathname,
          search
        );
      }

      if (enabledAds && googleAdsId) {
        if (!configuredAdsIds.has(googleAdsId)) {
          window.gtag?.("config", googleAdsId);
          configuredAdsIds.add(googleAdsId);
        }
      }
    }
  }

  if (adsenseClient) {
    void loadScriptOnce(
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    void applyTracking(
      getConsentClient(),
      props,
      pathname,
      search
    );

    const onConsent = (event: Event) => {
      const customEvent = event as CustomEvent<Consent>;

      void applyTracking(
        customEvent.detail ?? getConsentClient(),
        props,
        pathname,
        search
      );
    };

    window.addEventListener("ms:consent", onConsent);

    return () => {
      window.removeEventListener("ms:consent", onConsent);
    };
  }, [
    props.ga4MeasurementId,
    props.googleAdsId,
    props.googleAdsConversionLabel,
    props.gtmContainerId,
    props.adsenseClient,
    props.enabledAnalytics,
    props.enabledAds,
    props.enabledGtm,
    pathname,
    search,
  ]);

  return null;
}