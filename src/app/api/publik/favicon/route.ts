import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

import { getFaviconPublik } from "@/features/identitas-desa/application/identitas-desa-use-cases";
import { bacaBerkasMediaPublik } from "@/features/publik/application/media-publik";
import { isAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/** Ikon default aplikasi, dipakai bila desa belum mengunggah logo/favicon. */
const IKON_DEFAULT = join(process.cwd(), "public", "images", "flexidesa-icon.svg");

/** Content-Type berdasarkan ekstensi berkas favicon (logo boleh JPG/PNG/GIF/WEBP/SVG). */
function tipeKonten(path: string): string {
  const ekstensi = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ekstensi) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/x-icon";
    default:
      return "image/png";
  }
}

/** Sajikan ikon default aplikasi agar favicon tidak pernah kosong. */
async function ikonDefault() {
  try {
    const bytes = await readFile(IKON_DEFAULT);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function GET() {
  try {
    const { path } = await getFaviconPublik();
    if (!path) return ikonDefault();
    const bytes = await bacaBerkasMediaPublik(path);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": tipeKonten(path),
        "Cache-Control": "public, max-age=60, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        Vary: "Host",
      },
    });
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") return ikonDefault();
    return NextResponse.json({ error: "Favicon tidak tersedia." }, { status: 404 });
  }
}
