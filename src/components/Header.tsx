// src/components/Header.tsx
"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useRef } from "react";
import Link from "next/link";
import Logo from "./Logo";

export default function Header() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value?.trim() ?? "";
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/5 border-b border-white/10">
      <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Logo withDotCom className="mr-2" />
        <nav className="hidden md:flex items-center gap-3 ml-4">
          <Link href="/c/skis-all-mountain" className="text-white/80 hover:text-white">Skis</Link>
          <Link href="/c/fixations" className="text-white/80 hover:text-white">Fixations</Link>
          <Link href="/c/chaussures" className="text-white/80 hover:text-white">Chaussures</Link>
          <Link href="/brands" className="text-white/80 hover:text-white">Marques</Link>
        </nav>
        <form onSubmit={onSubmit} className="ml-auto flex-1 max-w-md">
          <div className="relative">
            <input
              ref={inputRef}
              name="q"
              placeholder="Rechercher un modèle…"
              className="w-full rounded-xl border border-white/15 bg-white/90 pl-3 pr-10 py-2 outline-none focus:ring-2 focus:ring-brand/60"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 btn px-3 py-1" aria-label="Rechercher">OK</button>
          </div>
        </form>
        <Link href="/about" className="ml-3 btn outline">À propos</Link>
      </div>
    </header>
  );
}
