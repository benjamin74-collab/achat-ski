import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { merchant: string; offerId: string } }
) {
  const url = new URL(req.url);
  const pid = url.searchParams.get("pid") ?? "";

  // TODO: plus tard => récupérer l’URL affiliée en DB
  const target = `https://example.com/?m=${params.merchant}&oid=${params.offerId}&pid=${pid}`;

  return NextResponse.redirect(target, { status: 302 });
}
