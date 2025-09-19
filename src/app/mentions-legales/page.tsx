export const metadata = { title: "Mentions légales — Achat-Ski" };

export default function MentionsPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold">Mentions légales</h1>
      <div className="mt-4 space-y-3 text-neutral-700 max-w-2xl">
        <p><strong>Éditeur :</strong> Achat-Ski.com</p>
        <p><strong>Contact :</strong> contact@achat-ski.com</p>
        <p><strong>Hébergement :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
        <p><strong>Responsabilité :</strong> Les informations (prix, stock) sont fournies à titre indicatif et
          peuvent varier chez les marchands.</p>
      </div>
    </div>
  );
}
