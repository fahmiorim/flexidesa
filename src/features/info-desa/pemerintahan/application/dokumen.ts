import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { tenant } from "@/features/info-desa/pemerintahan/application/konteks";
/**
 * Use case dokumen pemerintahan.
 *
 * Unggah, ubah metadata, unduh, dan hapus dokumen pemerintahan.
 * Izin ditegakkan di use case dan desa diambil dari sesi.
 */

import {
  deleteDokumen,
  getDokumen,
  insertDokumen,
  updateDokumen,
  type DokumenValues,
} from "@/features/info-desa/pemerintahan/infrastructure/dokumen-repository";
import {
  getLembaga,
  getLembagaStatusPublik,
} from "@/features/info-desa/pemerintahan/infrastructure/lembaga-repository";
import {
  getPerangkat,
  getPerangkatStatus,
} from "@/features/info-desa/pemerintahan/infrastructure/perangkat-repository";
import { bacaMedia, hapusMedia } from "@/features/media/infrastructure/media-storage";
import { requirePermission, requireUser } from "@/lib/dal";
import { validationError } from "@/lib/errors";

export async function unggahDokumenPemerintahan(input: DokumenValues) {
  if (Boolean(input.perangkatId) === Boolean(input.lembagaId)) {
    throw validationError("Dokumen harus terhubung ke tepat satu perangkat atau lembaga.");
  }
  if (!input.judul.trim() || !input.berkas.trim()) {
    throw validationError("Judul dan berkas dokumen wajib diisi.");
  }
  const villageId = await tenant(input.perangkatId ? "perangkat-desa" : "lembaga-desa", "update");
  if (input.perangkatId && !(await getPerangkat(villageId, input.perangkatId))) {
    throw validationError("Perangkat tidak ditemukan pada desa aktif.");
  }
  if (input.lembagaId && !(await getLembaga(villageId, input.lembagaId))) {
    throw validationError("Lembaga tidak ditemukan pada desa aktif.");
  }
  await insertDokumen(villageId, input);
}

export async function hapusDokumenPemerintahan(id: number) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const document = await getDokumen(villageId, id);
  if (!document) return;
  await requirePermission(document.perangkatId ? "perangkat-desa" : "lembaga-desa", "delete");
  await deleteDokumen(villageId, id);
  await hapusMedia(document.berkas);
}

export async function ubahMetadataDokumenPemerintahan(
  id: number,
  input: { judul: string; nomor: string | null; tanggal: string | null; tampilPublik: boolean },
) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const document = await getDokumen(villageId, id);
  if (!document) throw validationError("Dokumen tidak ditemukan.");
  await requirePermission(document.perangkatId ? "perangkat-desa" : "lembaga-desa", "update");
  await updateDokumen(villageId, id, { ...input, berkas: document.berkas });
}

/**
 * Ambil isi dokumen pemerintahan dengan kontrol akses yang sama seperti route
 * unduhan: dokumen publik hanya terbuka bila pemiliknya masih tampil, dokumen
 * privat wajib melewati permission dan desa sesi yang sama.
 *
 * Mengembalikan `null` untuk semua kegagalan agar route tidak membocorkan
 * keberadaan dokumen tenant lain.
 */

export async function unduhDokumenPemerintahanData(
  villageId: number,
  documentId: number,
): Promise<{ id: number; isi: Buffer; ekstensi: string } | null> {
  const document = await getDokumen(villageId, documentId);
  if (!document) return null;

  // Dokumen publik tetap harus mengikuti status publik pemiliknya. Flag
  // dokumen saja tidak boleh membuka berkas milik perangkat/lembaga tersembunyi.
  if (Boolean(document.perangkatId) === Boolean(document.lembagaId)) return null;
  if (document.tampilPublik) {
    if (document.perangkatId) {
      const owner = await getPerangkatStatus(villageId, document.perangkatId);
      if (owner?.status !== "aktif") return null;
    } else if (document.lembagaId) {
      const owner = await getLembagaStatusPublik(villageId, document.lembagaId);
      if (owner?.status !== "aktif" || !owner.tampilPublik) return null;
    }
  } else {
    const resource = document.perangkatId ? "perangkat-desa" : "lembaga-desa";
    const user = await requirePermission(resource, "read");
    const sesiVillageId = await resolveVillageId(user);
    if (sesiVillageId !== villageId) return null;
  }

  try {
    const isi = await bacaMedia(document.berkas);
    const ekstensi = document.berkas.split(".").pop()?.toLowerCase() ?? "bin";
    return { id: document.id, isi, ekstensi };
  } catch {
    return null;
  }
}
