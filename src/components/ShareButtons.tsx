// src/components/ShareButtons.tsx
"use client";
import { useCallback } from "react";
import Link from "next/link";

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path d="M18.9 3H22l-8.2 9.4L22.5 21H16l-5-6.1L5 21H2l8.9-10.3L1.7 3H8l4.5 5.5L18.9 3Z" />
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path d="M13 22v-8h3l1-4h-4V7a2 2 0 0 1 2-2h2V1h-3a5 5 0 0 0-5 5v4H6v4h3v8h4Z" />
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path d="M6 9h4v12H6zM8 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 6c2.2 0 4 1.8 4 4v8h-4v-7a2 2 0 1 0-4 0v7h-4V9h4v1.6C11 9.6 12.4 9 14 9Z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm11 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-6 2.5A5.5 5.5 0 1 1 6.5 14 5.5 5.5 0 0 1 12 8.5Zm0 2A3.5 3.5 0 1 0 15.5 14 3.5 3.5 0 0 0 12 10.5Z" />
    </svg>
  );
}

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const shareNative = useCallback(async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* ignore */ }
    }
  }, [title, url]);

  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const ln = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const ig = `https://www.instagram.com/?url=${encodeURIComponent(url)}`; // Instagram n’a pas de vrai share URL web, on bascule vers l’app

  const cls =
    "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm hover:bg-muted transition";

  return (
    <div className="flex items-center gap-2">
      <button onClick={shareNative} className={cls} aria-label="Partager">
        <span>Partager</span>
      </button>
      <Link href={tw} target="_blank" className={cls} aria-label="Partager sur X">
        <IconX /><span className="sr-only">X</span>
      </Link>
      <Link href={fb} target="_blank" className={cls} aria-label="Partager sur Facebook">
        <IconFacebook /><span className="sr-only">Facebook</span>
      </Link>
      <Link href={ln} target="_blank" className={cls} aria-label="Partager sur LinkedIn">
        <IconLinkedIn /><span className="sr-only">LinkedIn</span>
      </Link>
      <Link href={ig} target="_blank" className={cls} aria-label="Ouvrir Instagram">
        <IconInstagram /><span className="sr-only">Instagram</span>
      </Link>
    </div>
  );
}
