import { NextResponse } from "next/server";

import { getPetaPublik } from "@/features/pertanahan-gis/gis/application/use-cases";

export async function GET() {
  const data = await getPetaPublik();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store", Vary: "Host" },
  });
}
