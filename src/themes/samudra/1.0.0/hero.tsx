import Image from "next/image";
import Link from "next/link";

import type { ThemeHeroProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Hero beranda `samudra@1.0.0`.
 *
 * Komposisi "sampul majalah": teks besar di kiri dengan penanda lokasi dan
 * dua aksi utama, potret kepala desa berbingkai lengkung di kanan, latar
 * gelap bergradasi dengan sorot aksen dan gelombang di kaki hero. Seluruh
 * data (nama desa, lokasi, kepala desa, judul, subjudul, tautan aksi) berasal
 * dari `ThemeHeroProps`, jadi tidak ada field hero bersama yang hilang.
 */
export function HeroSamudra({
  villageName,
  location,
  leaderName,
  leaderRole,
  leaderPhotoUrl,
  heroImageUrl,
  judulHero,
  subHero,
  ctaUtama,
  ctaSekunder,
}: ThemeHeroProps) {
  const nama = leaderName ? leaderName.toLocaleUpperCase("id-ID") : null;

  return (
    <section className={styles.hero} data-hero="samudra" aria-label="Sambutan beranda">
      {heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={styles.heroFoto}
        />
      ) : null}
      <div className={styles.heroTirai} aria-hidden="true" />
      <div className={styles.heroIsi}>
        <div className={styles.heroTeks}>
          <p className={styles.heroChip}>
            <span className={styles.heroTitik} aria-hidden="true" />
            Portal Resmi {villageName ?? "Desa"}
          </p>
          <h1 className={styles.heroJudul}>
            {judulHero}
            {villageName ? (
              <>
                <br />
                <span className={styles.heroNama}>{villageName}</span>
              </>
            ) : null}
          </h1>
          <p className={styles.heroSub}>{subHero}</p>
          {location ? (
            <p className={styles.heroLokasi}>
              <span aria-hidden="true">⌖</span> {location}
            </p>
          ) : null}
          <div className={styles.heroAksi}>
            <Link className={styles.heroUtama} href={ctaUtama.href}>
              {ctaUtama.label}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.heroSekunder} href={ctaSekunder.href}>
              {ctaSekunder.label}
            </Link>
          </div>
        </div>

        <div className={styles.heroPotret}>
          <div className={styles.heroBingkai}>
            {leaderPhotoUrl ? (
              <Image
                src={leaderPhotoUrl}
                alt={leaderName ?? ""}
                fill
                priority
                unoptimized
                sizes="(max-width: 900px) 60vw, 340px"
                className={styles.heroPotretFoto}
              />
            ) : (
              <p className={styles.heroPotretKosong}>
                Foto Kepala Desa
                <small>Belum tersedia</small>
              </p>
            )}
          </div>
          {nama ? (
            <div className={styles.heroKartu}>
              <strong>{nama}</strong>
              <span>{leaderRole ?? "Kepala Desa"}</span>
            </div>
          ) : null}
        </div>
      </div>
      <svg
        className={styles.heroGelombang}
        viewBox="0 0 1440 120"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <path
          d="M0 74c180-44 320 26 520 26s330-62 520-46 300 44 400 34v46H0z"
          fill="var(--public-background, #06202a)"
        />
      </svg>
    </section>
  );
}
