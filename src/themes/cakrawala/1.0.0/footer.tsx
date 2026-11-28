import Image from "next/image";
import Link from "next/link";

import type { ThemeFooterProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Footer `cakrawala@1.0.0`.
 *
 * Berbeda dari footer bersama (lima kolom kartu) dan footer Samudra (pita
 * gelap): kolofon terang bergaya halaman belakang terbitan — wordmark serif
 * besar, tiga kolom beralas garis rambut, kontak berlabel, lalu baris hak
 * cipta dengan widget jam/statistik paket. Semua data berasal dari
 * `ThemeFooterProps` yang sama dengan footer bersama.
 */
const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil Desa" },
  { href: "/pemerintahan", label: "Pemerintahan" },
  { href: "/layanan", label: "Layanan" },
  { href: "/kontak", label: "Kontak" },
];

const INFORMASI = [
  { href: "/informasi", label: "Informasi Desa" },
  { href: "/berita", label: "Berita" },
  { href: "/pengumuman", label: "Pengumuman" },
  { href: "/agenda", label: "Agenda Kegiatan" },
  { href: "/galeri", label: "Galeri" },
  { href: "/transparansi/apbdes", label: "APBDes" },
];

export function FooterCakrawala({
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
    <footer className={styles.kolofon} data-tema="cakrawala" data-native="cakrawala">
      <div className={styles.kolofonAtas}>
        <div className={styles.kolofonMerk}>
          {logoUrl ? <Image src={logoUrl} alt="" width={46} height={46} unoptimized /> : null}
          <div>
            <strong>{villageName ?? "Pemerintah Desa"}</strong>
            <small>{judul}</small>
          </div>
        </div>
        <p className={styles.kolofonTagline}>{tagline}</p>
      </div>

      <div className={styles.kolofonIsi}>
        <nav className={styles.kolofonKolom} aria-label="Menu situs">
          <strong>Menu</strong>
          {MENU.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className={styles.kolofonKolom} aria-label="Informasi desa">
          <strong>Informasi</strong>
          {INFORMASI.map((item, index) => (
            <Link key={item.href} href={item.href}>
              <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.kolofonKolom}>
          <strong>Kontak</strong>
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

      <div className={styles.kolofonBawah}>
        <span>
          © {new Date().getFullYear()} {villageName ?? "Pemerintah Desa"} · Seluruh hak cipta
          dilindungi
        </span>
        <span className={styles.kolofonWidget}>{widget ?? null}</span>
        <span>Terbit berkala · Terbuka untuk warga</span>
      </div>
    </footer>
  );
}
