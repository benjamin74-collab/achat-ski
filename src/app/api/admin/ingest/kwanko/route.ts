import { NextRequest, NextResponse } from "next/server";
//import { headers } from "next/headers";

// On exécute la même logique que le script CLI, mais en version “légère”
// Pour de gros flux, préfère lancer le script via GitHub Actions ou un job externe.

export const runtime = "nodejs";

async function runIngestion() {
  const { spawn } = await import("node:child_process");
  return new Promise<{ code: number | null; out: string; err: string }>((resolve) => {
    const proc = spawn("node", ["./node_modules/tsx/dist/cli.js", "scripts/ingest_kwanko.ts"], {
      env: process.env,
    });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => resolve({ code, out, err }));
  });
}

export async function POST(req: NextRequest) {
  // ✅ lire la clé directement depuis la requête
  const keyFromHeader = req.headers.get("x-api-key");
  const keyFromQuery = new URL(req.url).searchParams.get("key");
  const expected = process.env.KWANKO_INGEST_SECRET;

  if (!expected || (keyFromHeader !== expected && keyFromQuery !== expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code, out, err } = await runIngestion();
  const ok = code === 0;
  return NextResponse.json(
    { ok, code, out: out.slice(-4000), err: err.slice(-4000) },
    { status: ok ? 200 : 500 }
  );
}
