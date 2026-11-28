import Image from "next/image";
import Link from "next/link";

import type { ThemeFooterProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Footer `samudra@1.0.0`.
 *
 * Berbeda dari footer bersama Arunika (lima kolom kartu gelap): pita ajakan
 * layanan bergradasi, identitas desa sebagai satu blok editorial, peta situs
 * bernomor dua grup, dan kontak berlabel. Seluruh data (identitas, tagline,
 * tautan, kontak, hak cipta) berasal dari `ThemeFooterProps` yang sama
 * dengan footer bersama, sehingga tidak ada field yang hilang.
 */
const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil Desa" },
  { href: "/pemerintahan", label: "Pemerintahan" },
  { href: "/layanan", label: "Layanan" },
];

const INFORMASI = [
  { href: "/informasi", label: "Informasi Desa" },
  { href: "/berita", label: "Berita Desa" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/agenda", label: "Agenda Kegiatan" },
  { href: "/galeri", label: "Galeri" },
  { href: "/transparansi/laporan-keuangan", label: "Laporan Keuangan" },
];

export function FooterSamudra({
  villageName,
  location,
  logoUrl,
  judul,
  tagline,
  alamat,
  telepon,
  email,
  widget,
}: ThemeFooterProps) {
  return (
    <footer className={styles.kaki} data-tema="samudra">
      <div className={styles.kakiCta}>
        <div className={styles.kakiCtaTeks}>
          <p className={styles.kicker}>Layanan publik</p>
          <h2>Butuh surat atau ingin menyampaikan aspirasi?</h2>
          <p>
            Pengajuan surat online dan pengaduan warga dapat dilakukan langsung dari portal ini.
          </p>
        </div>
        <div className={styles.kakiCtaAksi}>
          <Link className={styles.kakiUtama} href="/layanan/surat">
            Ajukan Surat Online →
          </Link>
          <Link className={styles.kakiSekunder} href="/kontak">
            Kontak &amp; Pengaduan
          </Link>
        </div>
      </div>

      <div className={styles.kakiUtama2}>
        <div className={styles.kakiBrand}>
          <div className={styles.kakiIdentitas}>
            {logoUrl ? <Image src={logoUrl} alt="" width={44} height={44} unoptimized /> : null}
            <div>
              <strong>{judul}</strong>
              <b>{villageName ?? "Pemerintah Desa"}</b>
              <small>{location}</small>
            </div>
          </div>
          <p>{tagline}</p>
        </div>

        <nav className={styles.kakiPeta} aria-label="Peta situs">
          <div>
            <strong>Menu</strong>
            <ol>
              {MENU.map((item, index) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <strong>Informasi</strong>
            <ol>
              {INFORMASI.map((item, index) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className={styles.kakiKontak}>
          <strong>Kontak Desa</strong>
          <p>
            <span>Alamat</span>
            {alamat || location || "Alamat kantor belum tersedia"}
          </p>
          {telepon ? (
            <p>
              <span>Telepon</span>
              <a href={`tel:${telepon}`}>{telepon}</a>
            </p>
          ) : null}
          {email ? (
            <p>
              <span>Email</span>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.kakiBawah}>
        <span>
          © {new Date().getFullYear()} {villageName ?? "Pemerintah Desa"}. All rights reserved.
        </span>
        {widget ?? null}
        <span>Transparan · Informatif · Melayani</span>
      </div>
    </footer>
  );
}
