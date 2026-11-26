import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { mediaSettings } from "@/db/schema/media-settings";
import {
  KATEGORI_LAMPIRAN,
  maxSizeBytesDariInput,
  pengaturanEfektifDariBaris,
  validasiInputPengaturan,
  type KategoriLampiran,
  type MediaSettingsEfektif,
  type MediaSettingsInput,
} from "@/features/kebijakan-berkas/domain/pengaturan-berkas";

/**
 * Ambil pengaturan efektif untuk satu desa & kategori.
 * Nilai dari DB meng-override default domain. Kolom NULL = ambil dari default.
 */
export async function getMediaSettings(
  villageId: number,
  kategori: KategoriLampiran,
): Promise<MediaSettingsEfektif> {
  const [row] = await db
    .select()
    .from(mediaSettings)
    .where(and(eq(mediaSettings.villageId, villageId), eq(mediaSettings.kategori, kategori)));

  return pengaturanEfektifDariBaris(kategori, row ?? null);
}

/**
 * Ambil seluruh pengaturan untuk satu desa (semua kategori).
 * Kategori tanpa override tetap mengembalikan default domain.
 */
export async function getAllMediaSettings(villageId: number): Promise<MediaSettingsEfektif[]> {
  const rows = await db.select().from(mediaSettings).where(eq(mediaSettings.villageId, villageId));

  const map = new Map<string, (typeof rows)[number]>();
  for (const r of rows) map.set(r.kategori, r);

  return KATEGORI_LAMPIRAN.map((kat) => pengaturanEfektifDariBaris(kat, map.get(kat) ?? null));
}

/** Simpan atau perbarui pengaturan untuk satu desa & kategori. */
export async function upsertMediaSettings(
  villageId: number,
  input: MediaSettingsInput,
): Promise<void> {
  validasiInputPengaturan(input);

  const maxSizeBytes = maxSizeBytesDariInput(input.maxSizeMb);

  await db
    .insert(mediaSettings)
    .values({
      villageId,
      kategori: input.kategori,
      mimeAllowlist: input.mimeAllowlist,
      maxFiles: input.maxFiles,
      maxSizeBytes,
    })
    .onDuplicateKeyUpdate({
      set: {
        mimeAllowlist: input.mimeAllowlist,
        maxFiles: input.maxFiles,
        maxSizeBytes,
      },
    });
}

/** Hapus pengaturan (kembali ke default domain). */
export async function resetMediaSettings(
  villageId: number,
  kategori: KategoriLampiran,
): Promise<void> {
  await db
    .delete(mediaSettings)
    .where(and(eq(mediaSettings.villageId, villageId), eq(mediaSettings.kategori, kategori)));
}
