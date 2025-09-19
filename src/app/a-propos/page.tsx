export const metadata = { title: "À propos — Achat-Ski" };

export default function AboutPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold">À propos</h1>
      <p className="mt-3 text-neutral-700 max-w-2xl">
        Achat-Ski.com est un comparateur de prix dédié au matériel de ski. Nous agrégeons les offres
        de marchands partenaires et redirigeons vers leur site pour finaliser l’achat.
      </p>
      <ul className="mt-6 list-disc pl-6 text-neutral-700 space-y-2">
        <li>Les liens peuvent être affiliés (rémunération à la vente).</li>
        <li>Les prix et disponibilités peuvent évoluer rapidement.</li>
        <li>Pour toute question : contact@achat-ski.com</li>
      </ul>
    </div>
  );
}
