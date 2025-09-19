import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container-page flex h-14 items-center justify-between">
        <Link href="/" className="font-extrabold tracking-tight">
          Achat-Ski<span className="text-neutral-400">.com</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/c/skis-all-mountain" className="hover:underline">Skis All-Mountain</Link>
          <Link href="/c/skis-rando" className="hover:underline">Ski de rando</Link>
          <Link href="/c/fixations" className="hover:underline">Fixations</Link>
          <Link href="/c/chaussures" className="hover:underline">Chaussures</Link>
        </nav>
      </div>
    </header>
  );
}
