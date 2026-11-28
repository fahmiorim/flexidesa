import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  ALASAN_KELUAR_RESOURCE,
  alasanKeluarFormSchema,
  type AlasanKeluarRow,
} from "@/features/kehadiran/kehadiran/domain/alasan-keluar";
import {
  createAlasanKeluar,
  deleteAlasanKeluarBanyak as deleteAlasanKeluarBanyakRow,
  deleteAlasanKeluar as deleteAlasanKeluarRow,
  findAlasanKeluar,
  listAlasanKeluar,
  updateAlasanKeluar as updateAlasanKeluarRow,
} from "@/features/kehadiran/kehadiran/infrastructure/alasan-keluar-repository";
import { requirePermission } from "@/lib/dal";
import { notFound, validationError } from "@/lib/errors";

function bacaInput(input: unknown) {
  const parsed = alasanKeluarFormSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const pesan = issue?.message ?? "Data alasan keluar tidak valid.";
    const field = issue?.path.join(".") || "_form";
    throw validationError(pesan, { [field]: [pesan] });
  }

  return parsed.data;
}

/** Daftar alasan keluar desa aktif, urut abjad. */
export async function getAlasanKeluarData(): Promise<AlasanKeluarRow[]> {
  const user = await requirePermission(ALASAN_KELUAR_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listAlasanKeluar(villageId);
}

/** Baris yang sedang disunting; `null` bila tidak ada atau milik desa lain. */

/**
 * Tambah satu alasan keluar.
 *
 * Pembuat/pengubah dicatat pada `created_by`/`updated_by` dari pengguna
 * yang sedang masuk.
 */
export async function tambahAlasanKeluar(input: unknown): Promise<{ id: number }> {
  const user = await requirePermission(ALASAN_KELUAR_RESOURCE, "create");
  const villageId = await resolveVillageId(user);
  const values = bacaInput(input);

  const id = await createAlasanKeluar({
    villageId,
    alasan: values.alasan,
    keterangan: values.keterangan,
    createdBy: user.id,
  });

  return { id };
}

export async function ubahAlasanKeluar(id: number, input: unknown): Promise<{ id: number }> {
  const user = await requirePermission(ALASAN_KELUAR_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const values = bacaInput(input);

  if (!(await findAlasanKeluar(villageId, id))) {
    throw notFound("Alasan keluar tidak ditemukan.");
  }

  await updateAlasanKeluarRow(id, villageId, {
    alasan: values.alasan,
    keterangan: values.keterangan,
    updatedBy: user.id,
  });

  return { id };
}

export async function hapusAlasanKeluar(id: number): Promise<{ id: number }> {
  const user = await requirePermission(ALASAN_KELUAR_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  if (!(await findAlasanKeluar(villageId, id))) {
    throw notFound("Alasan keluar tidak ditemukan.");
  }

  await deleteAlasanKeluarRow(id, villageId);
  return { id };
}

/** Hapus beberapa alasan keluar sekaligus. */
export async function hapusAlasanKeluarBanyak(ids: readonly number[]): Promise<{ jumlah: number }> {
  const user = await requirePermission(ALASAN_KELUAR_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const unik = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);
  await deleteAlasanKeluarBanyakRow(villageId, unik);
  return { jumlah: unik.length };
}
