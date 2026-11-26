import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  HARI_LIBUR_RESOURCE,
  hariLiburFormSchema,
  type HariLiburRow,
} from "@/features/kehadiran/kehadiran/domain/hari-libur";
import {
  createHariLibur,
  deleteHariLiburBanyak as deleteHariLiburBanyakRow,
  deleteHariLibur as deleteHariLiburRow,
  findHariLibur,
  findHariLiburByTanggal,
  listHariLibur,
  updateHariLibur as updateHariLiburRow,
} from "@/features/kehadiran/kehadiran/infrastructure/hari-libur-repository";
import { requirePermission } from "@/lib/dal";
import { isDuplicateKeyError, notFound, validationError } from "@/lib/errors";

/** Pesan sama dengan validasi `is_unique` OpenSID untuk kolom tanggal. */
const PESAN_TANGGAL_GANDA = "Tanggal tersebut sudah terdaftar sebagai hari libur.";

function bacaInput(input: unknown) {
  const parsed = hariLiburFormSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const pesan = issue?.message ?? "Data hari libur tidak valid.";
    const field = issue?.path.join(".") || "_form";
    throw validationError(pesan, { [field]: [pesan] });
  }

  return parsed.data;
}

function galatTanggalGanda(): never {
  throw validationError(PESAN_TANGGAL_GANDA, { tanggal: [PESAN_TANGGAL_GANDA] });
}

/** Daftar hari libur desa aktif, urut tanggal. */
export async function getHariLiburData(): Promise<HariLiburRow[]> {
  const user = await requirePermission(HARI_LIBUR_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listHariLibur(villageId);
}

/** Baris yang sedang disunting; `null` bila tidak ada atau milik desa lain. */
export async function getHariLiburUntukUbah(id: number): Promise<HariLiburRow | null> {
  const user = await requirePermission(HARI_LIBUR_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  return findHariLibur(villageId, id);
}

/** Tambah satu hari libur; tanggal unik per desa seperti `kehadiran_hari_libur`. */
export async function tambahHariLibur(input: unknown): Promise<{ id: number }> {
  const user = await requirePermission(HARI_LIBUR_RESOURCE, "create");
  const villageId = await resolveVillageId(user);
  const values = bacaInput(input);

  if (await findHariLiburByTanggal(villageId, values.tanggal)) galatTanggalGanda();

  try {
    const id = await createHariLibur({
      villageId,
      tanggal: values.tanggal,
      keterangan: values.keterangan,
    });
    return { id };
  } catch (error) {
    // Permintaan bersamaan dapat lolos pemeriksaan di atas; unique index
    // (village_id, tanggal) menahan baris kedua.
    if (isDuplicateKeyError(error)) galatTanggalGanda();
    throw error;
  }
}

/** Ubah tanggal/keterangan satu hari libur. */
export async function ubahHariLibur(id: number, input: unknown): Promise<{ id: number }> {
  const user = await requirePermission(HARI_LIBUR_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const values = bacaInput(input);

  if (!(await findHariLibur(villageId, id))) throw notFound("Hari libur tidak ditemukan.");

  const bentrok = await findHariLiburByTanggal(villageId, values.tanggal);
  if (bentrok && bentrok.id !== id) galatTanggalGanda();

  try {
    await updateHariLiburRow(id, villageId, {
      tanggal: values.tanggal,
      keterangan: values.keterangan,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) galatTanggalGanda();
    throw error;
  }

  return { id };
}

export async function hapusHariLibur(id: number): Promise<{ id: number }> {
  const user = await requirePermission(HARI_LIBUR_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  if (!(await findHariLibur(villageId, id))) throw notFound("Hari libur tidak ditemukan.");

  await deleteHariLiburRow(id, villageId);
  return { id };
}

/** Hapus beberapa hari libur sekaligus (aksi massal OpenSID). */
export async function hapusHariLiburBanyak(ids: readonly number[]): Promise<{ jumlah: number }> {
  const user = await requirePermission(HARI_LIBUR_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const unik = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);
  await deleteHariLiburBanyakRow(villageId, unik);
  return { jumlah: unik.length };
}
