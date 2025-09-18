export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container-page flex h-14 items-center justify-between">
        <a href="/" className="font-extrabold tracking-tight">
          Achat-Ski<span className="text-neutral-400">.com</span>
        </a>
        <nav className="flex gap-4 text-sm">
          <a href="/c/skis-all-mountain" className="hover:underline">Skis All-Mountain</a>
          <a href="/c/skis-rando" className="hover:underline">Ski de rando</a>
          <a href="/c/fixations" className="hover:underline">Fixations</a>
          <a href="/c/chaussures" className="hover:underline">Chaussures</a>
        </nav>
      </div>
    </header>
  );
}
