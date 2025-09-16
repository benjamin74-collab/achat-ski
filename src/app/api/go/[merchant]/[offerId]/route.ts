export async function GET(
  request: Request,
  context: { params: Promise<{ merchant: string; offerId: string }> }
) {
  const { merchant, offerId } = await context.params;
  const url = new URL(request.url);
  const pid = url.searchParams.get("pid") ?? "";

  const target = `https://example.com/?m=${merchant}&oid=${offerId}&pid=${pid}`;
  return Response.redirect(target, 302);
}
