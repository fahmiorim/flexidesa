import Image from "next/image";
import Link from "next/link";

import {
  muatMenuPublik,
  muatTemaPublik,
} from "@/features/info-desa/publik/application/website-admin";
import { resolveTema } from "@/themes/registry";
import { opsiYa, validasiOpsiTenant, warnaDasarDari, type ThemeWidgets } from "@/themes/types";

import styles from "./public-site-layout.module.css";

export type PublicVillageIdentity = {
  id: number;
  namaDesa: string | null;
  namaKecamatan: string | null;
  namaKabupaten: string | null;
  namaPropinsi: string | null;
  logo: string | null;
  alamatKantor: string | null;
  telepon: string | null;
  emailDesa: string | null;
};

type Props = {
  desa: PublicVillageIdentity;
  location: string;
  logoUrl: string | null;
  activePath?: string;
};

type NavigationLink = { href: string; label: string };
type NavigationGroup = { label: string; children: NavigationLink[] };

const navigation: readonly (NavigationLink | NavigationGroup)[] = [
  { href: "/", label: "Beranda" },
  {
    label: "Profil Desa",
    children: [
      { href: "/profil", label: "Profil Desa" },
      { href: "/sejarah", label: "Sejarah Desa" },
      { href: "/visi-misi", label: "Visi & Misi" },
      { href: "/wilayah", label: "Wilayah Desa" },
      { href: "/potensi", label: "Potensi Desa" },
    ],
  },
  {
    label: "Pemerintahan",
    children: [{ href: "/pemerintahan", label: "Perangkat Desa" }],
  },
  {
    label: "Layanan",
    children: [
      { href: "/layanan", label: "Layanan Publik" },
      { href: "/layanan/surat", label: "Layanan Surat" },
      { href: "/kontak", label: "Kontak & Pengaduan" },
    ],
  },
  {
    label: "Informasi",
    children: [
      { href: "/informasi", label: "Informasi Desa" },
      { href: "/berita", label: "Berita" },
      { href: "/pengumuman", label: "Pengumuman" },
      { href: "/agenda", label: "Agenda Kegiatan" },
      { href: "/statistik", label: "Statistik Desa" },
      { href: "/pembangunan", label: "Pembangunan Desa" },
      { href: "/transparansi/apbdes", label: "APBDes & Transparansi Anggaran" },
      { href: "/transparansi/laporan-keuangan", label: "Laporan Keuangan Desa" },
      { href: "/desa/status-des", label: "Status Desa (IDM)" },
    ],
  },
  { href: "/galeri", label: "Galeri" },
  { href: "/kontak", label: "Kontak" },
];

export async function PublicSiteHeader({ desa, logoUrl, activePath = "/" }: Props) {
  const [configuredMenu, tema] = await Promise.all([
    muatMenuPublik(desa.id),
    muatTemaPublik(desa.id),
  ]);
  const opsiTema = tema
    ? validasiOpsiTenant(resolveTema(tema.slug, tema.versi)?.opsi ?? [], tema.templateOptions)
    : {};
  const cakrawalaPintasanMasuk = tema ? String(opsiTema.pintasan_masuk ?? "1") === "1" : true;
  const warnaDasar = warnaDasarDari(opsiTema);
  const menuItems =
    configuredMenu.length > 0
      ? configuredMenu
          .filter((item) => item.parentId === null)
          .map((item) => {
            const children = configuredMenu.filter((child) => child.parentId === item.id);
            return children.length > 0
              ? {
                  label: item.nama,
                  children: [
                    { href: item.link, label: item.nama },
                    ...children.map((child) => ({ href: child.link, label: child.nama })),
                  ],
                }
              : { href: item.link, label: item.nama };
          })
      : navigation;
  const menu: (NavigationLink | NavigationGroup)[] = [...menuItems];
  const pembangunanAda = menu.some((item) =>
    "href" in item
      ? item.href === "/pembangunan"
      : item.children.some((child) => child.href === "/pembangunan"),
  );
  if (!pembangunanAda) menu.push({ href: "/pembangunan", label: "Pembangunan Desa" });
  return (
    <>
      {tema ? (
        <style>{`:root{--public-primary:${warnaDasar ?? tema.primary};--public-secondary:${tema.secondary};--public-accent:${tema.accent};--public-background:${tema.background};--public-surface:${tema.surface};--public-text:${tema.text};--public-heading-font:${tema.fontHeading === "serif" ? "Georgia,serif" : "inherit"};--public-radius:${tema.radius}}main[class*="site"]{background-color:var(--public-background)!important;color:var(--public-text)!important}main[class*="site"] h1,main[class*="site"] h2,main[class*="site"] h3{font-family:var(--public-heading-font)}main[class*="site"] [class*="primary"]{background-color:var(--public-primary)!important;border-color:var(--public-primary)!important}main[class*="site"] [class*="active"]{color:var(--public-primary)!important}main[class*="site"] [class*="card"]{border-radius:var(--public-radius);background-color:var(--public-surface)}main[class*="site"] a:hover{color:var(--public-accent)}footer[class*="footer"]{background:var(--public-secondary)!important}${tema.style === "gelap" ? 'main[class*="site"]{background-color:#0b1220!important;color:#e8eef8!important}main[class*="site"] h1,main[class*="site"] h2,main[class*="site"] h3{color:#f1f5fb!important}' : ""}`}</style>
      ) : null}
      <header
        className={styles.header}
        data-gelap={tema?.style === "gelap" ? "ya" : undefined}
        data-varian={tema?.layout ?? "klasik"}
      >
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label={`Beranda ${desa.namaDesa ?? "desa"}`}>
            {tema?.logoTampil === false ? null : logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={46}
                height={46}
                className={styles.logo}
                unoptimized
              />
            ) : (
              <span className={styles.logoFallback} aria-hidden="true">
                D
              </span>
            )}
            <span className={styles.brandText}>
              <strong>{tema?.judulHero || "Sistem Informasi Desa"}</strong>
              <b>{desa.namaDesa ?? "Pemerintah Desa"}</b>
              <small>{[desa.namaKecamatan, desa.namaKabupaten].filter(Boolean).join(", ")}</small>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Navigasi utama">
            {menu.map((item) =>
              "href" in item ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={activePath === item.href ? styles.active : undefined}
                  aria-current={activePath === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <details className={styles.dropdown} key={item.label}>
                  <summary>
                    {item.label}
                    <span aria-hidden="true">⌄</span>
                  </summary>
                  <div className={styles.dropdownMenu}>
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ),
            )}
          </nav>

          <div className={styles.headerActions}>
            {cakrawalaPintasanMasuk ? (
              <details className={styles.loginMenu}>
                <summary className={styles.login}>
                  ♙ <span>Masuk</span>
                </summary>
                <div className={styles.loginMenuPanel}>
                  <Link href="/masuk">Warga</Link>
                  <Link href="/masuk-admin">Admin Desa</Link>
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}

export async function PublicSiteFooter({ desa, location, logoUrl }: Props) {
  const tema = await muatTemaPublik(desa.id);
  const definisi = tema ? resolveTema(tema.slug, tema.versi) : null;
  const opsiTema = definisi ? validasiOpsiTenant(definisi.opsi, tema?.templateOptions) : {};
  // Widget berasal dari paket tema aktif; opsi `jam`/`statistik_desa` mengatur
  // tampil/tidaknya. Tema tanpa opsi tersebut (Arunika) tidak menampilkan widget.
  const widgets: ThemeWidgets | null = definisi?.widgets ?? null;
  const propsWidget = {
    villageId: desa.id,
    villageName: desa.namaDesa,
    opsi: opsiTema,
  };
  const tampilJam = Boolean(widgets) && opsiYa(opsiTema, "jam", false);
  const tampilStatistik = Boolean(widgets) && opsiYa(opsiTema, "statistik_desa", false);
  // Paket tema boleh menyediakan footer sendiri (seperti hero/beranda);
  // Arunika/Cakrawala tidak memilikinya sehingga footer bersama tidak berubah.
  if (definisi?.footer) {
    const FooterTema = definisi.footer;
    return (
      <FooterTema
        villageName={desa.namaDesa}
        location={location}
        logoUrl={logoUrl}
        judul={tema?.judulHero || "Sistem Informasi Desa"}
        tagline={
          tema?.taglineFooter ||
          "Portal informasi resmi desa untuk pelayanan publik yang transparan, informatif, dan mudah diakses masyarakat."
        }
        alamat={desa.alamatKantor}
        telepon={desa.telepon}
        email={desa.emailDesa}
        widget={
          <>
            {tampilStatistik && widgets ? widgets.statistik(propsWidget) : null}
            {tampilJam && widgets ? widgets.jam(propsWidget) : null}
          </>
        }
      />
    );
  }
  return (
    <footer
      className={styles.footer}
      data-gelap={tema?.style === "gelap" ? "ya" : undefined}
      data-varian={tema?.layout ?? "klasik"}
    >
      <div className={styles.footerMain}>
        <div className={styles.footerBrand}>
          <div className={styles.footerIdentity}>
            {logoUrl && tema?.logoTampil !== false ? (
              <Image src={logoUrl} alt="" width={44} height={44} unoptimized />
            ) : null}
            <div>
              <strong>{tema?.judulHero || "Sistem Informasi Desa"}</strong>
              <b>{desa.namaDesa ?? "Pemerintah Desa"}</b>
              <small>{location}</small>
            </div>
          </div>
          <p>
            {tema?.taglineFooter ||
              "Portal informasi resmi desa untuk pelayanan publik yang transparan, informatif, dan mudah diakses masyarakat."}
          </p>
        </div>
        <div className={styles.footerColumn}>
          <strong>Menu</strong>
          <Link href="/">Beranda</Link>
          <Link href="/profil">Profil Desa</Link>
          <Link href="/pemerintahan">Pemerintahan</Link>
          <Link href="/layanan">Layanan</Link>
        </div>
        <div className={styles.footerColumn}>
          <strong>Informasi</strong>
          <Link href="/informasi">Informasi Desa</Link>
          <Link href="/berita">Berita Desa</Link>
          <Link href="/pengumuman">Pengumuman</Link>
          <Link href="/agenda">Agenda Kegiatan</Link>
          <Link href="/galeri">Galeri</Link>
          <Link href="/transparansi/laporan-keuangan">Laporan Keuangan</Link>
        </div>
        <div className={styles.footerColumn + " " + styles.contactColumn}>
          <strong>Kontak Desa</strong>
          <span>{desa.alamatKantor || location || "Alamat kantor belum tersedia"}</span>
          {desa.telepon ? <a href={`tel:${desa.telepon}`}>{desa.telepon}</a> : null}
          {desa.emailDesa ? <a href={`mailto:${desa.emailDesa}`}>{desa.emailDesa}</a> : null}
        </div>
        <div className={styles.footerColumn}>
          <strong>Ikuti Kami</strong>
          <span>Media sosial resmi pemerintah desa</span>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>
          © {new Date().getFullYear()} {desa.namaDesa ?? "Pemerintah Desa"}. All rights reserved.
        </span>
        {tampilStatistik && widgets ? widgets.statistik(propsWidget) : null}
        {tampilJam && widgets ? widgets.jam(propsWidget) : null}
        <span>Pemerintah Desa {desa.namaDesa ?? ""}　|　Transparan · Informatif · Melayani</span>
      </div>
    </footer>
  );
}
