import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  JAM_KERJA_RESOURCE,
  jamKerjaFormSchema,
  type JamKerjaRow,
} from "@/features/kehadiran/kehadiran/domain/jam-kerja";
import {
  findJamKerja,
  listJamKerja,
  updateJamKerja as updateJamKerjaRow,
} from "@/features/kehadiran/kehadiran/infrastructure/jam-kerja-repository";
import { requirePermission } from "@/lib/dal";
import { notFound, validationError } from "@/lib/errors";

function bacaInput(input: unknown) {
  const parsed = jamKerjaFormSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const pesan = issue?.message ?? "Data jam kerja tidak valid.";
    const field = issue?.path.join(".") || "_form";
    throw validationError(pesan, { [field]: [pesan] });
  }

  return parsed.data;
}

/** Daftar jam kerja desa aktif (Senin–Minggu, dibuat otomatis bila kosong). */
export async function getJamKerjaData(): Promise<JamKerjaRow[]> {
  const user = await requirePermission(JAM_KERJA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listJamKerja(villageId);
}

/** Baris yang sedang disunting; `null` bila tidak ada atau milik desa lain. */

/**
 * Ubah jam kerja satu hari.
 *
 * Hanya aksi ubah yang tersedia: tidak ada tambah/hapus baris. Jam disimpan
 * `HH:MM:SS` mengikuti kolom `time`.
 */
export async function ubahJamKerja(id: number, input: unknown): Promise<{ id: number }> {
  const user = await requirePermission(JAM_KERJA_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const values = bacaInput(input);

  if (!(await findJamKerja(villageId, id))) throw notFound("Jam kerja tidak ditemukan.");

  await updateJamKerjaRow(id, villageId, {
    jamMasuk: `${values.jamMasuk}:00`,
    jamKeluar: `${values.jamKeluar}:00`,
    status: values.status,
    keterangan: values.keterangan,
  });

  return { id };
}
