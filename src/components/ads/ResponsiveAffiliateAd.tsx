"use client";

import { useEffect, useRef, useState } from "react";

type Props = { html: string; className?: string };

// Scale the complete fixed-size creative, not merely the iframe viewport.
// This wrapper is reserved for affiliate HTML; never use it for AdSense.
export default function ResponsiveAffiliateAd({ html, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const creativeRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 1, height: 0, left: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const creative = creativeRef.current;
    if (!container || !creative) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const available = container.clientWidth;
        const width = Math.max(creative.offsetWidth, creative.scrollWidth);
        const height = Math.max(creative.offsetHeight, creative.scrollHeight);
        if (!available || !width || !height) return;
        const scale = Math.min(1, available / width);
        const next = { scale, height: height * scale, left: (available - width * scale) / 2 };
        setLayout((old) => old.scale === next.scale && old.height === next.height && old.left === next.left ? old : next);
      });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    resize.observe(creative);
    const mutations = new MutationObserver(measure);
    mutations.observe(creative, { childList: true, subtree: true, attributes: true });
    creative.addEventListener("load", measure, true);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      creative.removeEventListener("load", measure, true);
    };
  }, [html]);

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 max-w-full overflow-hidden ${className ?? ""}`} style={layout.height ? { height: layout.height } : undefined}>
      <div
        ref={creativeRef}
        style={{ width: "max-content", transform: `translateX(${layout.left}px) scale(${layout.scale})`, transformOrigin: "top left" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
