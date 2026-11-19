import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/config/site";
import { getCurrentSiteId } from "@/lib/currentSite";

async function getCurrentSite() {
  return getSiteConfig(await getCurrentSiteId());
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getCurrentSite();
  return {
    title: `Comment fonctionne ${site.name} ? | Prix, promotions et affiliation`,
    description: `Comprendre comment ${site.name} compare les offres, affiche les prix, prend en compte les codes promotionnels et se rémunère.`,
    alternates: { canonical: `${site.domain.replace(/\/+$/, "")}/comment-ca-marche` },
  };
}

export default async function CommentCaMarchePage() {
  const site = await getCurrentSite();
  const subject = site.id === "meilleur-robot"
    ? "aux robots du quotidien : entretien de la maison, cuisine, jardin et piscine"
    : site.id === "meilleur-ski"
      ? "au ski, au snowboard et aux sports d’hiver"
      : "aux produits de son univers";
  return (
    <main className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          Transparence
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          Comment fonctionne {site.name} ?
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-700">
          {site.name} est un comparateur de prix et un guide d’achat dédié {subject}.
          Nous aidons les visiteurs à découvrir des produits et à comparer les offres
          de marchands partenaires.
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
              site du marchand peut alors être supérieur au prix indiqué sur {site.name}.
            </p>
            <p className="mt-3 leading-7 text-slate-700">
              Pour bénéficier du tarif annoncé, il peut être nécessaire de saisir un
              code au panier ou de remplir les conditions de la promotion. Les remises
              peuvent être limitées dans le temps, exclure certains produits ou être
              soumises à un montant minimum de commande.
            </p>
            <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-slate-800">
              Exemple : un article à 500 € chez un marchand peut apparaître à 450 €
              sur {site.name} lorsqu’une remise de 10 % est applicable.
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
              Comment {site.name} se rémunère-t-il ?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Certains liens vers les marchands sont affiliés. Si vous réalisez
              un achat après avoir suivi l’un de ces liens, {site.name} peut
              percevoir une commission versée par le marchand. Cette commission
              n’ajoute pas de frais spécifiques à votre commande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-950">
              Qui gère la commande et le service après-vente ?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              {site.name} ne vend pas directement les produits comparés.
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
