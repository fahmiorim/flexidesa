import "server-only";

/**
 * Query album, foto, video, dan slider galeri.
 *
 * Seluruh fungsi wajib menerima `villageId` dari host sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, asc, count, desc, eq, inArray, isNull, like, lte, or } from "drizzle-orm";

import { db } from "@/db";
import { galeriAlbum, galeriFoto, galeriVideo, slider } from "@/db/schema";
import { polaLike } from "@/features/info-desa/publik/domain/pencarian";

export interface AlbumRingkas {
  id: number;
  nama: string;
  slug: string;
  keterangan: string | null;
  kategori: string | null;
  publishedAt: Date | null;
  sampul: string | null;
  jumlahFoto: number;
}

export async function listAlbumGaleri(villageId: number, cari?: string): Promise<AlbumRingkas[]> {
  const kondisi = [eq(galeriAlbum.villageId, villageId), eq(galeriAlbum.aktif, true)];
  if (cari) {
    const pola = polaLike(cari);
    const cocok = or(like(galeriAlbum.nama, pola), like(galeriAlbum.keterangan, pola));
    if (cocok) kondisi.push(cocok);
  }

  const rows = await db
    .select({
      id: galeriAlbum.id,
      nama: galeriAlbum.nama,
      slug: galeriAlbum.slug,
      keterangan: galeriAlbum.keterangan,
      kategori: galeriAlbum.kategori,
      publishedAt: galeriAlbum.publishedAt,
      sampul: galeriAlbum.sampul,
      urut: galeriAlbum.urut,
    })
    .from(galeriAlbum)
    .where(and(...kondisi))
    .orderBy(asc(galeriAlbum.urut), desc(galeriAlbum.id));

  // Query agregat, bukan subquery berkorelasi: Drizzle merender kolom subquery
  // tanpa kualifikasi tabel sehingga `id` menunjuk `galeri_foto.id`.
  const albumIds = rows.map((row) => row.id);
  const fotoRows =
    albumIds.length === 0
      ? []
      : await db
          .select({ albumId: galeriFoto.albumId, jumlah: count() })
          .from(galeriFoto)
          .where(
            and(
              eq(galeriFoto.villageId, villageId),
              eq(galeriFoto.aktif, true),
              inArray(galeriFoto.albumId, albumIds),
            ),
          )
          .groupBy(galeriFoto.albumId);
  const fotoByAlbum = new Map(fotoRows.map((row) => [row.albumId, Number(row.jumlah ?? 0)]));

  return rows.map(({ urut: _urut, ...album }) => ({
    ...album,
    jumlahFoto: fotoByAlbum.get(album.id) ?? 0,
  }));
}

export async function getAlbumBySlug(
  villageId: number,
  slug: string,
): Promise<AlbumRingkas | null> {
  const [row] = await db
    .select({
      id: galeriAlbum.id,
      nama: galeriAlbum.nama,
      slug: galeriAlbum.slug,
      keterangan: galeriAlbum.keterangan,
      kategori: galeriAlbum.kategori,
      publishedAt: galeriAlbum.publishedAt,
      sampul: galeriAlbum.sampul,
    })
    .from(galeriAlbum)
    .where(
      and(
        eq(galeriAlbum.villageId, villageId),
        eq(galeriAlbum.slug, slug),
        eq(galeriAlbum.aktif, true),
      ),
    )
    .limit(1);

  if (!row) return null;

  const [jumlah] = await db
    .select({ value: count() })
    .from(galeriFoto)
    .where(
      and(
        eq(galeriFoto.villageId, villageId),
        eq(galeriFoto.albumId, row.id),
        eq(galeriFoto.aktif, true),
      ),
    );

  return { ...row, jumlahFoto: jumlah?.value ?? 0 };
}

export interface FotoRingkas {
  id: number;
  gambar: string;
  judul: string | null;
  keterangan: string | null;
}

export async function listFotoAlbum(villageId: number, albumId: number): Promise<FotoRingkas[]> {
  return db
    .select({
      id: galeriFoto.id,
      gambar: galeriFoto.gambar,
      judul: galeriFoto.judul,
      keterangan: galeriFoto.keterangan,
    })
    .from(galeriFoto)
    .where(
      and(
        eq(galeriFoto.villageId, villageId),
        eq(galeriFoto.albumId, albumId),
        eq(galeriFoto.aktif, true),
      ),
    )
    .orderBy(asc(galeriFoto.urut), desc(galeriFoto.id));
}

/** Foto slider beranda (dari `slider` dan foto galeri bertanda slider). */
export async function listSliderBeranda(villageId: number): Promise<FotoRingkas[]> {
  const rows = await db
    .select({
      id: slider.id,
      gambar: slider.gambar,
      judul: slider.judul,
      keterangan: slider.keterangan,
    })
    .from(slider)
    .where(and(eq(slider.villageId, villageId), eq(slider.aktif, true)))
    .orderBy(asc(slider.urut), desc(slider.id));

  if (rows.length > 0) return rows;

  return db
    .select({
      id: galeriFoto.id,
      gambar: galeriFoto.gambar,
      judul: galeriFoto.judul,
      keterangan: galeriFoto.keterangan,
    })
    .from(galeriFoto)
    .where(
      and(
        eq(galeriFoto.villageId, villageId),
        eq(galeriFoto.slider, true),
        eq(galeriFoto.aktif, true),
      ),
    )
    .orderBy(asc(galeriFoto.urut), desc(galeriFoto.id));
}

/*
 * Agenda desa tidak lagi dibaca dari `bumindes_agenda`.
 *
 * Tabel itu adalah buku agenda surat masuk/keluar yang memuat nomor surat dan
 * asal/tujuan instansi; mempublikasikannya membocorkan metadata persuratan.
 * Agenda publik punya sumber sendiri (`agenda_kegiatan`) dengan status tayang
 * eksplisit — lihat `@/features/agenda`.
 */

/* ---------------------------------------------------------------- widget */

export interface VideoGaleriPublik {
  id: number;
  judul: string;
  keterangan: string | null;
  url: string;
  provider: string;
  thumbnail: string | null;
  publishedAt: Date | null;
}

export async function listVideoGaleriPublik(
  villageId: number,
  limit = 8,
): Promise<VideoGaleriPublik[]> {
  return db
    .select({
      id: galeriVideo.id,
      judul: galeriVideo.judul,
      keterangan: galeriVideo.keterangan,
      url: galeriVideo.url,
      provider: galeriVideo.provider,
      thumbnail: galeriVideo.thumbnail,
      publishedAt: galeriVideo.publishedAt,
    })
    .from(galeriVideo)
    .where(
      and(
        eq(galeriVideo.villageId, villageId),
        eq(galeriVideo.aktif, true),
        or(isNull(galeriVideo.publishedAt), lte(galeriVideo.publishedAt, new Date())),
      ),
    )
    .orderBy(desc(galeriVideo.publishedAt), desc(galeriVideo.id))
    .limit(limit);
}

/* ---------------------------------------------------------------- potensi desa */

export interface VideoGaleriAdmin {
  id: number;
  judul: string;
  url: string;
  provider: string;
  publishedAt: Date | null;
}

export async function listVideoGaleriAdmin(villageId: number): Promise<VideoGaleriAdmin[]> {
  return db
    .select({
      id: galeriVideo.id,
      judul: galeriVideo.judul,
      url: galeriVideo.url,
      provider: galeriVideo.provider,
      publishedAt: galeriVideo.publishedAt,
    })
    .from(galeriVideo)
    .where(eq(galeriVideo.villageId, villageId))
    .orderBy(desc(galeriVideo.publishedAt), desc(galeriVideo.id));
}

export async function simpanMetadataAlbumAdmin(
  villageId: number,
  albumId: number,
  kategori: string | null,
  publishedAt: Date | null,
): Promise<void> {
  await db
    .update(galeriAlbum)
    .set({ kategori, publishedAt })
    .where(and(eq(galeriAlbum.id, albumId), eq(galeriAlbum.villageId, villageId)));
}

export async function tambahVideoGaleriAdmin(
  villageId: number,
  data: {
    judul: string;
    keterangan: string | null;
    url: string;
    provider: "youtube" | "vimeo";
    publishedAt: Date;
  },
): Promise<void> {
  await db.insert(galeriVideo).values({
    villageId,
    judul: data.judul,
    keterangan: data.keterangan,
    url: data.url,
    provider: data.provider,
    aktif: true,
    publishedAt: data.publishedAt,
  });
}

export async function hapusVideoGaleriAdmin(villageId: number, videoId: number): Promise<void> {
  await db
    .delete(galeriVideo)
    .where(and(eq(galeriVideo.id, videoId), eq(galeriVideo.villageId, villageId)));
}

/* ------------------------------------------------------ kelola potensi admin */

export interface SliderRingkas {
  id: number;
  gambar: string;
  judul: string | null;
  keterangan: string | null;
  tautan: string | null;
  urut: number;
  aktif: boolean;
}

export interface SliderInput {
  gambar: string;
  judul: string | null;
  keterangan: string | null;
  tautan: string | null;
  urut: number;
  aktif: boolean;
}

export async function createSlider(villageId: number, data: SliderInput): Promise<void> {
  await db.insert(slider).values({ villageId, ...data });
}

export async function updateSlider(
  villageId: number,
  id: number,
  data: Partial<SliderInput>,
): Promise<void> {
  await db
    .update(slider)
    .set(data)
    .where(and(eq(slider.villageId, villageId), eq(slider.id, id)));
}

export async function deleteSlider(villageId: number, id: number): Promise<void> {
  await db.delete(slider).where(and(eq(slider.villageId, villageId), eq(slider.id, id)));
}

/* ---------------------------------------------------------------- dokumen */
