import type { Metadata } from "next";
import Link from "next/link";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { listLaporanDokumenApbdesPublik } from "@/features/keuangan-desa/keuangan/application/laporan-dokumen-publik-use-cases";
import {
  getLaporanApbdesPublik,
  getLaporanTriwulanPublik,
} from "@/features/keuangan-desa/keuangan/application/laporan-publik-use-cases";
import {
  formatMoney,
  formatRupiah,
  toMinor,
} from "@/features/keuangan-desa/keuangan/domain/keuangan";

import { PublicSiteFooter, PublicSiteHeader } from "../../public-site-layout";
import { MetaLaporan, MetrikLaporan } from "./bagian-meta";
import { GrafikRealisasi, GrafikTriwulan, InfoLaporan } from "./bagian-samping";
import { DokumenTerkait, RealisasiApbdes, RincianBidang } from "./bagian-tabel";
import styles from "./laporan-keuangan.module.css";

export const metadata: Metadata = { title: "Detail Laporan Keuangan Desa" };
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

export default async function LaporanKeuanganPublikPage({ searchParams }: Props) {
  const [desa, params] = await Promise.all([getIdentitasFromRequest(), searchParams]);
  const requestedYear = Number(params.tahun);
  const tahunParam =
    Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? requestedYear
      : undefined;
  const laporan = await getLaporanApbdesPublik(desa.id, tahunParam);
  const [triwulan, semuaDokumen] = await Promise.all([
    getLaporanTriwulanPublik(desa.id, laporan.tahun),
    listLaporanDokumenApbdesPublik(desa.id),
  ]);
  const dokumen = semuaDokumen.filter((item) => item.tahun === laporan.tahun);
  const pendapatan = laporan.baris.find((row) => row.kode === "4");
  const belanja = laporan.baris.find((row) => row.kode === "5");
  const pembiayaan = laporan.baris.find((row) => row.kode === "6");
  const totalPendapatan = pendapatan?.anggaran ?? "0";
  const totalBelanja = belanja?.anggaran ?? "0";
  const realisasiBelanja = belanja?.realisasi ?? "0";
  const sisaBelanja = toMinor(totalBelanja) - toMinor(realisasiBelanja);
  const sisaBelanjaTampil = formatRupiah(formatMoney(sisaBelanja > 0n ? sisaBelanja : 0n));
  const serapan =
    Number(totalBelanja) > 0
      ? Math.min(100, (Number(realisasiBelanja) / Number(totalBelanja)) * 100)
      : 0;
  const location = locationLabel(desa);
  const logoUrl = mediaUrl(desa.logo, desa.id);
  const maxQuarter = Math.max(
    1,
    ...[triwulan.total.tw1, triwulan.total.tw2, triwulan.total.tw3, triwulan.total.tw4].map(Number),
  );
  const hasData =
    Number(totalPendapatan) > 0 ||
    Number(totalBelanja) > 0 ||
    Number(pembiayaan?.anggaran ?? 0) !== 0;
  const quarters = [
    { label: "Triwulan I", period: "Jan – Mar", value: triwulan.total.tw1 },
    { label: "Triwulan II", period: "Apr – Jun", value: triwulan.total.tw2 },
    { label: "Triwulan III", period: "Jul – Sep", value: triwulan.total.tw3 },
    { label: "Triwulan IV", period: "Okt – Des", value: triwulan.total.tw4 },
  ];

  return (
    <main className={styles.site}>
      <PublicSiteHeader
        desa={desa}
        location={location}
        logoUrl={logoUrl}
        activePath="/transparansi/laporan-keuangan"
      />
      <section className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Beranda</Link>
            <span>›</span>
            <span>Informasi</span>
            <span>›</span>
            <Link href="/transparansi/apbdes">Laporan Keuangan</Link>
            <span>›</span>
            <span>Detail Laporan</span>
          </nav>
          <div className={styles.heroContent}>
            <div>
              <h1>Laporan Keuangan Desa</h1>
              <p>Pengelolaan keuangan desa yang transparan.</p>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <span className={styles.clip}>✓　▥　✓</span>
              <b>Rp</b>
              <i>▥</i>
              <strong>Rp</strong>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.container + " " + styles.content}>
        <nav className={styles.tabs} aria-label="Navigasi informasi desa">
          <Link href="/berita">▤　Berita Desa</Link>
          <Link href="/pengumuman">⚑　Pengumuman</Link>
          <Link href="/agenda">▦　Agenda Kegiatan</Link>
          <Link className={styles.activeTab} href="/transparansi/laporan-keuangan">
            ▥　Laporan Keuangan
          </Link>
        </nav>

        <section className={styles.headingPanel}>
          <div className={styles.headingIcon}>▤</div>
          <div className={styles.headingText}>
            <h2>Detail Laporan Keuangan Desa</h2>
            <p>Laporan realisasi APBDes Tahun Anggaran {laporan.tahun}.</p>
          </div>
          <form className={styles.yearFilter} action="/transparansi/laporan-keuangan" method="get">
            <label htmlFor="tahun-laporan">Tahun Anggaran</label>
            <select id="tahun-laporan" name="tahun" defaultValue={String(laporan.tahun)}>
              {(laporan.tersedia.length ? laporan.tersedia : [laporan.tahun]).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button type="submit">Tampilkan</button>
          </form>
        </section>

        {hasData ? (
          <>
            <MetaLaporan laporan={laporan} dokumen={dokumen} />

            <MetrikLaporan
              laporan={laporan}
              totalPendapatan={totalPendapatan}
              totalBelanja={totalBelanja}
              realisasiBelanja={realisasiBelanja}
              sisaBelanjaTampil={sisaBelanjaTampil}
              serapan={serapan}
            />

            <div className={styles.dashboard}>
              <div className={styles.mainColumn}>
                <RealisasiApbdes laporan={laporan} />
                <RincianBidang bidang={laporan.bidang} />
                <DokumenTerkait dokumen={dokumen} />
              </div>

              <aside className={styles.sideColumn}>
                <GrafikRealisasi
                  serapan={serapan}
                  realisasiBelanja={realisasiBelanja}
                  sisaBelanjaTampil={sisaBelanjaTampil}
                />
                <GrafikTriwulan
                  quarters={quarters}
                  maxQuarter={maxQuarter}
                  totalBelanja={totalBelanja}
                />
                <InfoLaporan laporan={laporan} dokumenCount={dokumen.length} triwulan={triwulan} />
              </aside>
            </div>
          </>
        ) : (
          <section className={styles.emptyState}>
            <span>▤</span>
            <h2>Laporan Keuangan Belum Tersedia</h2>
            <p>
              Data laporan akan ditampilkan setelah pemerintah desa mengisi APBDes dan mencatat
              realisasi keuangan.
            </p>
            <Link href="/kontak">Hubungi Pemerintah Desa</Link>
          </section>
        )}

        <section className={styles.cta}>
          <span>✓</span>
          <div>
            <h2>Transparansi untuk Masyarakat</h2>
            <p>
              Laporan keuangan desa dapat diakses secara terbuka sebagai bentuk akuntabilitas
              pengelolaan keuangan desa.
            </p>
          </div>
          <Link href="/transparansi/apbdes">Lihat Laporan Tahun Lainnya　→</Link>
        </section>
      </div>
      <PublicSiteFooter desa={desa} location={location} logoUrl={logoUrl} />
    </main>
  );
}
