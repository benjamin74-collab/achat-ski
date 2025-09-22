import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ton helper Prisma (singleton)
export const runtime = "nodejs";

// Ajoute/écrase un paramètre de query proprement
function withQueryParam(rawUrl: string, key: string, value: string) {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    // Si l’URL est "exotique", on tente un fallback trivial
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { merchant: string; offerId: string } }
) {
  const offerIdNum = Number(params.offerId);
  if (!Number.isFinite(offerIdNum)) {
    return NextResponse.json({ error: "Bad offerId" }, { status: 400 });
  }

  // Récupère l’offre + le produit (pour le slug) + le marchand
  const offer = await prisma.offer.findUnique({
    where: { id: offerIdNum },
    include: {
      merchant: true,
      sku: { include: { product: true } },
    },
  });

  if (!offer || !offer.merchant || !offer.sku?.product) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  // Optionnel : vérifier que le slug marchand dans l’URL matche la DB
  if (offer.merchant.slug !== params.merchant) {
    // on ne bloque pas, on redirige quand même
    // return NextResponse.json({ error: "Merchant mismatch" }, { status: 400 });
  }

  const subParam = process.env.AFF_SUBID_PARAM || "subid";
  const prefix = process.env.AFF_SUBID_PREFIX || "achat-ski";
  const productSlug = offer.sku.product.slug;

  // Valeur subid : libre, courte et utile pour le reporting
  const subValue = `${prefix}_${productSlug}_${offer.id}`;

  const finalUrl = withQueryParam(offer.affiliateUrl, subParam, subValue);

  // Log du clic (MVP)
	try {
		await prisma.click.create({
		  data: {
			offerId: offer.id,
			productId: offer.sku.productId,
			// 💡 enregistre le prix total au moment du clic (prix + port si dispo)
			priceCentsAtClick: (offer.priceCents ?? 0) + (offer.shippingCents ?? 0),
			// Si ton modèle possède ces colonnes, tu peux aussi ajouter :
			// currencyAtClick: offer.currency,
			// attributes: { ua: req.headers.get("user-agent") ?? null },
		  },
		});
	  } catch {
		// pas bloquant : on redirige même si le log plante
	  }

  // Redirection 302 vers l’affilié
  return NextResponse.redirect(finalUrl, { status: 302 });
}
