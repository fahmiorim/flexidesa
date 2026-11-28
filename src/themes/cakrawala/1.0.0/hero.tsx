import Image from "next/image";
import Link from "next/link";

import type { ThemeHeroProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Hero beranda `cakrawala@1.0.0`.
 *
 * Komposisi modern: satu panel foto membulat selebar konten dengan tirai
 * gelap bergradasi, chip status kaca di atas, judul besar di kiri bawah,
 * dua aksi pil, dan kartu kaca berisi potret Kepala Desa di kanan bawah.
 * Bila foto utama tidak tersedia, panel memakai gradasi gelap bertoken
 * sehingga tetap kontras. Seluruh nilai berasal dari `ThemeHeroProps`,
 * termasuk `heroImageUrl` dan `leaderPhotoUrl`, sehingga tidak ada field
 * hero bersama yang hilang.
 */
export function HeroCakrawala({
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
  return (
    <section
      className={styles.hero}
      data-hero="cakrawala"
      data-native="cakrawala"
      aria-label="Sambutan beranda"
    >
      {heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={styles.heroFotoBg}
        />
      ) : null}
      <div className={styles.heroTirai} aria-hidden="true" />

      <div className={styles.heroIsi}>
        <div className={styles.heroTeks}>
          <p className={styles.heroChip}>
            Portal Resmi {villageName ?? "Desa"}
            {location ? ` · ${location}` : null}
          </p>
          <h1 className={styles.heroJudul}>
            {judulHero}
            {villageName ? (
              <>
                <br />
                <em>{villageName}</em>
              </>
            ) : null}
          </h1>
          <p className={styles.heroSub}>{subHero}</p>
          <div className={styles.heroAksi}>
            <Link className={styles.tombolUtama} href={ctaUtama.href}>
              {ctaUtama.label}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className={styles.tombolGaris} href={ctaSekunder.href}>
              {ctaSekunder.label}
            </Link>
          </div>
        </div>

        <aside className={styles.heroKartu} aria-label="Kepala desa">
          {leaderPhotoUrl ? (
            <span className={styles.heroPotret}>
              <Image
                src={leaderPhotoUrl}
                alt={leaderName ?? ""}
                fill
                unoptimized
                sizes="96px"
                className={styles.heroPotretFoto}
              />
            </span>
          ) : null}
          <span>
            <strong>{leaderName ?? "Pemerintah Desa"}</strong>
            <small>{leaderRole ?? "Kepala Desa"}</small>
          </span>
        </aside>
      </div>
    </section>
  );
}
