import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { TemaRenderer } from "@/themes/renderer";
import { opsiYa, warnaDasarDari, type SurfaceKey } from "@/themes/types";

import styles from "./galeri.module.css";

type GalleryShellProps = {
  villageName: string;
  /** Bila diisi, shell memuat tema aktif desa agar tampilan mengikuti template. */
  villageId?: number;
  /** Surface tema yang dirender; detail galeri memakai surface media. */
  surface?: SurfaceKey;
  children?: ReactNode;
};

export async function GalleryShell({
  villageName,
  villageId,
  surface = "media",
  children,
}: GalleryShellProps) {
  const tema = typeof villageId === "number" ? await muatTemaPublik(villageId) : null;
  const opsiTema = tema?.templateOptions ?? {};
  const warnaDasar = warnaDasarDari(opsiTema) ?? tema?.primary;
  const tampilkanMasuk = opsiYa(opsiTema, "pintasan_masuk");
  return (
    <main
      className={styles.site}
      data-tema={tema?.slug}
      data-gelap={tema?.style === "gelap" ? "ya" : undefined}
      data-varian={tema?.layout ?? "klasik"}
    >
      {tema ? (
        <style>{`:root{--public-primary:${warnaDasar};--public-secondary:${tema.secondary};--public-accent:${tema.accent};--public-background:${tema.background};--public-surface:${tema.surface};--public-text:${tema.text};--public-heading-font:${tema.fontHeading === "serif" ? "Georgia,serif" : "inherit"};--public-radius:${tema.radius}}main[class*="site"]{background-color:var(--public-background)!important;color:var(--public-text)!important}${
          tema.style === "gelap"
            ? 'main[class*="site"]{background-color:#0b1220!important;color:#e8eef8!important}'
            : ""
        }`}</style>
      ) : null}
      <header className={styles.header} data-varian={tema?.layout ?? "klasik"}>
        <div className={styles.container + " " + styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <Image src="/images/logo.png" alt="" width={42} height={42} />
            <span>
              <strong>{tema?.judulHero || villageName}</strong>
              <small>Galeri Desa</small>
            </span>
          </Link>
          <nav aria-label="Navigasi utama">
            <Link href="/">Beranda</Link>
            <Link href="/profil">Profil Desa</Link>
            <Link href="/berita">Berita</Link>
            <Link href="/agenda">Agenda</Link>
          </nav>
          {tampilkanMasuk ? (
            <Link href="/masuk" className={styles.login}>
              Masuk ↗
            </Link>
          ) : null}
        </div>
      </header>

      {typeof villageId === "number" ? (
        <TemaRenderer
          villageId={villageId}
          villageName={villageName}
          location=""
          activePath="/galeri"
          surface={surface}
        >
          {children}
        </TemaRenderer>
      ) : (
        children
      )}

      <footer className={styles.footer}>
        <div className={styles.container}>
          <strong>{villageName}</strong>
          <span>
            © {new Date().getFullYear()} · Pemerintah {villageName}
          </span>
        </div>
      </footer>
    </main>
  );
}
