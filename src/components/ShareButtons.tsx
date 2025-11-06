// src/components/ShareButtons.tsx
"use client";
import { useCallback } from "react";
import Link from "next/link";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const shareNative = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* ignore */ }
    }
  }, [title, url]);

  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const ln = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <button onClick={shareNative} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-muted">Partager</button>
      <Link href={tw} target="_blank" className="px-3 py-1.5 rounded-lg border text-sm hover:bg-muted">X/Twitter</Link>
      <Link href={fb} target="_blank" className="px-3 py-1.5 rounded-lg border text-sm hover:bg-muted">Facebook</Link>
      <Link href={ln} target="_blank" className="px-3 py-1.5 rounded-lg border text-sm hover:bg-muted">LinkedIn</Link>
    </div>
  );
}
