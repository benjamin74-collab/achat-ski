import Link from "next/link";
import SearchBar from "@/components/SearchBar";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <a href="/" className="font-bold text-xl">Achat-Ski</a>
        <div className="flex-1 hidden md:block">
          <SearchBar />
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/c/skis-all-mountain/">Skis</a>
          <a href="/c/fixations/">Fixations</a>
          <a href="/c/chaussures/">Chaussures</a>
        </nav>
      </div>
    </header>
  );
}

