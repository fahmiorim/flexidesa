import "server-only";

import { type Action } from "@/features/pengaturan/rbac/domain/permission";
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
  countAnggotaPerGrup,
  createKontak,
  createKontakGrup,
  createPesanArsip,
  deleteKontak,
  deleteKontakGrup,
  findAnggotaGrup,
  findKontak,
  findKontakGrup,
  findResident,
  listAnggotaGrupDetail,
  listKontak,
  listKontakGrup,
  listPesanArsip,
  listResidentOptions,
  removeAnggotaGrup,
  residentExists,
  updateAnggotaGrup,
  updateKontak,
  updateKontakGrup,
} from "@/features/layanan-warga/kontak/infrastructure/kontak-repository";
import { notFound, validationError } from "@/lib/errors";
import { requirePermission } from "@/lib/dal";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";

/** Ambil pengguna dan `villageId` sesi setelah memeriksa izin resource yang diminta. */
export async function village(resource: string, action: Action = "read") {
  const user = await requirePermission(resource, action);
  return { user, villageId: await resolveVillageId(user) };
}


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

export async function detailKontakGrupUseCase(villageId: number, id: number) {
  const grup = await findKontakGrup(villageId, id);
  if (!grup) throw notFound("Grup kontak tidak ditemukan.");
  return grup;
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

/**
 * Data halaman grup kontak beserta opsi kontak; izin baca grup kontak diperiksa di sini.
 */
export async function dataGrupKontakUseCase(villageId: number) {
  const [grup, kontak, counts] = await Promise.all([
    listKontakGrup(villageId),
    listKontak(villageId),
    countAnggotaPerGrup(villageId),
  ]);

  return {
    grup: grup.map((row) => ({
      id: row.id,
      namaGrup: row.namaGrup,
      keterangan: row.keterangan,
      jumlahAnggota: counts.get(row.id) ?? 0,
    })),
    kontak: kontak.map((row) => ({
      id: row.id,
      nama: row.nama,
      telepon: row.telepon,
      email: row.email,
      telegram: row.telegram,
      hubungWarga: row.hubungWarga,
    })),
  };
}

/**
 * Daftar kontak untuk halaman admin; izin baca kontak diperiksa di sini.
 */
export async function listKontakUseCase(villageId: number) {
  const rows = await listKontak(villageId);
  return rows.map((row) => ({
    id: row.id,
    residentId: row.residentId,
    nama: row.nama,
    telepon: row.telepon,
    email: row.email,
    telegram: row.telegram,
    hubungWarga: row.hubungWarga,
    keterangan: row.keterangan,
  }));
}

/**
 * Daftar kontak untuk form baru/ubah; izin baca kontak diperiksa di sini.
 */
export async function formKontakUseCase(villageId: number, id?: number) {
  const kontak = id !== undefined ? await findKontak(villageId, id) : null;

  return {
    kontak: kontak
      ? {
          id: kontak.id,
          nama: kontak.nama,
          telepon: kontak.telepon,
          email: kontak.email,
          telegram: kontak.telegram,
          hubungWarga: kontak.hubungWarga,
          keterangan: kontak.keterangan,
          residentId: kontak.residentId,
        }
      : null,
    penduduk: await pendudukOptions(villageId),
  };
}

/** Detail satu kontak untuk halaman profil; melempar `notFound` bila tidak ada. */
export async function detailKontakUseCase(villageId: number, id: number) {
  const kontak = await findKontak(villageId, id);
  if (!kontak) throw notFound("Kontak tidak ditemukan.");

  const penduduk = kontak.residentId ? await findResident(villageId, kontak.residentId) : null;

  return {
    id: kontak.id,
    nama: kontak.nama,
    telepon: kontak.telepon,
    email: kontak.email,
    telegram: kontak.telegram,
    hubungWarga: kontak.hubungWarga,
    keterangan: kontak.keterangan,
    residentId: kontak.residentId,
    namaPenduduk: penduduk?.nama ?? null,
  };
}

/** Opsi penduduk untuk dropdown taut kontak. */
async function pendudukOptions(villageId: number) {
  return listResidentOptions(villageId);
}

/**
 * Hapus kontak; izin hapus kontak diperiksa di sini.
 */
export async function hapusKontakUseCase(villageId: number, id: number) {
  if (!(await findKontak(villageId, id))) {
    throw notFound("Kontak tidak ditemukan.");
  }

  await deleteKontak(id, villageId);
}

/**
 * Hapus grup kontak; izin hapus grup kontak diperiksa di sini.
 */
export async function hapusKontakGrupUseCase(villageId: number, id: number) {
  if (!(await findKontakGrup(villageId, id))) {
    throw notFound("Grup kontak tidak ditemukan.");
  }

  await deleteKontakGrup(id, villageId);
}

/**
 * Hapus anggota grup kontak; izin hapus anggota grup diperiksa di sini.
 */
export async function hapusAnggotaGrupUseCase(villageId: number, anggotaId: number) {
  await removeAnggotaGrup(anggotaId, villageId);
}

/**
 * Data anggota grup kontak untuk halaman; izin baca grup kontak diperiksa di sini.
 */
export async function anggotaGrupKontakUseCase(villageId: number, grupId: number) {
  if (!(await findKontakGrup(villageId, grupId))) {
    throw notFound("Grup kontak tidak ditemukan.");
  }

  const anggota = await listAnggotaGrupDetail(villageId, grupId);
  return {
    grup: {
      id: grupId,
      namaGrup: (await findKontakGrup(villageId, grupId))?.namaGrup ?? null,
    },
    anggota: anggota.map((row) => ({
      id: row.id,
      kontakId: row.kontakId,
      nama: row.nama,
      telepon: row.telepon,
      email: row.email,
      telegram: row.telegram,
      peran: row.peran,
      keterangan: null,
    })),
    kontak: (await listKontak(villageId)).map((row) => ({
      id: row.id,
      nama: row.nama,
    })),
  };
}

/** Ubah peran anggota grup kontak; izin ubah grup kontak diperiksa di sini. */
export async function ubahAnggotaGrupUseCase(
  villageId: number,
  anggotaId: number,
  input: { peran: string | null },
) {
  if (!(await findAnggotaGrup(villageId, anggotaId))) {
    throw notFound("Anggota grup tidak ditemukan.");
  }
  await updateAnggotaGrup(anggotaId, villageId, input);
}

/** Anggota grup untuk detail; melempar notFound bila tidak ada. */
export async function detailAnggotaGrupUseCase(villageId: number, anggotaId: number) {
  const anggota = await findAnggotaGrup(villageId, anggotaId);
  if (!anggota) throw notFound("Anggota grup tidak ditemukan.");
  return anggota;
}

/** Simpan arsip pesan broadcast; izin tulis grup kontak diperiksa di sini. */
export async function simpanPesanArsipUseCase(
  villageId: number,
  input: { grupId: number; subjek: string; isi: string; createdBy: string },
) {
  return createPesanArsip({
    villageId,
    grupId: input.grupId,
    subjek: input.subjek,
    isi: input.isi,
    createdBy: input.createdBy,
  });
}

/** Daftar arsip pesan broadcast; izin baca grup kontak diperiksa di sini. */
export async function listPesanArsipUseCase(villageId: number) {
  return listPesanArsip(villageId);
}
