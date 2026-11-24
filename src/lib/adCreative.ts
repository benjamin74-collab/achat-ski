export const MOBILE_AD_QUERY = "(max-width: 767px)";

// Preserve existing placements when the new, optional mobile field is empty.
export function selectAdCreative(desktopHtml: string, mobileHtml: string, mobile: boolean): string {
  return mobile ? (mobileHtml.trim() ? mobileHtml : desktopHtml) : desktopHtml;
}
