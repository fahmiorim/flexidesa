import "server-only";

/**
 * Use case jabatan dan riwayat jabatan perangkat.
 *
 * Jabatan perangkat beserta riwayatnya. Perubahan jabatan memicu
 * sinkronisasi kepala desa pada identitas desa.
 * Izin ditegakkan di use case dan desa diambil dari sesi.
 */

import { sinkronkanKepalaDesa } from "@/features/info-desa/identitas-desa/application/kontrak";
import { tenant } from "@/features/info-desa/pemerintahan/application/konteks";
import { isJenisJabatan } from "@/features/info-desa/pemerintahan/domain/aparat-desa";
import {
  countPerangkatByJabatan,
  deleteJabatan,
  deleteRiwayat,
  getJabatan,
  getJabatanBySlug,
  getJabatanDetail,
  getRiwayat,
  insertJabatan,
  insertRiwayat,
  updateJabatan,
  updateRiwayat,
  type RiwayatValues,
} from "@/features/info-desa/pemerintahan/infrastructure/jabatan-repository";
import {
  getPerangkat,
  listJabatanRingkas,
} from "@/features/info-desa/pemerintahan/infrastructure/perangkat-repository";
import { validationError } from "@/lib/errors";

export async function simpanJabatanPerangkat(
  id: number | null,
  nama: string,
  urut: number,
  jenis: string = "lainnya",
  tupoksi: string | null = null,
) {
  const villageId = await tenant("perangkat-desa", "update");
  if (!nama.trim()) throw validationError("Nama jabatan wajib diisi.");
  if (!isJenisJabatan(jenis)) throw validationError("Jenis jabatan tidak valid.");
  if (id && !(await getJabatan(villageId, id)))
    throw validationError("Jabatan tidak ditemukan pada desa aktif.");
  if (
    jenis !== "lainnya" &&
    (await listJabatanRingkas(villageId)).some((row) => row.jenis === jenis && row.id !== id)
  )
    throw validationError(
      jenis === "kades"
        ? "Jabatan Kepala Desa sudah didefinisikan."
        : "Jabatan Sekretaris Desa sudah didefinisikan.",
    );
  const slug = nama
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw validationError("Nama jabatan tidak valid.");
  const duplicate = await getJabatanBySlug(villageId, slug);
  if (duplicate && duplicate.id !== id)
    throw validationError("Jabatan dengan nama tersebut sudah terdaftar.");
  const values = {
    nama,
    slug,
    jenis,
    tupoksi: tupoksi?.trim() ? tupoksi.trim() : null,
    urut,
  };
  if (id) await updateJabatan(villageId, id, values);
  else await insertJabatan(villageId, values);
  // Perubahan jenis jabatan dapat mengubah siapa yang menjadi kepala desa.
  await sinkronkanKepalaDesa(villageId);
}

export async function hapusJabatanPerangkat(id: number) {
  const villageId = await tenant("perangkat-desa", "delete");
  const jabatan = await getJabatanDetail(villageId, id);
  if (!jabatan) throw validationError("Jabatan tidak ditemukan pada desa aktif.");
  if (jabatan.jenis !== "lainnya")
    throw validationError("Jabatan Kepala Desa dan Sekretaris Desa tidak dapat dihapus.");
  if (await countPerangkatByJabatan(villageId, id)) {
    throw validationError(
      "Jabatan masih dipakai perangkat desa. Pindahkan jabatan perangkat terlebih dahulu.",
    );
  }
  await deleteJabatan(villageId, id);
}

export async function simpanRiwayatJabatan(id: number | null, input: RiwayatValues) {
  const villageId = await tenant("perangkat-desa", "update");
  if (!(await getPerangkat(villageId, input.perangkatId)))
    throw validationError("Perangkat tidak ditemukan pada desa aktif.");
  if (!input.jabatan.trim()) throw validationError("Nama jabatan pada riwayat wajib diisi.");
  if (input.mulai && input.selesai && input.selesai < input.mulai)
    throw validationError("Tanggal akhir riwayat tidak boleh sebelum tanggal mulai.");
  if (id) {
    if (!(await getRiwayat(villageId, id)))
      throw validationError("Riwayat jabatan tidak ditemukan pada desa aktif.");
    await updateRiwayat(villageId, id, input);
  } else await insertRiwayat(villageId, input);
}

export async function hapusRiwayatJabatan(id: number) {
  const villageId = await tenant("perangkat-desa", "delete");
  await deleteRiwayat(villageId, id);
}
