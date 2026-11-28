import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { lapakFormSchema } from "@/features/layanan-warga/lapak/domain/lapak";
import {
  lapakProdukFormSchema,
  type LapakProdukFormInput,
} from "@/features/layanan-warga/lapak/domain/lapak-produk";
import {
  deleteLapak as deleteLapakRow,
  deleteProdukLapak,
  findLapakById,
  insertLapak,
  insertProdukLapak,
  listKategoriLapak,
  listLapak as listLapakRows,
  listProdukLapak,
  updateLapak as updateLapakRow,
  updateProdukLapak,
} from "@/features/layanan-warga/lapak/infrastructure/lapak-repository";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { notFound, validationError } from "@/lib/errors";

/**
 * Lapisan aplikasi Lapak Desa.
 *
 * Semua use case menegakkan izin modul `lapak` sendiri dan memakai desa dari
 * sesi, sehingga `villageId` tidak pernah datang dari payload klien. Produk
 * selalu diperiksa kepemilikannya lewat lapak sebelum ditulis.
 *
 * Setiap fungsi form memvalidasi masukan dengan skema domain, lalu memetakan
 * nilai kosong (`undefined`/`null`) ke bentuk kolom basis data.
 */

/** Validasi masukan formulir lapak; pesan pertama dipakai sebagai pesan galat. */
function validasiLapak(input: unknown) {
  const hasil = lapakFormSchema.safeParse(input);
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data lapak tidak valid.");
  }
  return hasil.data;
}

/** Validasi masukan formulir produk lapak. */
function validasiProduk(input: unknown) {
  const hasil = lapakProdukFormSchema.safeParse(input);
  if (!hasil.success) {
    throw validationError(hasil.error.issues[0]?.message ?? "Data produk tidak valid.");
  }
  return hasil.data;
}

interface ListLapakParams {
  q?: string;
  kategori?: string;
  page?: number;
  pageSize?: number;
}

export async function getDaftarLapak(params: ListLapakParams = {}) {
  const user = await requirePermission(RESOURCES.lapak, "read");
  const villageId = await resolveVillageId(user);

  const [data, kategori] = await Promise.all([
    listLapakRows(villageId, {
      q: params.q,
      kategori: params.kategori,
      page: params.page,
      pageSize: params.pageSize,
    }),
    listKategoriLapak(villageId),
  ]);

  return {
    ...data,
    kategori,
    akses: {
      bolehTambah: hasPermission(user.permissions, RESOURCES.lapak, "create"),
      bolehUbah: hasPermission(user.permissions, RESOURCES.lapak, "update"),
      bolehHapus: hasPermission(user.permissions, RESOURCES.lapak, "delete"),
    },
  };
}

/** Lapak desa sendiri beserta produknya, untuk halaman rincian. */
export async function getDetailLapak(lapakId: number) {
  const user = await requirePermission(RESOURCES.lapak, "read");
  const villageId = await resolveVillageId(user);

  const lapak = await findLapakById(villageId, lapakId);
  if (!lapak) throw notFound("Lapak tidak ditemukan.");

  const produk = await listProdukLapak(villageId, lapakId);

  return {
    lapak,
    produk,
    akses: {
      bolehTambah: hasPermission(user.permissions, RESOURCES.lapak, "create"),
      bolehUbah: hasPermission(user.permissions, RESOURCES.lapak, "update"),
      bolehHapus: hasPermission(user.permissions, RESOURCES.lapak, "delete"),
    },
  };
}

/**
 * Simpan lapak baru; mengembalikan id untuk pengalihan ke rinciannya.
 *
 * Masukan mentah dari formulir divalidasi **di sini** (satu kali). Memvalidasi
 * ulang hasil parse akan gagal karena kolom kosong sudah berubah menjadi
 * `null`, sementara skema menuntut string sebagai masukan awal.
 */
export async function simpanLapakBaru(input: unknown): Promise<number> {
  const user = await requirePermission(RESOURCES.lapak, "create");
  const villageId = await resolveVillageId(user);
  const data = validasiLapak(input);

  return insertLapak(villageId, {
    nama: data.nama,
    pemilik: data.pemilik ?? null,
    kategori: data.kategori ?? null,
    alamat: data.alamat ?? null,
    keterangan: data.keterangan ?? null,
  });
}

export async function ubahLapak(lapakId: number, input: unknown): Promise<void> {
  const user = await requirePermission(RESOURCES.lapak, "update");
  const villageId = await resolveVillageId(user);

  const lapak = await findLapakById(villageId, lapakId);
  if (!lapak) throw notFound("Lapak tidak ditemukan.");

  const data = validasiLapak(input);
  await updateLapakRow(lapakId, villageId, {
    nama: data.nama,
    pemilik: data.pemilik ?? null,
    kategori: data.kategori ?? null,
    alamat: data.alamat ?? null,
    keterangan: data.keterangan ?? null,
  });
}

/** Hapus lapak; produknya ikut terhapus lewat `ON DELETE CASCADE`. */
export async function hapusLapak(lapakId: number): Promise<void> {
  const user = await requirePermission(RESOURCES.lapak, "delete");
  const villageId = await resolveVillageId(user);

  const lapak = await findLapakById(villageId, lapakId);
  if (!lapak) throw notFound("Lapak tidak ditemukan.");

  await deleteLapakRow(lapakId, villageId);
}

/** Pemetaan input formulir produk → kolom `lapak_produk`. */
function kolomProduk(input: LapakProdukFormInput) {
  return {
    nama: input.nama,
    deskripsi: input.deskripsi ?? null,
    harga: input.harga === null || input.harga === undefined ? "0" : input.harga,
    stok: input.stok === null || input.stok === undefined ? 0 : Number(input.stok),
    gambar: input.gambar ?? null,
    aktif: input.aktif === false ? 0 : 1,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };
}

export async function tambahProdukLapak(lapakId: number, input: unknown): Promise<number> {
  const user = await requirePermission(RESOURCES.lapak, "create");
  const villageId = await resolveVillageId(user);

  const lapak = await findLapakById(villageId, lapakId);
  if (!lapak) throw notFound("Lapak tidak ditemukan.");

  return insertProdukLapak(villageId, lapakId, kolomProduk(validasiProduk(input)));
}

export async function ubahProdukLapak(
  lapakId: number,
  produkId: number,
  input: unknown,
): Promise<void> {
  const user = await requirePermission(RESOURCES.lapak, "update");
  const villageId = await resolveVillageId(user);

  const lapak = await findLapakById(villageId, lapakId);
  if (!lapak) throw notFound("Lapak tidak ditemukan.");

  const terbarui = await updateProdukLapak(
    villageId,
    lapakId,
    produkId,
    kolomProduk(validasiProduk(input)),
  );
  if (!terbarui) throw notFound("Produk lapak tidak ditemukan.");
}

export async function hapusProdukLapak(lapakId: number, produkId: number): Promise<void> {
  const user = await requirePermission(RESOURCES.lapak, "delete");
  const villageId = await resolveVillageId(user);

  const lapak = await findLapakById(villageId, lapakId);
  if (!lapak) throw notFound("Lapak tidak ditemukan.");

  const terhapus = await deleteProdukLapak(villageId, lapakId, produkId);
  if (!terhapus) throw notFound("Produk lapak tidak ditemukan.");
}
