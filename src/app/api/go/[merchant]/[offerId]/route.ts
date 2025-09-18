import { prisma } from "@/lib/prisma";

// Prisma a besoin du runtime Node
export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ merchant: string; offerId: string }> }
) {
  const { merchant, offerId } = await context.params;
  const url = new URL(request.url);
  const pid = url.searchParams.get("pid") ?? "";

  // Récupère l'offre en DB
  const offer = await prisma.offer.findUnique({
    where: { id: Number(offerId) },
    include: { sku: { include: { product: true } }, merchant: true },
  });

  // Si pas trouvée: fallback neutre
  if (!offer) {
    const fallback = `https://example.com/?m=${merchant}&oid=${offerId}&pid=${pid}`;
    return Response.redirect(fallback, 302);
  }

  // Enregistre le clic
  const subId = `${pid}.${Date.now()}`;
  await prisma.click.create({
    data: {
      offerId: offer.id,
      productId: offer.sku.productId,
      priceCentsAtClick: offer.priceCents,
      subId,
      referrer: request.headers.get("referer") ?? undefined,
    },
  });

  // Ajoute un paramètre de tracking générique ?subid=
  const targetUrl = new URL(offer.affiliateUrl);
  if (!targetUrl.searchParams.has("subid")) targetUrl.searchParams.set("subid", subId);

  return Response.redirect(targetUrl.toString(), 302);
}
