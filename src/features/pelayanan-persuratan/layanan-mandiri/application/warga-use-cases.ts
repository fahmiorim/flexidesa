import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { bacaMedia } from "@/features/media/infrastructure/media-storage";
import { type AjukanSuratInput } from "@/features/pelayanan-persuratan/layanan-mandiri/application/ajukan-surat";
import { type DokumenWargaDTO } from "@/features/pelayanan-persuratan/layanan-mandiri/domain/dokumen-warga";
import {
  parseBerkasSyarat,
  type BerkasSyarat,
  type JenisSuratWarga,
} from "@/features/pelayanan-persuratan/layanan-mandiri/domain/layanan-mandiri";
import {
  findDokumenWarga,
  keDTO,
  listDokumenWarga,
} from "@/features/pelayanan-persuratan/layanan-mandiri/infrastructure/dokumen-warga-repository";
import {
  getPermohonanWarga,
  listPermohonanWarga,
  listSuratUntukWarga,
} from "@/features/pelayanan-persuratan/layanan-mandiri/infrastructure/layanan-mandiri-repository";
import { requireWarga, requireWargaAktif } from "@/lib/dal";
import { notFound } from "@/lib/errors";

/** Semua jenis surat aktif yang dapat diajukan warga. */
export async function listJenisSuratWargaData(): Promise<JenisSuratWarga[]> {
  const user = await requireWarga();
  const villageId = await resolveVillageId(user);
  return listSuratUntukWarga(villageId);
}

/** Satu jenis surat aktif; `null` bila tidak ada/tidak aktif di desa ini. */

/** Riwayat permohonan milik warga yang sedang login. */
export async function listPermohonanWargaData() {
  const user = await requireWarga();
  const villageId = await resolveVillageId(user);
  return listPermohonanWarga(villageId, user.residentId);
}

export type AjukanSuratWargaInput = AjukanSuratInput;

/**
 * Ajukan surat atas nama warga yang sedang login.
 *
 * `residentId` tidak pernah diterima dari input; alur penyimpanan dipakai
 * bersama dengan anjungan kiosk lewat `simpanPermohonanSurat`.
 */

/** Berkas syarat milik permohonan warga; dipakai route unduhan privat. */
export async function getBerkasSyaratWargaData(
  permohonanId: number,
  syaratId: number,
): Promise<BerkasSyarat> {
  const user = await requireWargaAktif();
  const villageId = await resolveVillageId(user);
  const permohonan = await getPermohonanWarga(villageId, user.residentId, permohonanId);

  if (!permohonan) throw notFound("Permohonan tidak ditemukan.");
  const item = parseBerkasSyarat(permohonan.syarat).find((row) => row.id === syaratId);
  if (!item) throw notFound("Berkas syarat tidak ditemukan.");
  return item;
}

/** Isi berkas syarat milik warga untuk route unduhan privat. */
export async function bacaBerkasSyaratWarga(
  permohonanId: number,
  syaratId: number,
): Promise<{ isi: Buffer; mime: string; namaAsli: string }> {
  const berkas = await getBerkasSyaratWargaData(permohonanId, syaratId);
  const isi = await bacaMedia(berkas.berkas);
  return { isi, mime: berkas.mime, namaAsli: berkas.namaAsli };
}

/** Batalkan permohonan milik warga selama belum diambil. */

// --- Arsip dokumen pribadi warga -----------------------------

/** Daftar dokumen pribadi milik warga yang sedang login. */
export async function daftarDokumenWargaData(): Promise<DokumenWargaDTO[]> {
  const user = await requireWarga();
  const villageId = await resolveVillageId(user);
  const rows = await listDokumenWarga(villageId, user.residentId);
  return rows.map(keDTO);
}

/**
 * Unggah dokumen pribadi baru.
 *
 * Berkas disimpan di media privat (kategori `permohonan`) sehingga tidak dapat
 * diunduh tanpa sesi pemilik. Batas MIME/ukuran mengikuti pengaturan lampiran
 * desa untuk kategori tersebut.
 */

/** Ubah jenis/nama dokumen; hanya unggahan warga sendiri. */

/** Hapus dokumen milik sendiri beserta berkas prismanya. */

/** Berkas dokumen untuk route unduhan ber-otentikasi; pemilik saja. */
export async function getBerkasDokumenWargaData(id: number) {
  const user = await requireWarga();
  const villageId = await resolveVillageId(user);
  const dokumen = await findDokumenWarga(villageId, user.residentId, id);

  if (!dokumen) throw notFound("Dokumen tidak ditemukan.");
  return dokumen;
}

/** Isi dokumen warga untuk route unduhan privat; pemilik saja. */
export async function bacaBerkasDokumenWarga(
  id: number,
): Promise<{ isi: Buffer; mime: string; namaAsli: string }> {
  const dokumen = await getBerkasDokumenWargaData(id);
  const isi = await bacaMedia(dokumen.berkas);
  return { isi, mime: dokumen.mime, namaAsli: dokumen.namaAsli };
}
