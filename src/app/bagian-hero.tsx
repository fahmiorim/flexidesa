import Image from "next/image";
import Link from "next/link";

import { mediaUrl, namaLengkap, type DesaPublik, type PerangkatBeranda } from "./bagian-beranda";
import styles from "./public-home.module.css";

/**
 * Hero beranda mengikuti varian desain template tenant.
 *
 * Varian menentukan komposisi (foto di samping, di tengah, atau tanpa foto),
 * sehingga memilih template lain mengubah tampilan beranda, bukan hanya warna.
 */
export function HeroBeranda({
  desa,
  leader,
  heroImage,
  varian = "klasik",
  judulHero,
  subHero,
}: {
  desa: DesaPublik;
  leader: PerangkatBeranda | undefined;
  heroImage: string | null;
  varian?: "klasik" | "modern" | "ringkas";
  judulHero?: string;
  subHero?: string;
}) {
  const fotoLeader = mediaUrl(leader?.foto, desa.id);
  return (
    <section className={styles.hero} data-varian={varian}>
      {heroImage ? (
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={styles.heroImage}
        />
      ) : null}
      <div className={styles.heroOverlay} />
      <div className={styles.heroInner} data-varian={varian}>
        <div className={styles.leaderVisual}>
          {fotoLeader ? (
            <Image
              src={fotoLeader}
              alt={leader?.nama ?? ""}
              fill
              priority
              unoptimized
              sizes="(max-width: 700px) 40vw, 300px"
            />
          ) : (
            <div className={styles.leaderPlaceholder}>
              Foto Kepala Desa
              <br />
              <small>Belum tersedia</small>
            </div>
          )}
          {leader ? (
            <div className={styles.leaderCaption}>
              <strong>{namaLengkap(leader)}</strong>
              <span>{leader.jabatan}</span>
            </div>
          ) : null}
        </div>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>◉ Portal Resmi {desa.namaDesa ?? "Desa"}</span>
          {varian !== "klasik" && leader ? (
            <p className={styles.heroLeader}>
              {namaLengkap(leader)} · {leader.jabatan}
            </p>
          ) : null}
          <h1>
            {judulHero || "Sistem Informasi Desa"}
            <br />
            {desa.namaDesa ?? "Desa Kami"}
          </h1>
          <p>
            {subHero || (
              <>
                Media informasi, layanan publik, dan keterbukaan data untuk masyarakat{" "}
                {desa.namaDesa ?? "desa"}.
              </>
            )}
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/layanan/surat">
              ▤　Ajukan Surat Online
            </Link>
            <Link className={styles.secondaryButton} href="/profil">
              ▷　Lihat Profil Desa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
