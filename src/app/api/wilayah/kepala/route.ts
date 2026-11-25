import { NextResponse } from "next/server";

import { cariKepalaWilayah } from "@/features/wilayah/application/use-cases";
import { appErrorStatus, isAppError } from "@/lib/errors";

export const runtime = "nodejs";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });

function handleError(error: unknown) {
  if (isAppError(error)) return json({ error: error.message }, appErrorStatus(error.code));
  console.error("Pencarian kepala wilayah gagal:", error);
  return json({ error: "Pencarian kepala wilayah gagal diproses." }, 500);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const hasil = await cariKepalaWilayah(url.searchParams.get("q") ?? "");
    return json({ hasil });
  } catch (error) {
    return handleError(error);
  }
}
