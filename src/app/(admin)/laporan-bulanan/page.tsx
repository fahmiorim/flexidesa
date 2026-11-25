import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getLaporanBulanan } from "@/features/laporan-bulanan/application/laporan-bulanan-use-cases";
import {
  NAMA_BULAN,
  normalisasiPeriode,
  TAHUN_AWAL,
} from "@/features/laporan-bulanan/domain/laporan-bulanan";
import {
  KopLaporanBulanan,
  TabelLaporanBulanan,
} from "@/features/laporan-bulanan/presentation/laporan-bulanan-tampilan";
import { hasPermission } from "@/features/rbac/application/authorization";
import { RESOURCES } from "@/features/rbac/domain/resources";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Laporan Kependudukan Bulanan" };

function nilai(kolom: string | string[] | undefined): string | null {
  return typeof kolom === "string" ? kolom.slice(0, 4) : null;
}

export default async function LaporanBulananPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  if (!hasPermission(user.permissions, RESOURCES.laporanBulanan, "read")) notFound();

  const periode = normalisasiPeriode(nilai(params.tahun), nilai(params.bulan));
  const laporan = await getLaporanBulanan(String(periode.tahun), String(periode.bulan));

  const tahunSekarang = new Date().getFullYear();
  const tahunPilihan = Array.from(
    new Set([periode.tahun, ...Array.from({ length: 10 }, (_, i) => tahunSekarang - i)]),
  )
    .filter((tahun) => tahun >= TAHUN_AWAL)
    .sort((a, b) => b - a);
  const eksporHref = `/laporan-bulanan/ekspor?tahun=${periode.tahun}&bulan=${periode.bulan}`;
  const cetakHref = `/laporan-bulanan/cetak?tahun=${periode.tahun}&bulan=${periode.bulan}`;

  return (
    <div className="modul-page data-kependudukan-page laporan-bulanan-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Laporan Kependudukan Bulanan</h1>
            <p>Laporan bulanan penduduk (Lampiran A-9).</p>
          </div>
          <div className="penduduk-heading-actions">
            <a className="button button-secondary" href={eksporHref}>
              Unduh CSV
            </a>
            <a className="button button-primary" href={cetakHref}>
              Cetak
            </a>
          </div>
        </header>
      </PageHeading>

      <section className="platform-card data-panel">
        <header className="data-section-heading">
          <div>
            <h2>Periode Laporan</h2>
            <p>Pilih tahun dan bulan, lalu tampilkan laporan.</p>
          </div>
        </header>
        <form className="data-custom-filter" method="get">
          <label className="form-field">
            <span className="form-label">Tahun</span>
            <select className="form-input" defaultValue={String(periode.tahun)} name="tahun">
              {tahunPilihan.map((tahun) => (
                <option key={tahun} value={tahun}>
                  {tahun}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Bulan</span>
            <select className="form-input" defaultValue={String(periode.bulan)} name="bulan">
              {NAMA_BULAN.map((nama, index) => (
                <option key={nama} value={index + 1}>
                  {nama}
                </option>
              ))}
            </select>
          </label>
          <div className="data-custom-actions">
            <button className="button button-primary" type="submit">
              Tampilkan
            </button>
          </div>
        </form>
      </section>

      <section className="platform-card data-panel">
        <KopLaporanBulanan
          kabupaten={laporan.kabupaten}
          kecamatan={laporan.kecamatan}
          labelPeriode={laporan.labelPeriode}
          namaDesa={laporan.namaDesa}
        />

        <TabelLaporanBulanan baris={laporan.baris} />

        <footer>
          <span>
            Angka awal dan akhir bulan dihitung langsung dari data penduduk pada tanggal tersebut.
          </span>
          <span>
            Penduduk berstatus Hilang dihitung sebagai peristiwa hilang, bukan lagi penduduk aktif.
          </span>
        </footer>
      </section>
    </div>
  );
}
