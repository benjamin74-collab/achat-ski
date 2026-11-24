"use client";

import { useEffect, useState } from "react";
import ResponsiveAffiliateAd from "./ResponsiveAffiliateAd";
import { MOBILE_AD_QUERY, selectAdCreative } from "@/lib/adCreative";

type Props = {
  desktopHtml: string;
  mobileHtml: string;
  desktopOnly?: boolean;
  className?: string;
};

export default function DeviceAffiliateAd({ desktopHtml, mobileHtml, desktopOnly = false, className }: Props) {
  const [device, setDevice] = useState<{ mobile: boolean; sidebarVisible: boolean } | null>(null);
  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_AD_QUERY);
    const sidebar = window.matchMedia("(min-width: 1024px)");
    const update = () => setDevice({ mobile: mobile.matches, sidebarVisible: sidebar.matches });
    update();
    mobile.addEventListener("change", update);
    sidebar.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      sidebar.removeEventListener("change", update);
    };
  }, []);

  // Neither creative is mounted until the viewport is known: hidden CSS blocks
  // would still fetch both ads and count impressions for the invisible variant.
  if (!device || (desktopOnly && !device.sidebarVisible)) return null;
  const html = selectAdCreative(desktopHtml, mobileHtml, device.mobile);
  if (!html.trim()) return null;
  return <ResponsiveAffiliateAd key={html} html={html} className={className} />;
}
