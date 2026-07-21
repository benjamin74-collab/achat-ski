import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Ajoute/écrase un paramètre de query proprement
function withQueryParam(rawUrl: string, key: string, value: string) {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    const sep = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ merchant: string; offerId: string }> }
) {
  const { merchant, offerId } = await params;

  const offerIdNum = Number(offerId);

  if (!Number.isFinite(offerIdNum)) {
    return NextResponse.json({ error: "Bad offerId" }, { status: 400 });
  }

  const offer = await prisma.offer.findUnique({
    where: {
      id: offerIdNum,
    },
    include: {
      merchant: true,
      product: true,
    },
  });

  if (!offer || !offer.merchant || !offer.product) {
    return NextResponse.json(
      { error: "Offer not found" },
      { status: 404 }
    );
  }

  // Vérification optionnelle
  if (offer.merchant.slug !== merchant) {
    // volontairement ignoré
  }

  const subParam = process.env.AFF_SUBID_PARAM || "subid";
  const prefix = process.env.AFF_SUBID_PREFIX || "meilleur-ski";

  const productSlug = offer.product.slug;

  const subValue = `${prefix}_${productSlug}_${offer.id}`;

  const finalUrl = withQueryParam(
    offer.affiliateUrl,
    subParam,
    subValue
  );

  try {
    await prisma.click.create({
      data: {
        offerId: offer.id,
        productId: offer.productId,
        priceCentsAtClick:
          (offer.priceCents ?? 0) +
          (offer.shippingCents ?? 0),

        // Si ces champs existent dans ton modèle :
        // currencyAtClick: offer.currency,
        // ip: req.ip,
        // userAgent: req.headers.get("user-agent"),
      },
    });
  } catch {
    // Le tracking ne doit jamais empêcher la redirection
  }

  return NextResponse.redirect(finalUrl, 302);
}