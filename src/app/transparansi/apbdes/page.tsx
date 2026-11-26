import type { Metadata } from "next";
import Link from "next/link";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { listLaporanDokumenApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-dokumen-publik-use-cases";
import { getLaporanApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-publik-use-cases";
import { formatMoney, toMinor } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import { PublicSiteFooter, PublicSiteHeader } from "../../public-site-layout";
import styles from "./apbdes.module.css";
import { palette } from "./bagian-apbdes";
import { RealisasiAnggaran } from "./bagian-realisasi";
import { RincianBelanja, RincianPendapatan } from "./bagian-rincian";
import { KomposisiBelanja, RingkasanApbdes } from "./bagian-ringkasan";
import { DokumenApbdesTerkait, GrafikRealisasi, InformasiApbdes } from "./bagian-samping";
import { PrintApbdesButton } from "./print-apbdes-button";

export const metadata: Metadata = { title: "APBDes & Transparansi Anggaran" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tahun?: string }> };

function locationLabel(desa: {
  namaKecamatan: string | null;
  namaKabupaten: string | null;
  namaPropinsi: string | null;
}) {
  return [desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi].filter(Boolean).join(", ");
}
function mediaUrl(value: string | null, villageId: number): string | null {
  if (!value) return null;
  const parts = value.split(/[\\/]/).filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === ".." || part.includes("..")))
    return null;
  const path = parts[0] === String(villageId) ? parts : [String(villageId), ...parts];
  return "/api/publik/media/" + path.map(encodeURIComponent).join("/");
}

export default async function ApbdesPublikPage({ searchParams }: Props) {
  const [desa, params] = await Promise.all([getIdentitasFromRequest(), searchParams]);
  const requestedYear = Number(params.tahun);
  const tahun =
    Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? requestedYear
      : undefined;
  const [laporan, semuaDokumen] = await Promise.all([
    getLaporanApbdesPublik(desa.id, tahun),
    listLaporanDokumenApbdesPublik(desa.id),
  ]);
  const dokumen = semuaDokumen.filter((item) => item.tahun === laporan.tahun);
  const pendapatan = laporan.baris.find((row) => row.kode === "4");
  const belanja = laporan.baris.find((row) => row.kode === "5");
  const pembiayaan = laporan.baris.find((row) => row.kode === "6");
  const totalPendapatan = pendapatan?.anggaran ?? "0";
  const totalBelanja = belanja?.anggaran ?? "0";
  const totalPembiayaan = pembiayaan?.anggaran ?? "0";
  const realisasiBelanja = belanja?.realisasi ?? "0";
  const sisaBelanja = toMinor(totalBelanja) - toMinor(realisasiBelanja);
  const sisaBelanjaTampil = formatMoney(sisaBelanja > 0n ? sisaBelanja : 0n);
  const persenRealisasi =
    Number(totalBelanja) > 0
      ? Math.min(100, (Number(realisasiBelanja) / Number(totalBelanja)) * 100)
      : 0;
  const komposisiTotal = laporan.bidang.reduce((sum, row) => sum + Number(row.anggaran), 0);
  const bobotBidang = laporan.bidang.map((row) =>
    komposisiTotal > 0 ? (Number(row.anggaran) / komposisiTotal) * 100 : 0,
  );
  const donut = laporan.bidang.map((row, index) => {
    const start = bobotBidang.slice(0, index).reduce((sum, value) => sum + value, 0);
    return {
      ...row,
      color: palette[index % palette.length] ?? "#1684f5",
      start,
      end: start + (bobotBidang[index] ?? 0),
    };
  });
  const donutStyle =
    komposisiTotal > 0
      ? {
          background:
            "conic-gradient(" +
            donut.map((row) => row.color + " " + row.start + "% " + row.end + "%").join(", ") +
            ")",
        }
      : undefined;
  const years = laporan.tersedia.length ? laporan.tersedia : [laporan.tahun];
  const location = locationLabel(desa);
  const logoUrl = mediaUrl(desa.logo, desa.id);
  const hasData =
    Number(totalPendapatan) > 0 || Number(totalBelanja) > 0 || Number(totalPembiayaan) !== 0;
  const maxBar = Math.max(
    1,
    ...laporan.bidang.map((row) => Number(row.anggaran)),
    ...laporan.bidang.map((row) => Number(row.realisasi)),
  );

  return (
    <main className={styles.site}>
      <PublicSiteHeader
        desa={desa}
        location={location}
        logoUrl={logoUrl}
        activePath="/transparansi/apbdes"
      />
      <section className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Beranda</Link>
            <span>›</span>
            <span>Informasi</span>
            <span>›</span>
            <span>APBDes &amp; Transparansi Anggaran</span>
          </nav>
          <div className={styles.heroContent}>
            <div>
              <h1>APBDes &amp; Transparansi Anggaran</h1>
              <p>Rencana, realisasi, dan laporan keuangan desa.</p>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <span className={styles.clip}>✓　✓　✓</span>
              <b>APBDes</b>
              <i>▦</i>
              <strong>Rp</strong>
              <strong>Rp</strong>
            </div>
          </div>
        </div>
      </section>
      <div className={styles.container + " " + styles.content}>
        <nav className={styles.tabs} aria-label="Bagian transparansi anggaran">
          <a className={styles.activeTab} href="#apbdes">
            ▱　APBDes
          </a>
          <a href="#realisasi">▤　Realisasi Anggaran</a>
          <a href="#laporan">▣　Laporan Keuangan</a>
          <a href="#dokumen">▧　Dokumen &amp; Regulasi</a>
        </nav>
        <form className={styles.filter} action="/transparansi/apbdes" method="get">
          <label htmlFor="tahun-apbdes">▦　Tahun Anggaran</label>
          <select id="tahun-apbdes" name="tahun" defaultValue={String(laporan.tahun)}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.applyFilter}>
            Tampilkan
          </button>
          <span className={styles.filterSpacer} />
          <PrintApbdesButton />
        </form>
        {hasData ? (
          <div className={styles.dashboard}>
            <div className={styles.mainColumn}>
              <RingkasanApbdes
                laporan={laporan}
                namaDesa={desa.namaDesa}
                totalPendapatan={totalPendapatan}
                totalBelanja={totalBelanja}
                totalPembiayaan={totalPembiayaan}
              />
              <KomposisiBelanja
                donut={donut}
                donutStyle={donutStyle}
                totalBelanja={totalBelanja}
                komposisiTotal={komposisiTotal}
              />
              <div className={styles.tablesGrid}>
                <RincianPendapatan
                  pendapatan={laporan.pendapatan}
                  totalPendapatan={totalPendapatan}
                />
                <RincianBelanja bidang={laporan.bidang} totalBelanja={totalBelanja} />
              </div>
              <RealisasiAnggaran
                laporan={laporan}
                realisasiBelanja={realisasiBelanja}
                persenRealisasi={persenRealisasi}
                sisaBelanjaTampil={sisaBelanjaTampil}
              />
            </div>
            <aside className={styles.sideColumn}>
              <InformasiApbdes tahun={laporan.tahun} jumlahDokumen={dokumen.length} />
              <DokumenApbdesTerkait dokumen={dokumen} />
              <GrafikRealisasi bidang={laporan.bidang} maxBar={maxBar} />
            </aside>
          </div>
        ) : (
          <section className={styles.panel + " " + styles.emptyState}>
            <span>▤</span>
            <h2>APBDes Tahun {laporan.tahun} Belum Tersedia</h2>
            <p>
              Data rencana anggaran akan ditampilkan setelah pemerintah desa mengisi dan menyimpan
              APBDes pada modul Keuangan Desa.
            </p>
            <Link href="/kontak">Hubungi Pemerintah Desa</Link>
          </section>
        )}
        <section className={styles.cta}>
          <div className={styles.ctaArt}>✓</div>
          <div>
            <h2>Transparan, Akuntabel, dan Partisipatif</h2>
            <p>
              Kami berkomitmen menyajikan informasi pengelolaan keuangan desa secara terbuka bagi
              seluruh masyarakat.
            </p>
          </div>
          <Link href="#laporan">Lihat Laporan Lengkap　→</Link>
        </section>
      </div>
      <PublicSiteFooter desa={desa} location={location} logoUrl={logoUrl} />
    </main>
  );
}
