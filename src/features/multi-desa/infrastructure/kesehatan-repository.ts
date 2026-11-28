import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";

/** Pemeriksaan konektivitas basis data untuk halaman kesehatan platform. */
interface StatusKoneksiBasisData {
  terhubung: boolean;
  latensiMs: number | null;
  error: string | null;
}

export async function cekKoneksiBasisData(): Promise<StatusKoneksiBasisData> {
  const mulai = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { terhubung: true, latensiMs: Date.now() - mulai, error: null };
  } catch (galat) {
    return {
      terhubung: false,
      latensiMs: null,
      error: galat instanceof Error ? galat.message : "Koneksi basis data gagal.",
    };
  }
}
