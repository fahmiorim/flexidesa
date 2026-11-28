import type { Metadata } from "next";
import Link from "next/link";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { daftarLembagaPublik } from "@/features/info-desa/pemerintahan/application/publik";
import {
  daftarAlbumGaleri,
  daftarFotoAlbum,
  daftarPerangkatPublik,
  daftarSliderBeranda,
} from "@/features/info-desa/publik/application/konten-publik";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { mediaUrl } from "@/lib/media-url";

import { PublicSiteFooter, PublicSiteHeader } from "../public-site-layout";
import { BpdSection, LembagaDesaSection, PerangkatDesaSection } from "./bagian-lembaga";
import { StrukturOrganisasi } from "./bagian-struktur";
import { TugasFungsiSection } from "./bagian-tugas";
import styles from "./pemerintahan.module.css";

export const metadata: Metadata = {
  title: "Pemerintahan Desa",
  description: "Struktur organisasi dan perangkat pemerintah desa.",
};
export const dynamic = "force-dynamic";

export default async function PemerintahanPage() {
  const desa = await getIdentitasFromRequest();
  const tema = await muatTemaPublik(desa.id);
  const [perangkat, slides, albums, lembagaPublik] = await Promise.all([
    daftarPerangkatPublik(desa.id),
    daftarSliderBeranda(desa.id),
    daftarAlbumGaleri(desa.id),
    daftarLembagaPublik(desa.id),
  ]);
  const photoGroups = await Promise.all(
    albums
      .filter((album) => album.jumlahFoto > 0)
      .slice(0, 2)
      .map((album) => daftarFotoAlbum(desa.id, album.id)),
  );
  const galleryPhotos = photoGroups.flat();
  const heroImage =
    mediaUrl(slides[0]?.gambar, desa.id) ??
    (galleryPhotos[0] ? mediaUrl(galleryPhotos[0].gambar, desa.id) : null);
  const location = [desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi]
    .filter(Boolean)
    .join(", ");
  const logoUrl = mediaUrl(desa.logo, desa.id);
  const kepalaDesa = perangkat.find((item) =>
    item.jabatan?.toLocaleLowerCase("id-ID").includes("kepala desa"),
  );

  return (
    <main className={styles.site} data-tema={tema?.slug}>
      <PublicSiteHeader
        desa={desa}
        location={location}
        logoUrl={logoUrl}
        activePath="/pemerintahan"
      />
      <section
        className={styles.hero}
        style={
          heroImage
            ? {
                backgroundImage: `linear-gradient(90deg,#06396ff2 0%,#07518fc9 48%,#073c6d42 100%),url("${heroImage}")`,
              }
            : undefined
        }
      >
        <div className={styles.heroInner}>
          <nav aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span>›</span>
            <span>Pemerintahan Desa</span>
          </nav>
          <h1>Pemerintahan Desa</h1>
          <p>Struktur organisasi, perangkat desa, dan BPD.</p>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.topGrid}>
          <aside className={styles.sidebar}>
            <h2>
              <span>♙</span> Pemerintahan Desa
            </h2>
            <a className={styles.sideActive} href="#struktur">
              <span>♧</span>Struktur Organisasi
            </a>
            <a href="#perangkat">
              <span>♙</span>Perangkat Desa
            </a>
            <a href="#bpd">
              <span>▣</span>BPD
            </a>
            <a href="#lembaga">
              <span>♧</span>Lembaga Desa
            </a>
            <a href="#tugas">
              <span>ⓘ</span>Tugas &amp; Fungsi
            </a>
          </aside>

          <StrukturOrganisasi perangkat={perangkat} kepalaDesa={kepalaDesa} desaId={desa.id} />
        </div>

        <PerangkatDesaSection perangkat={perangkat} desaId={desa.id} />
        <BpdSection lembaga={lembagaPublik} desaId={desa.id} />
        <LembagaDesaSection lembaga={lembagaPublik} desaId={desa.id} />
        <TugasFungsiSection />
      </div>
      <PublicSiteFooter desa={desa} location={location} logoUrl={logoUrl} />
    </main>
  );
}
