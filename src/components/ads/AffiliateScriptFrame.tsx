"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Admin-authored script tags execute inside a separate document per placement.
 * An innerHTML insertion alone would leave script tags inert on client navigation.
 */
export default function AffiliateScriptFrame({ html }: { html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [size, setSize] = useState({ width: 300, height: 1 });
  const source = useMemo(() => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;border:0}body{width:max-content}img,iframe{max-width:none}iframe{border:0}img{display:block}</style></head><body>${html}</body></html>`, [html]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const observe = () => {
    cleanupRef.current?.();
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    const body = doc.body;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const width = Math.ceil(Math.max(body.offsetWidth, body.scrollWidth));
        const height = Math.ceil(Math.max(body.offsetHeight, body.scrollHeight));
        if (width && height) setSize(old => old.width === width && old.height === height ? old : { width, height });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    body.addEventListener("load", measure, true);
    measure();
    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      body.removeEventListener("load", measure, true);
    };
  };
  return <iframe ref={frameRef} title="Publicité partenaire" srcDoc={source} width={size.width} height={size.height} onLoad={observe} scrolling="no" style={{ display: "block", border: 0, maxWidth: "none" }} />;
}
