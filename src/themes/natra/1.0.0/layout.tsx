import Link from "next/link";

import type { ThemeLayoutProps } from "../../types";
import styles from "./theme.module.css";

/**
 * Paket kedua `natra@1.0.0` — susunan berbeda dari Esensi:
 * bilah samping (sidebar) di kiri untuk navigasi kelompok, konten utama di
 * kanan. Opsi Natra yang terlihat: `jam`, `statistik_desa`, dan
 * `pintasan_masuk` melalui widget paket; `warna_dasar` masuk lewat token
 * primary, `foto_tidak_tersedia` dipakai gambar fallback, dan page-size
 * dibaca halaman daftar pembangunan/pengaduan.
 */
const TAUTAN_RINGKAS = [
  { href: "/profil", label: "Profil" },
  { href: "/pemerintahan", label: "Pemerintahan" },
  { href: "/layanan", label: "Layanan" },
  { href: "/informasi", label: "Informasi" },
  { href: "/statistik", label: "Statistik" },
  { href: "/galeri", label: "Galeri" },
] as const;

export default function NatraLayout(props: ThemeLayoutProps) {
  return (
    <div className={styles.tema} data-tema="natra">
      <div className={styles.shell}>
        <aside className={styles.bilah} aria-label="Navigasi samping tema Natra">
          <p className={styles.judul}>{props.villageName ?? "Sistem Informasi Desa"}</p>
          {props.location ? <p className={styles.lokasi}>{props.location}</p> : null}
          <nav className={styles.nav} aria-label="Menu ringkas">
            {TAUTAN_RINGKAS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          {String(props.opsi.jam ?? "1") === "1"
            ? props.widgets.jam({
                villageId: props.villageId,
                villageName: props.villageName,
                opsi: props.opsi,
              })
            : null}
          {String(props.opsi.statistik_desa ?? "1") === "1"
            ? props.widgets.statistik({
                villageId: props.villageId,
                villageName: props.villageName,
                opsi: props.opsi,
              })
            : null}
          {String(props.opsi.pintasan_masuk ?? "1") === "1" ? (
            <p className={styles.masuk}>
              <Link href="/masuk">Warga</Link> · <Link href="/masuk-admin">Admin</Link>
            </p>
          ) : null}
        </aside>
        <section className={styles.konten}>{props.children}</section>
      </div>
    </div>
  );
}
