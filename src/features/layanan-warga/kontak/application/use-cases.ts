import "server-only";

import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import {
  type KontakGrupInput,
  type KontakInput,
} from "@/features/layanan-warga/kontak/domain/kontak";
import {
  buildKontakCsv,
  kontakFilename,
  type KontakEksporRow,
} from "@/features/layanan-warga/kontak/domain/kontak-berkas";
import {
  addAnggotaGrup,
  createKontak,
  createKontakGrup,
  findKontak,
  findKontakGrup,
  listKontak,
  residentExists,
  updateKontak,
  updateKontakGrup,
} from "@/features/layanan-warga/kontak/infrastructure/kontak-repository";
import { notFound, validationError } from "@/lib/errors";

/** Data halaman grup kontak beserta opsi kontak; izin baca grup kontak diperiksa di sini. */

/** Daftar kontak untuk halaman admin; izin baca kontak diperiksa di sini. */

/**
 * Catatan: modul ini sengaja **tidak** mengekspor alias repository langsung.
 * Semua jalur tulis wajib lewat use case di bawah, sehingga validasi tenant
 * (penduduk, kontak, grup) tidak dapat dilewati oleh pemanggil baru.
 */

/**
 * Pastikan penduduk yang ditautkan benar-benar milik desa aktif.
 *
 * Pesan kesalahan sengaja sama untuk "tidak ada" dan "milik desa lain" agar
 * keberadaan data tenant lain tidak terbocorkan.
 */
async function pastikanPendudukDesa(
  villageId: number,
  residentId: number | null | undefined,
): Promise<void> {
  if (residentId === null || residentId === undefined) return;

  if (!(await residentExists(villageId, residentId))) {
    throw validationError("Penduduk tidak ditemukan.", {
      residentId: ["Penduduk tidak ditemukan."],
    });
  }
}

/**
 * Field yang boleh diisi klien saat create.
 *
 * `id` dibuat database (auto-increment) dan `villageId` hanya berasal dari
 * argumen server, sehingga payload tidak dapat menentukan primary key sendiri.
 * Nilai `undefined` dibiarkan agar default kolom (mis. `hubungWarga`) tetap
 * berlaku seperti sebelumnya.
 */
function dataKontakBaru(input: KontakInput) {
  return {
    residentId: input.residentId,
    nama: input.nama,
    telepon: input.telepon,
    email: input.email,
    telegram: input.telegram,
    hubungWarga: input.hubungWarga,
    keterangan: input.keterangan,
  };
}

export async function createKontakUseCase(villageId: number, input: KontakInput) {
  await pastikanPendudukDesa(villageId, input.residentId);

  return createKontak({ ...dataKontakBaru(input), villageId });
}

/**
 * Field yang boleh diubah lewat update.
 *
 * Hanya kolom domain yang di-whitelist; `id` dan `villageId` tidak pernah masuk
 * SET. Nilai `undefined` tetap dibiarkan agar perilaku "tidak dikirim = tidak
 * diubah" tidak berubah.
 */
function perubahanKontak(input: KontakInput) {
  return {
    residentId: input.residentId,
    nama: input.nama,
    telepon: input.telepon,
    email: input.email,
    telegram: input.telegram,
    hubungWarga: input.hubungWarga,
    keterangan: input.keterangan,
  };
}

export async function updateKontakUseCase(villageId: number, input: KontakInput) {
  if (input.id === undefined) {
    throw validationError("Kontak tidak valid.", { id: ["Kontak tidak valid."] });
  }

  // Kontak desa lain juga menghasilkan NOT_FOUND yang sama, jadi keberadaan
  // baris tenant lain tidak terbocorkan.
  if (!(await findKontak(villageId, input.id))) {
    throw notFound("Kontak tidak ditemukan.");
  }

  await pastikanPendudukDesa(villageId, input.residentId);

  await updateKontak(input.id, villageId, perubahanKontak(input));
}

export async function createKontakGrupUseCase(villageId: number, input: KontakGrupInput) {
  // `id` tidak diteruskan: primary key dibuat database, `villageId` dari server.
  return createKontakGrup({
    namaGrup: input.namaGrup,
    keterangan: input.keterangan,
    villageId,
  });
}

export async function updateKontakGrupUseCase(villageId: number, input: KontakGrupInput) {
  if (input.id === undefined) {
    throw validationError("Grup kontak tidak valid.", { id: ["Grup kontak tidak valid."] });
  }

  if (!(await findKontakGrup(villageId, input.id))) {
    throw notFound("Grup kontak tidak ditemukan.");
  }

  await updateKontakGrup(input.id, villageId, {
    namaGrup: input.namaGrup,
    keterangan: input.keterangan,
  });
}

export async function addAnggotaGrupUseCase(
  villageId: number,
  grupId: number,
  input: { kontakId: number; peran: string | null },
) {
  if (!(await findKontakGrup(villageId, grupId))) {
    throw notFound("Grup kontak tidak ditemukan.");
  }

  if (!(await findKontak(villageId, input.kontakId))) {
    throw validationError("Kontak tidak ditemukan.", {
      kontakId: ["Kontak tidak ditemukan."],
    });
  }

  await addAnggotaGrup({
    villageId,
    grupId,
    kontakId: input.kontakId,
    peran: input.peran,
  });
}

/** Ekspor seluruh direktori kontak desa sebagai CSV. */
export async function exportKontakUseCase(
  villageId: number,
): Promise<{ csv: string; filename: string } | null> {
  const [rows, desa] = await Promise.all([listKontak(villageId), getIdentitas()]);
  if (rows.length === 0) return null;

  const data: KontakEksporRow[] = rows.map((row) => ({
    id: row.id,
    nama: row.nama,
    telepon: row.telepon,
    email: row.email,
    telegram: row.telegram,
    hubungWarga: row.hubungWarga,
    keterangan: row.keterangan,
    residentId: null,
  }));

  return {
    csv: buildKontakCsv({ namaDesa: desa?.namaDesa ?? null, rows: data }),
    filename: kontakFilename(desa?.namaDesa ?? null),
  };
}

/** Ekspor anggota sebuah grup kontak sebagai CSV. */

/** Konversi baris repository ke bentuk UI (tanpa kolom internal). */
