import Image from "next/image";
import Link from "next/link";

import { mediaUrl, type DesaPublik } from "./bagian-beranda";
import styles from "./public-home.module.css";

type FotoGaleri = {
  id: number;
  gambar: string | null;
  judul: string | null;
  keterangan: string | null;
};

export function ProfilDanGaleri({
  desa,
  profilSejarah,
  intro,
  profileImage,
  albumSlug,
  photos,
}: {
  desa: DesaPublik;
  profilSejarah: string | null | undefined;
  intro: string;
  profileImage: string | null;
  albumSlug: string | null;
  photos: FotoGaleri[];
}) {
  return (
    <>
      <section className={styles.profileGallery}>
        <article className={styles.profileCard}>
          <div>
            <h2>⌂　Profil Desa</h2>
            <p>{profilSejarah ? profilSejarah : intro}</p>
            <Link href="/profil">Selengkapnya →</Link>
          </div>
          {profileImage ? (
            <Image
              src={profileImage}
              alt={`Dokumentasi ${desa.namaDesa ?? "desa"}`}
              width={440}
              height={260}
              unoptimized
            />
          ) : (
            <div className={styles.profileImageFallback}>
              Foto Desa
              <br />
              <small>Tambahkan foto pada galeri atau slider</small>
            </div>
          )}
        </article>
        <article className={styles.profileMenu}>
          <Link href="/visi-misi">
            <span>♡</span>
            <b>Visi & Misi</b>
            <small>Arah pembangunan {desa.namaDesa ?? "desa"}</small>
            <i>›</i>
          </Link>
          <Link href="/profil#potensi">
            <span>♧</span>
            <b>Potensi Desa</b>
            <small>Potensi unggulan dan ekonomi desa</small>
            <i>›</i>
          </Link>
          <Link href="/pemerintahan">
            <span>♙</span>
            <b>Struktur Pemerintahan</b>
            <small>Susunan perangkat dan lembaga desa</small>
            <i>›</i>
          </Link>
        </article>
      </section>

      <section className={styles.galleryPanel}>
        <div className={styles.cardHeading}>
          <div>
            <h2>▧　Galeri Kegiatan Desa</h2>
            <small>Dokumentasi kegiatan dan pembangunan di {desa.namaDesa ?? "desa"}</small>
          </div>
          <Link href="/galeri">Lihat Galeri →</Link>
        </div>
        {photos.length && albumSlug ? (
          <div className={styles.galleryGrid}>
            {photos.map((photo) => (
              <Link href={`/galeri/${encodeURIComponent(albumSlug)}`} key={photo.id}>
                <Image
                  src={mediaUrl(photo.gambar, desa.id)!}
                  alt={photo.judul || photo.keterangan || "Dokumentasi kegiatan desa"}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Belum ada foto galeri yang dipublikasikan.</p>
        )}
      </section>
    </>
  );
}
