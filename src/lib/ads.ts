// src/lib/ads.ts

export function injectInlineAdMarker(
  html: string,
  marker = "<!--ADSENSE_INLINE_AUTO-->",
): string {
  if (!html) return html;

  // Priorité 1 : après le 2e <h2>
  let h2Count = 0;
  const withH2Marker = html.replace(/<\/h2>/gi, (match) => {
    h2Count += 1;
    if (h2Count === 2) {
      return `${match}${marker}`;
    }
    return match;
  });

  if (h2Count >= 2) return withH2Marker;

  // Priorité 2 : après le 3e paragraphe
  let pCount = 0;
  const withPMarker = html.replace(/<\/p>/gi, (match) => {
    pCount += 1;
    if (pCount === 3) {
      return `${match}${marker}`;
    }
    return match;
  });

  if (pCount >= 3) return withPMarker;

  // Fallback : pas d'injection si contenu trop court
  return html;
}

export function splitHtmlByMarker(
  html: string,
  marker = "<!--ADSENSE_INLINE_AUTO-->",
): { before: string; after: string; hasMarker: boolean } {
  const index = html.indexOf(marker);

  if (index === -1) {
    return {
      before: html,
      after: "",
      hasMarker: false,
    };
  }

  return {
    before: html.slice(0, index),
    after: html.slice(index + marker.length),
    hasMarker: true,
  };
}