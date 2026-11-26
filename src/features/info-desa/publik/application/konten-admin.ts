import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  DOKUMEN_RESOURCE,
  dokumenPublikFormSchema,
} from "@/features/info-desa/konten/domain/dokumen";
import {
  albumFormSchema,
  fotoFormSchema,
  MAKS_FOTO_PER_UNGGAH,
  slugAlbum,
  type HasilUnggahFoto,
} from "@/features/info-desa/konten/domain/galeri";
import {
  ambilGambarBerita,
  buatBerita,
  buatKategoriBerita,
  cariBeritaById,
  cariBeritaBySlug,
  cariBeritaDenganKategori,
  cariKategoriById,
  cariKategoriBySlug,
  hapusBerita,
  hapusKategoriBerita,
  listBeritaKontenAdmin,
  listKategoriBeritaAdmin,
  ubahBerita,
  ubahKategoriBerita,
  ubahStatusBerita,
} from "@/features/info-desa/publik/infrastructure/berita-admin-repository";
import {
  cariDokumenById,
  listDokumenAdmin,
} from "@/features/info-desa/publik/infrastructure/dokumen-admin-repository";
import {
  createDokumenPublik,
  deleteDokumenPublik,
  dokumenSlugExists,
  updateDokumenPublik,
} from "@/features/info-desa/publik/infrastructure/dokumen-repository";
import {
  buatAlbum,
  buatFoto,
  cariAlbumByIdLengkap,
  cariAlbumBySlug,
  cariFotoByIdLengkap,
  hapusAlbum,
  hapusFoto,
  listAlbumAdminLengkap,
  listFotoAdmin,
  listFotoByAlbumAdmin,
  listGambarFotoByAlbum,
  ubahAlbum,
  ubahFoto,
} from "@/features/info-desa/publik/infrastructure/galeri-admin-repository";
import {
  hapusVideoGaleriAdmin as hapusVideoGaleriRepo,
  listAlbumGaleri,
  listVideoGaleriAdmin as listVideoGaleriRepo,
  simpanMetadataAlbumAdmin as simpanMetadataAlbumRepo,
  tambahVideoGaleriAdmin as tambahVideoGaleriRepo,
  type AlbumRingkas,
} from "@/features/info-desa/publik/infrastructure/galeri-repository";
import {
  hapusPotensiAdmin as hapusPotensiRepo,
  hapusSaranaAdmin as hapusSaranaRepo,
  simpanPotensiAdmin as simpanPotensiRepo,
  simpanSaranaAdmin as simpanSaranaRepo,
  type PotensiAdminInput,
  type SaranaAdminInput,
} from "@/features/info-desa/publik/infrastructure/potensi-sarana-repository";
import type { BerkasUnggahan } from "@/features/media/domain/media";
import { hapusMedia } from "@/features/media/infrastructure/media-storage";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { sanitasiHtml, teksPolos } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";

import { simpanBerkasMedia } from "./simpan-berkas-media";

/**
 * Pembacaan konten desa untuk halaman admin.
 *
 * Konten publik tetap dibatasi tenant; izin baca modul berita/galeri diperiksa
 * di sini agar halaman admin tidak membuka data tanpa otorisasi.
 */

/**
 * Daftar berita untuk halaman admin: semua status (draft + published),
 * bukan hanya yang layak tayang seperti query publik `listBerita`.
 * Urutan mengikuti `updatedAt` terbaru dari repository admin.
 */
export async function listBeritaAdminData(limit = 50) {
  const user = await requirePermission(RESOURCES.berita, "read");
  const villageId = await resolveVillageId(user);
  return listBeritaKontenAdmin(villageId, limit);
}

/** Hak kelola berita untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesBeritaAdmin() {
  const user = await requirePermission(RESOURCES.berita, "read");
  return {
    bolehTambah: hasPermission(user.permissions, RESOURCES.berita, "create"),
    bolehUbah: hasPermission(user.permissions, RESOURCES.berita, "update"),
    bolehHapus: hasPermission(user.permissions, RESOURCES.berita, "delete"),
  };
}

export async function listKategoriBeritaAdminData() {
  const user = await requirePermission(RESOURCES.berita, "read");
  const villageId = await resolveVillageId(user);
  return listKategoriBeritaAdmin(villageId);
}

/**
 * Slug judul untuk URL berita. Aturannya sama dengan halaman Website agar
 * artikel yang dibuat dari kedua tempat tidak bentrok.
 */
export function slugBerita(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 190);
}

export interface BeritaAdminInput {
  judul: string;
  slug: string;
  ringkasan: string | null;
  isi: string;
  kategoriId: number | null;
  status: "draft" | "published";
  terbitPada: Date | null;
  headline: boolean;
  slider: boolean;
}

function validasiBerita(input: BeritaAdminInput) {
  if (!input.judul || input.judul.length > 200) {
    throw new Error("Judul berita wajib diisi (maksimal 200 karakter).");
  }
  if (!input.slug) throw new Error("Slug berita tidak valid.");
  // Editor mengirim HTML, jadi isi kosong diperiksa dari teksnya.
  if (!teksPolos(input.isi)) throw new Error("Isi berita wajib diisi.");
}

/** Terbit yang diminta di masa depan tetap disimpan; publikasi menunggu jadwal. */
function tanggalTerbit(status: string, requested: Date | null): Date | null {
  if (requested) return requested;
  return status === "published" ? new Date() : null;
}

export async function tambahBeritaAdmin(input: BeritaAdminInput, gambar?: BerkasUnggahan) {
  const user = await requirePermission(RESOURCES.berita, "create");
  const villageId = await resolveVillageId(user);
  validasiBerita(input);
  if (await cariBeritaBySlug(villageId, input.slug))
    throw new Error("Slug berita sudah digunakan.");
  if (input.kategoriId !== null && !(await cariKategoriById(villageId, input.kategoriId))) {
    throw new Error("Kategori berita tidak ditemukan pada desa ini.");
  }
  const jalurGambar = gambar
    ? await simpanBerkasMedia(villageId, gambar, "berita", "gambar")
    : null;
  await buatBerita(villageId, {
    judul: input.judul,
    slug: input.slug,
    ringkasan: input.ringkasan,
    isi: sanitasiHtml(input.isi),
    kategoriId: input.kategoriId,
    gambar: jalurGambar,
    status: input.status,
    terbitPada: tanggalTerbit(input.status, input.terbitPada),
    headline: input.headline,
    slider: input.slider,
  });
}

export async function ubahBeritaAdmin(
  id: number,
  input: BeritaAdminInput,
  gambar?: BerkasUnggahan,
) {
  const user = await requirePermission(RESOURCES.berita, "update");
  const villageId = await resolveVillageId(user);
  validasiBerita(input);
  const current = await cariBeritaById(villageId, id);
  if (!current) throw new Error("Berita tidak ditemukan pada desa ini.");
  const duplikat = await cariBeritaBySlug(villageId, input.slug);
  if (duplikat && duplikat.id !== id) throw new Error("Slug berita sudah digunakan.");
  if (input.kategoriId !== null && !(await cariKategoriById(villageId, input.kategoriId))) {
    throw new Error("Kategori berita tidak ditemukan pada desa ini.");
  }
  let jalurGambar = current.gambar;
  if (gambar) {
    jalurGambar = await simpanBerkasMedia(villageId, gambar, "berita", "gambar");
  }
  await ubahBerita(villageId, id, {
    judul: input.judul,
    slug: input.slug,
    ringkasan: input.ringkasan,
    isi: sanitasiHtml(input.isi),
    kategoriId: input.kategoriId,
    gambar: jalurGambar,
    status: input.status,
    terbitPada: tanggalTerbit(input.status, input.terbitPada ?? current.terbitPada),
    headline: input.headline,
    slider: input.slider,
  });
  if (gambar && current.gambar) await hapusMedia(current.gambar);
}

export async function ubahStatusBeritaAdmin(id: number, status: "draft" | "published") {
  const user = await requirePermission(RESOURCES.berita, "update");
  const villageId = await resolveVillageId(user);
  const current = await cariBeritaById(villageId, id);
  if (!current) throw new Error("Berita tidak ditemukan pada desa ini.");
  await ubahStatusBerita(villageId, id, status);
}

export async function hapusBeritaAdmin(id: number) {
  const user = await requirePermission(RESOURCES.berita, "delete");
  const villageId = await resolveVillageId(user);
  const row = await ambilGambarBerita(villageId, id);
  if (!row) throw new Error("Berita tidak ditemukan pada desa ini.");
  await hapusBerita(villageId, id);
  if (row.gambar) await hapusMedia(row.gambar);
}

/* --------------------------------------------------------- kategori berita */

/**
 * Kategori berita memakai resource `berita`: satu modul dengan beritanya, dan
 * template tenant hanya memberi grant untuk `berita` (tidak ada grant
 * `berita-kategori`), sehingga menuntut resource tersendiri akan selalu 403.
 */
export async function tambahKategoriBeritaAdmin(nama: string, slug: string) {
  const user = await requirePermission(RESOURCES.berita, "create");
  const villageId = await resolveVillageId(user);
  const namaBersih = nama.trim();
  const slugBersih = slugBerita(slug || nama).slice(0, 100);
  if (!namaBersih || namaBersih.length > 100) {
    throw new Error("Nama kategori wajib diisi (maksimal 100 karakter).");
  }
  if (!slugBersih) throw new Error("Slug kategori tidak valid.");
  if (await cariKategoriBySlug(villageId, slugBersih)) {
    throw new Error("Slug kategori sudah digunakan.");
  }
  await buatKategoriBerita(villageId, namaBersih, slugBersih);
}

export async function ubahKategoriBeritaAdmin(id: number, nama: string, slug: string) {
  const user = await requirePermission(RESOURCES.berita, "update");
  const villageId = await resolveVillageId(user);
  const namaBersih = nama.trim();
  const slugBersih = slugBerita(slug || nama).slice(0, 100);
  if (!namaBersih || namaBersih.length > 100 || !slugBersih) {
    throw new Error("Nama dan slug kategori wajib diisi.");
  }
  if (!(await cariKategoriById(villageId, id))) {
    throw new Error("Kategori tidak ditemukan pada desa ini.");
  }
  const duplikat = await cariKategoriBySlug(villageId, slugBersih);
  if (duplikat && duplikat.id !== id) throw new Error("Slug kategori sudah digunakan.");
  await ubahKategoriBerita(villageId, id, namaBersih, slugBersih);
}

export async function hapusKategoriBeritaAdmin(id: number) {
  const user = await requirePermission(RESOURCES.berita, "delete");
  const villageId = await resolveVillageId(user);
  if (!(await cariKategoriById(villageId, id))) {
    throw new Error("Kategori tidak ditemukan pada desa ini.");
  }
  if (await cariBeritaDenganKategori(villageId, id)) {
    throw new Error(
      "Kategori masih dipakai berita. Pindahkan berita ke kategori lain terlebih dahulu.",
    );
  }
  await hapusKategoriBerita(villageId, id);
}

export async function listGaleriAdminData(): Promise<AlbumRingkas[]> {
  const user = await requirePermission(RESOURCES.galeri, "read");
  const villageId = await resolveVillageId(user);
  return listAlbumGaleri(villageId);
}

export async function listVideoGaleriAdminData() {
  const user = await requirePermission(RESOURCES.galeri, "read");
  const villageId = await resolveVillageId(user);
  return listVideoGaleriRepo(villageId);
}

export async function simpanMetadataAlbumAdmin(
  albumId: number,
  kategori: string | null,
  publishedAt: Date | null,
) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  return simpanMetadataAlbumRepo(villageId, albumId, kategori, publishedAt);
}

export async function tambahVideoGaleriAdmin(data: {
  judul: string;
  keterangan: string | null;
  url: string;
  provider: "youtube" | "vimeo";
  publishedAt: Date;
}) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  return tambahVideoGaleriRepo(villageId, data);
}

/* --------------------------------------------------------------- galeri */

/** Hak kelola galeri untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesGaleriAdmin() {
  const user = await requirePermission(RESOURCES.galeri, "read");
  return {
    bolehTambah: hasPermission(user.permissions, RESOURCES.galeri, "create"),
    bolehUbah: hasPermission(user.permissions, RESOURCES.galeri, "update"),
    bolehHapus: hasPermission(user.permissions, RESOURCES.galeri, "delete"),
  };
}

/** Album + foto untuk halaman admin galeri (termasuk album nonaktif). */
export async function listGaleriKelolaAdminData() {
  const user = await requirePermission(RESOURCES.galeri, "read");
  const villageId = await resolveVillageId(user);
  const [albums, fotos] = await Promise.all([
    listAlbumAdminLengkap(villageId),
    listFotoAdmin(villageId),
  ]);
  const fotoByAlbum = new Map<number, typeof fotos>();
  for (const foto of fotos) {
    if (foto.albumId === null) continue;
    const daftar = fotoByAlbum.get(foto.albumId) ?? [];
    daftar.push(foto);
    fotoByAlbum.set(foto.albumId, daftar);
  }
  return albums.map((album) => ({ ...album, fotos: fotoByAlbum.get(album.id) ?? [] }));
}

async function slugAlbumUnik(villageId: number, nama: string, kecualiId?: number) {
  const dasar = slugAlbum(nama);
  const terpakai = await cariAlbumBySlug(villageId, dasar);
  if (!terpakai || terpakai.id === kecualiId) return dasar;
  for (let urutan = 2; urutan <= 200; urutan += 1) {
    const kandidat = `${dasar}-${urutan}`;
    const ada = await cariAlbumBySlug(villageId, kandidat);
    if (!ada) return kandidat;
  }
  throw new Error("Tidak dapat membuat slug album yang unik.");
}

export async function tambahAlbumGaleriAdmin(input: {
  nama: string;
  keterangan: string;
  kategori: string | null;
  publishedAt: Date | null;
  urut: number;
}) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  const hasil = albumFormSchema.safeParse({ ...input, aktif: true });
  if (!hasil.success) throw new Error(hasil.error.issues[0]?.message ?? "Data album tidak valid.");
  const kategori = input.kategori?.trim().slice(0, 80) || null;
  const slug = await slugAlbumUnik(villageId, hasil.data.nama);
  await buatAlbum(villageId, {
    nama: hasil.data.nama,
    slug,
    keterangan: hasil.data.keterangan || null,
    kategori,
    publishedAt: input.publishedAt,
    urut: hasil.data.urut,
  });
}

export async function ubahAlbumGaleriAdmin(
  albumId: number,
  input: {
    nama: string;
    keterangan: string;
    kategori: string | null;
    publishedAt: Date | null;
    urut: number;
    aktif: boolean;
  },
  sampulBaru?: BerkasUnggahan,
) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  const hasil = albumFormSchema.safeParse(input);
  if (!hasil.success) throw new Error(hasil.error.issues[0]?.message ?? "Data album tidak valid.");
  const current = await cariAlbumByIdLengkap(villageId, albumId);
  if (!current) throw new Error("Album tidak ditemukan pada desa ini.");
  const slug = await slugAlbumUnik(villageId, hasil.data.nama, albumId);
  const sampul = sampulBaru
    ? await simpanBerkasMedia(villageId, sampulBaru, "galeri", "sampul")
    : current.sampul;
  await ubahAlbum(villageId, albumId, {
    nama: hasil.data.nama,
    slug,
    keterangan: hasil.data.keterangan || null,
    sampul,
    aktif: hasil.data.aktif,
    urut: hasil.data.urut,
  });
  if (sampulBaru && current.sampul && current.sampul !== sampul) {
    await hapusMedia(current.sampul);
  }
  await simpanMetadataAlbumRepo(
    villageId,
    albumId,
    input.kategori?.trim().slice(0, 80) || null,
    input.publishedAt,
  );
}

export async function ubahStatusAlbumGaleriAdmin(albumId: number, aktif: boolean) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  const current = await cariAlbumByIdLengkap(villageId, albumId);
  if (!current) throw new Error("Album tidak ditemukan pada desa ini.");
  await ubahAlbum(villageId, albumId, {
    nama: current.nama,
    slug: current.slug,
    keterangan: current.keterangan,
    sampul: current.sampul,
    aktif,
    urut: current.urut,
  });
}

/** Detail satu album beserta fotonya untuk halaman kelola foto. */
export async function detailAlbumGaleriAdmin(albumId: number) {
  const user = await requirePermission(RESOURCES.galeri, "read");
  const villageId = await resolveVillageId(user);
  const [album, fotos] = await Promise.all([
    cariAlbumByIdLengkap(villageId, albumId),
    listFotoByAlbumAdmin(villageId, albumId),
  ]);
  if (!album) return null;
  return { album, fotos };
}

export async function hapusAlbumGaleriAdmin(albumId: number) {
  const user = await requirePermission(RESOURCES.galeri, "delete");
  const villageId = await resolveVillageId(user);
  const current = await cariAlbumByIdLengkap(villageId, albumId);
  if (!current) throw new Error("Album tidak ditemukan pada desa ini.");
  const foto = await listGambarFotoByAlbum(villageId, albumId);
  // Foto ikut terhapus lewat cascade FK; berkasnya dibersihkan manual.
  await hapusAlbum(villageId, albumId);
  for (const item of foto) await hapusMedia(item.gambar);
}

export async function unggahFotoGaleriAdmin(
  albumId: number,
  berkasList: BerkasUnggahan[],
  /** Judul/keterangan awal untuk semua foto yang diunggah dalam satu aksi. */
  meta?: { judul?: string; keterangan?: string },
): Promise<HasilUnggahFoto> {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  const album = await cariAlbumByIdLengkap(villageId, albumId);
  if (!album) throw new Error("Album tidak ditemukan pada desa ini.");
  const dipilih = berkasList.filter((b) => b.ukuran > 0).slice(0, MAKS_FOTO_PER_UNGGAH);
  if (dipilih.length === 0) throw new Error("Pilih berkas gambar terlebih dahulu.");
  const hasil: HasilUnggahFoto = { tersimpan: 0, dilewati: [] };
  let sampulBaru: string | null = null;
  for (const berkas of dipilih) {
    try {
      const gambar = await simpanBerkasMedia(villageId, berkas, "galeri", "gambar");
      await buatFoto(villageId, {
        albumId,
        gambar,
        judul: meta?.judul?.trim().slice(0, 150) || null,
        keterangan: meta?.keterangan?.trim() || null,
      });
      hasil.tersimpan += 1;
      if (!album.sampul && !sampulBaru) sampulBaru = gambar;
    } catch (error) {
      hasil.dilewati.push({
        nama: berkas.nama,
        alasan: error instanceof Error ? error.message : "Berkas tidak valid.",
      });
    }
  }
  if (hasil.tersimpan === 0) {
    throw new Error(hasil.dilewati[0]?.alasan ?? "Tidak ada foto yang dapat disimpan.");
  }
  if (sampulBaru) {
    await ubahAlbum(villageId, albumId, {
      nama: album.nama,
      slug: album.slug,
      keterangan: album.keterangan,
      sampul: sampulBaru,
      aktif: album.aktif,
      urut: album.urut,
    });
  }
  return hasil;
}

export async function ubahFotoGaleriAdmin(
  fotoId: number,
  input: { judul: string; keterangan: string; urut: number; aktif: boolean; slider: boolean },
  /** Ganti berkas foto; bila kosong, gambar lama dipertahankan. */
  berkasBaru?: BerkasUnggahan,
) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  const hasil = fotoFormSchema.safeParse(input);
  if (!hasil.success) throw new Error(hasil.error.issues[0]?.message ?? "Data foto tidak valid.");
  const current = await cariFotoByIdLengkap(villageId, fotoId);
  if (!current || current.albumId === null) throw new Error("Foto tidak ditemukan pada desa ini.");
  const gambar = berkasBaru
    ? await simpanBerkasMedia(villageId, berkasBaru, "galeri", "gambar")
    : current.gambar;
  await ubahFoto(villageId, fotoId, {
    albumId: current.albumId,
    gambar,
    judul: hasil.data.judul || null,
    keterangan: hasil.data.keterangan || null,
    aktif: hasil.data.aktif,
    slider: hasil.data.slider,
    urut: hasil.data.urut,
  });
  if (berkasBaru && current.gambar !== gambar) await hapusMedia(current.gambar);
}

export async function hapusFotoGaleriAdmin(fotoId: number) {
  const user = await requirePermission(RESOURCES.galeri, "delete");
  const villageId = await resolveVillageId(user);
  const current = await cariFotoByIdLengkap(villageId, fotoId);
  if (!current) throw new Error("Foto tidak ditemukan pada desa ini.");
  await hapusFoto(villageId, fotoId);
  await hapusMedia(current.gambar);
}

export async function jadikanSampulGaleriAdmin(albumId: number, fotoId: number) {
  const user = await requirePermission(RESOURCES.galeri, "update");
  const villageId = await resolveVillageId(user);
  const album = await cariAlbumByIdLengkap(villageId, albumId);
  if (!album) throw new Error("Album tidak ditemukan pada desa ini.");
  const foto = await cariFotoByIdLengkap(villageId, fotoId);
  if (!foto || foto.albumId !== albumId) throw new Error("Foto tidak termasuk album ini.");
  await ubahAlbum(villageId, albumId, {
    nama: album.nama,
    slug: album.slug,
    keterangan: album.keterangan,
    sampul: foto.gambar,
    aktif: album.aktif,
    urut: album.urut,
  });
}

export async function hapusVideoGaleriAdmin(videoId: number) {
  const user = await requirePermission(RESOURCES.galeri, "delete");
  const villageId = await resolveVillageId(user);
  return hapusVideoGaleriRepo(villageId, videoId);
}

/* --------------------------------------------------------------- dokumen */

/** Daftar dokumen publik untuk halaman admin konten (semua status). */
export async function listDokumenAdminData() {
  const user = await requirePermission(DOKUMEN_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listDokumenAdmin(villageId);
}

/** Hak kelola dokumen untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesDokumenAdmin() {
  const user = await requirePermission(DOKUMEN_RESOURCE, "read");
  return {
    bolehTambah: hasPermission(user.permissions, DOKUMEN_RESOURCE, "create"),
    bolehUbah: hasPermission(user.permissions, DOKUMEN_RESOURCE, "update"),
    bolehHapus: hasPermission(user.permissions, DOKUMEN_RESOURCE, "delete"),
  };
}

export interface DokumenAdminInput {
  nama: string;
  slug: string;
  kategori: string;
  jenis: string | null;
  nomor: string | null;
  tahun: number | null;
  keterangan: string | null;
  tautan: string | null;
  aktif: boolean;
}

function validasiDokumen(input: DokumenAdminInput, berkas: string | null) {
  const hasil = dokumenPublikFormSchema.safeParse({
    nama: input.nama,
    slug: input.slug,
    kategori: input.kategori,
    jenis: input.jenis ?? "",
    nomor: input.nomor ?? "",
    keterangan: input.keterangan ?? "",
    berkas: berkas ?? "",
    tautan: input.tautan ?? "",
    tahun: input.tahun ?? undefined,
    aktif: input.aktif,
  });
  if (!hasil.success)
    throw new Error(hasil.error.issues[0]?.message ?? "Data dokumen tidak valid.");
  return hasil.data;
}

export async function tambahDokumenAdmin(
  input: DokumenAdminInput,
  file?: { nama: string; mime: string; ukuran: number; isi: Uint8Array },
) {
  const user = await requirePermission(DOKUMEN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const berkas = file ? await simpanBerkasMedia(villageId, file, "dokumen", "berkas") : null;
  try {
    const data = validasiDokumen(input, berkas);
    const slug = slugify(data.slug || data.nama);
    if (!slug) throw new Error("Slug dokumen tidak valid.");
    if (await dokumenSlugExists(villageId, slug)) throw new Error("Slug dokumen sudah digunakan.");
    await createDokumenPublik(villageId, {
      nama: data.nama,
      slug,
      kategori: data.kategori,
      jenis: data.jenis || null,
      nomor: data.nomor || null,
      tahun: data.tahun ?? null,
      berkas,
      tautan: data.tautan || null,
      keterangan: data.keterangan || null,
      aktif: data.aktif,
    });
  } catch (error) {
    if (berkas) await hapusMedia(berkas);
    throw error;
  }
}

export async function ubahDokumenAdmin(
  id: number,
  input: DokumenAdminInput,
  file?: { nama: string; mime: string; ukuran: number; isi: Uint8Array },
) {
  const user = await requirePermission(DOKUMEN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const current = await cariDokumenById(villageId, id);
  if (!current) throw new Error("Dokumen tidak ditemukan pada desa ini.");
  const berkasBaru = file ? await simpanBerkasMedia(villageId, file, "dokumen", "berkas") : null;
  try {
    const data = validasiDokumen(input, berkasBaru ?? current.berkas);
    const slug = slugify(data.slug || data.nama);
    if (!slug) throw new Error("Slug dokumen tidak valid.");
    if (await dokumenSlugExists(villageId, slug, id))
      throw new Error("Slug dokumen sudah digunakan.");
    await updateDokumenPublik(villageId, id, {
      nama: data.nama,
      slug,
      kategori: data.kategori,
      jenis: data.jenis || null,
      nomor: data.nomor || null,
      tahun: data.tahun ?? null,
      berkas: berkasBaru ?? current.berkas,
      tautan: data.tautan || null,
      keterangan: data.keterangan || null,
      aktif: data.aktif,
    });
  } catch (error) {
    if (berkasBaru) await hapusMedia(berkasBaru);
    throw error;
  }
  if (berkasBaru && current.berkas) await hapusMedia(current.berkas);
}

export async function ubahStatusDokumenAdmin(id: number, aktif: boolean) {
  const user = await requirePermission(DOKUMEN_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const current = await cariDokumenById(villageId, id);
  if (!current) throw new Error("Dokumen tidak ditemukan pada desa ini.");
  if (aktif && !current.berkas && !current.tautan) {
    throw new Error("Dokumen aktif harus memiliki berkas atau tautan.");
  }
  await updateDokumenPublik(villageId, id, { aktif });
}

export async function hapusDokumenAdmin(id: number) {
  const user = await requirePermission(DOKUMEN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  const current = await cariDokumenById(villageId, id);
  if (!current) throw new Error("Dokumen tidak ditemukan pada desa ini.");
  await deleteDokumenPublik(villageId, id);
  if (current.berkas) await hapusMedia(current.berkas);
}

/** Hak kelola potensi untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesPotensiAdmin() {
  const user = await requirePermission(RESOURCES.potensi, "read");
  return {
    bolehTambah: hasPermission(user.permissions, RESOURCES.potensi, "create"),
    bolehUbah: hasPermission(user.permissions, RESOURCES.potensi, "update"),
    bolehHapus: hasPermission(user.permissions, RESOURCES.potensi, "delete"),
  };
}

/** Hak kelola sarana/prasarana untuk halaman admin; menentukan tombol yang tampil. */
export async function aksesSaranaAdmin() {
  const user = await requirePermission(RESOURCES.saranaPrasarana, "read");
  return {
    bolehTambah: hasPermission(user.permissions, RESOURCES.saranaPrasarana, "create"),
    bolehUbah: hasPermission(user.permissions, RESOURCES.saranaPrasarana, "update"),
    bolehHapus: hasPermission(user.permissions, RESOURCES.saranaPrasarana, "delete"),
  };
}

export async function simpanPotensiAdmin(data: PotensiAdminInput) {
  const user = await requirePermission(RESOURCES.potensi, data.id > 0 ? "update" : "create");
  const villageId = await resolveVillageId(user);
  return simpanPotensiRepo(villageId, data);
}

export async function hapusPotensiAdmin(id: number) {
  const user = await requirePermission(RESOURCES.potensi, "delete");
  const villageId = await resolveVillageId(user);
  return hapusPotensiRepo(villageId, id);
}

export async function simpanSaranaAdmin(data: SaranaAdminInput) {
  const user = await requirePermission(
    RESOURCES.saranaPrasarana,
    data.id > 0 ? "update" : "create",
  );
  const villageId = await resolveVillageId(user);
  return simpanSaranaRepo(villageId, data);
}

export async function hapusSaranaAdmin(id: number) {
  const user = await requirePermission(RESOURCES.saranaPrasarana, "delete");
  const villageId = await resolveVillageId(user);
  return hapusSaranaRepo(villageId, id);
}
