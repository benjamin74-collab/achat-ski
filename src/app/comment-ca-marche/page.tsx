import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comment fonctionne Meilleur-Ski ? | Prix, promotions et affiliation",
  description:
    "Comprendre comment Meilleur-Ski compare les offres, affiche les prix, prend en compte les codes promotionnels et se rémunère.",
};

export default function CommentCaMarchePage() {
  return (
    <main className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          Transparence
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          Comment fonctionne Meilleur-Ski ?
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-700">
          Meilleur-Ski est un comparateur de prix et un guide d’achat dédié au ski,
          au snowboard et aux sports d’hiver. Nous aidons les visiteurs à découvrir
          des équipements et à comparer les offres de marchands spécialisés.
        </p>

        <div className="mt-9 space-y-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-9">
          <section>
            <h2 className="text-xl font-bold text-slate-950">D’où viennent les prix ?</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Les prix sont issus des informations fournies par les marchands partenaires,
              notamment leurs catalogues de produits. Ils sont actualisés régulièrement,
              mais peuvent évoluer entre deux mises à jour.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Les prix peuvent-ils inclure un code promotionnel ?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Oui. Certains prix transmis par les marchands peuvent déjà tenir compte
              d’une remise ou d’un code promotionnel. Le prix initial affiché sur le
              site du marchand peut alors être supérieur au prix indiqué sur Meilleur-Ski.
            </p>
            <p className="mt-3 leading-7 text-slate-700">
              Pour bénéficier du tarif annoncé, il peut être nécessaire de saisir un
              code au panier ou de remplir les conditions de la promotion. Les remises
              peuvent être limitées dans le temps, exclure certains produits ou être
              soumises à un montant minimum de commande.
            </p>
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-slate-800">
              Exemple : un article à 500 € chez un marchand peut apparaître à 450 €
              sur Meilleur-Ski lorsqu’une remise de 10 % est applicable.
              Cet exemple est illustratif et ne constitue pas une offre commerciale.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Pourquoi le prix est-il parfois différent chez le marchand ?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Une différence peut provenir d’un code promo, d’une promotion expirée,
              d’une évolution récente du tarif ou d’un décalage de mise à jour.
              Les frais de livraison et les conditions de disponibilité peuvent
              également varier. Vérifiez toujours le prix final et les conditions
              de l’offre dans le panier du marchand avant de commander.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Comment Meilleur-Ski se rémunère-t-il ?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Certains liens vers les marchands sont affiliés. Si vous réalisez
              un achat après avoir suivi l’un de ces liens, Meilleur-Ski peut
              percevoir une commission versée par le marchand. Cette commission
              n’ajoute pas de frais spécifiques à votre commande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Qui gère la commande et le service après-vente ?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Meilleur-Ski ne vend pas directement les produits comparés.
              Le paiement, la livraison, les retours et le service après-vente
              sont assurés par le marchand auprès duquel vous passez commande.
            </p>
          </section>
        </div>

        <p className="mt-8 text-sm text-slate-600">
          Une question ? <Link href="/contact" className="font-semibold text-brand-700 hover:underline">Contactez-nous</Link>.
        </p>
      </div>
    </main>
  );
}
