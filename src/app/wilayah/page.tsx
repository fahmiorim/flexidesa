import type { Metadata } from "next";
import Link from "next/link";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { getStatistikDesa } from "@/features/info-desa/desa/application/statistik-desa";
import {
  daftarDokumenPublik,
  profilDesaPublik,
} from "@/features/info-desa/publik/application/konten-publik";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { daftarWilayahPublik } from "@/features/info-desa/wilayah/application/wilayah-publik";
import { getPetaPublik } from "@/features/pertanahan-gis/gis/application/use-cases";
import { proyeksikanKelompokRings } from "@/features/pertanahan-gis/gis/domain/peta-cetak";
import { mediaUrl } from "@/lib/media-url";

import { PublicSiteFooter, PublicSiteHeader } from "../public-site-layout";
import { UnduhDokumenWilayah } from "./bagian-dokumen";
import { KondisiGeografis, TabelDusun } from "./bagian-dusun";
import { BatasWilayah, InformasiWilayah } from "./bagian-info";
import { PetaWilayah } from "./bagian-peta";
import { buildAreaShapes } from "./bagian-wilayah";
import styles from "./wilayah.module.css";

export const metadata: Metadata = {
  title: "Wilayah Desa",
  description: "Kondisi geografis, batas, dan pembagian wilayah desa.",
};
export const dynamic = "force-dynamic";

export default async function WilayahPage() {
  const desa = await getIdentitasFromRequest();
  const tema = await muatTemaPublik(desa.id);
  const [rows, mapData, statistik, profil, dokumenWilayah] = await Promise.all([
    daftarWilayahPublik(desa.id),
    getPetaPublik(),
    getStatistikDesa(desa.id),
    profilDesaPublik(desa.id),
    daftarDokumenPublik(desa.id, "wilayah"),
  ]);
  const location = [desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi]
    .filter(Boolean)
    .join(", ");
  const logoUrl = mediaUrl(desa.logo, desa.id);
  const dusun = [...new Set(rows.map((row) => row.dusun).filter(Boolean))];
  const rw = [...new Set(rows.filter((row) => row.rw).map((row) => `${row.dusun}::${row.rw}`))];
  const rt = [
    ...new Set(rows.filter((row) => row.rt).map((row) => `${row.dusun}::${row.rw}::${row.rt}`)),
  ];
  const grouped = dusun.map((name) => {
    const items = rows.filter((row) => row.dusun === name);
    const luas = items.reduce((sum, row) => sum + (row.luasHa ?? 0), 0);
    return { name, items, luas: luas > 0 ? luas : null };
  });
  const totalLuas = grouped.reduce((sum, group) => sum + (group.luas ?? 0), 0);
  const shapes = buildAreaShapes(mapData.areas, mapData.polygons, profil?.batasDesa ?? null);
  const projected = proyeksikanKelompokRings(
    shapes.map((shape) => shape.rings),
    { lebar: 1000, tinggi: 650, padding: 36 },
  );
  const mapPhoto =
    mapData.areas.map((area) => mediaUrl(area.foto, desa.id)).find(Boolean) ??
    mediaUrl(desa.fotoKantor, desa.id);
  const profileStats = statistik.perDusun.filter((item) => item.label !== "Belum diisi");
  const residentsByDusun = new Map(profileStats.map((item) => [item.label, item.total]));
  const familiesByDusun = new Map(profileStats.map((item) => [item.label, item.keluarga]));
  const totalResidents = statistik.total;
  const totalFamilies = statistik.keluarga;
  const boundaryRows = [
    ["Kecamatan", desa.namaKecamatan],
    ["Kabupaten", desa.namaKabupaten],
    ["Provinsi", desa.namaPropinsi],
    ["Utara", profil?.batasUtara],
    ["Selatan", profil?.batasSelatan],
    ["Timur", profil?.batasTimur],
    ["Barat", profil?.batasBarat],
  ].filter((row) => row[1]);
  const geographyDetails = [
    ["Ketinggian", profil?.ketinggian],
    ["Suhu rata-rata", profil?.suhuRataRata],
    ["Curah hujan", profil?.curahHujan],
    ["Topografi", profil?.topografi],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <main className={styles.site} data-tema={tema?.slug}>
      <PublicSiteHeader desa={desa} location={location} logoUrl={logoUrl} activePath="/wilayah" />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <nav aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span>›</span>
            <Link href="/profil">Profil Desa</Link>
            <span>›</span>
            <span>Wilayah Desa</span>
          </nav>
          <h1>Wilayah Desa</h1>
          <p>Batas wilayah, dusun, luas, dan kondisi geografis.</p>
          <div className={styles.heroMap} aria-hidden="true">
            <span>⌖</span>
          </div>
        </div>
      </section>
      <div className={styles.container}>
        <nav className={styles.sectionNav} aria-label="Navigasi profil desa">
          <Link href="/sejarah">
            <span>▱</span>Sejarah Desa
          </Link>
          <Link href="/visi-misi">
            <span>◎</span>Visi &amp; Misi
          </Link>
          <Link className={styles.selected} href="/wilayah">
            <span>⌖</span>Wilayah Desa
          </Link>
          <Link href="/potensi">
            <span>♧</span>Potensi Desa
          </Link>
        </nav>

        <div className={styles.topGrid}>
          <PetaWilayah
            namaDesa={desa.namaDesa}
            shapes={shapes}
            projected={projected}
            mapPhoto={mapPhoto}
          />

          <aside className={styles.sideStack}>
            <InformasiWilayah
              profil={profil}
              jumlahDusun={dusun.length}
              jumlahRw={rw.length}
              jumlahRt={rt.length}
              totalPenduduk={totalResidents}
              totalKk={totalFamilies}
            />
            <BatasWilayah rows={boundaryRows} />
          </aside>
        </div>

        <div className={styles.lowerGrid}>
          <TabelDusun
            namaDesa={desa.namaDesa}
            groups={grouped}
            totalLuas={totalLuas}
            jumlahRt={rt.length}
            totalKk={totalFamilies}
            totalPenduduk={totalResidents}
            pendudukPerDusun={residentsByDusun}
            kkPerDusun={familiesByDusun}
          />
          <KondisiGeografis
            namaDesa={desa.namaDesa}
            details={geographyDetails}
            mapPhoto={mapPhoto}
          />
        </div>

        <UnduhDokumenWilayah dokumen={dokumenWilayah} desaId={desa.id} />
      </div>
      <PublicSiteFooter desa={desa} location={location} logoUrl={logoUrl} />
    </main>
  );
}
