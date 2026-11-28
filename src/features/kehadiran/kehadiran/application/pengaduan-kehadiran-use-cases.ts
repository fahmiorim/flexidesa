import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  PENGADUAN_KEHADIRAN_RESOURCE,
  pengaduanKehadiranFormSchema,
  type PengaduanKehadiranRow,
} from "@/features/kehadiran/kehadiran/domain/pengaduan-kehadiran";
import {
  findPengaduanKehadiran,
  listPengaduanKehadiran,
  updateKeteranganPengaduan,
} from "@/features/kehadiran/kehadiran/infrastructure/pengaduan-kehadiran-repository";
import { requirePermission } from "@/lib/dal";
import { notFound, validationError } from "@/lib/errors";

/** Daftar pengaduan kehadiran untuk menu Kehadiran → Pengaduan. */
export async function getPengaduanKehadiranData(): Promise<PengaduanKehadiranRow[]> {
  const user = await requirePermission(PENGADUAN_KEHADIRAN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listPengaduanKehadiran(villageId);
}

/**
 * Sunting keterangan satu pengaduan.
 *
 * Hanya kolom keterangan yang dapat diubah operator; waktu,
 * pelapor, dan terlapor berasal dari pelaporan warga.
 */
export async function ubahKeteranganPengaduan(id: number, metadata: unknown) {
  const user = await requirePermission(PENGADUAN_KEHADIRAN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const parsed = pengaduanKehadiranFormSchema.safeParse(metadata);
  if (!parsed.success) {
    throw validationError(parsed.error.issues[0]?.message ?? "Keterangan tidak valid.");
  }

  const row = await findPengaduanKehadiran(villageId, id);
  if (!row) throw notFound("Pengaduan kehadiran tidak ditemukan.");

  await updateKeteranganPengaduan(villageId, id, parsed.data.keterangan);
  return { id };
}
