import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { TemaRenderer } from "@/themes/renderer";
import { opsiYa, warnaDasarDari, type SurfaceKey } from "@/themes/types";

import styles from "./informasi-publik.module.css";

type PublicNavigationItem = {
  href: string;
  label: string;
  /** Tautan keluar dirender sebagai `<a>`, bukan navigasi klien Next. */
  eksternal?: boolean;
};

type PublicShellProps = {
  villageName: string;
  brandLabel: string;
  navigation: readonly PublicNavigationItem[];
  showMark?: boolean;
  /** Bila diisi, shell memuat tema aktif desa agar tampilan mengikuti template. */
  villageId?: number;
  /** Surface tema yang dirender; menentukan renderer halaman paket tema. */
  surface?: SurfaceKey;
  children?: ReactNode;
};

export async function PublicShell({
  villageName,
  brandLabel,
  navigation,
  showMark = true,
  villageId,
  surface = "layanan",
  children,
}: PublicShellProps) {
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
            {showMark ? <Image src="/images/logo.png" alt="" width={42} height={42} /> : null}
            <span>
              <strong>{tema?.judulHero || villageName}</strong>
              <small>{brandLabel}</small>
            </span>
          </Link>
          <nav className={styles.nav} aria-label="Navigasi utama">
            {navigation.map((item) =>
              item.eksternal ? (
                <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ),
            )}
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
          activePath="/"
          surface={surface}
        >
          {children}
        </TemaRenderer>
      ) : (
        children
      )}

      <footer className={styles.footer}>
        <div className={styles.container + " " + styles.footerInner}>
          <strong>{villageName}</strong>
          <span>
            © {new Date().getFullYear()} · Pemerintah {villageName}
          </span>
        </div>
      </footer>
    </main>
  );
}
