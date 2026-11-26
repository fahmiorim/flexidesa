import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import {
  getLaporanRumahTangga,
  getRtmFilterOptions,
} from "@/features/kependudukan/rumah-tangga/application/use-cases";
import {
  filterRtmKeSearchParams,
  parseFilterRtm,
} from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";

import styles from "../rumah-tangga.module.css";

export const metadata: Metadata = { title: "Laporan Rumah Tangga" };
const number = new Intl.NumberFormat("id-ID");

export default async function LaporanRumahTanggaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = parseFilterRtm(params);
  const [hasil, filterOptions] = await Promise.all([
    getLaporanRumahTangga(filter),
    getRtmFilterOptions(),
  ]);
  const query = filterRtmKeSearchParams(filter).toString();
  const exportHref = `/kependudukan/rumah-tangga/laporan/ekspor${query ? `?${query}` : ""}`;

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kependudukan/rumah-tangga">
        ← Kembali ke daftar rumah tangga
      </Link>
      <PageHeading
        judul={<>Laporan Rumah Tangga</>}
        deskripsi={<>Rekap jumlah RTM dan anggota menurut kelas sosial serta dusun.</>}
        aksi={
          <>
            <div className="page-heading-actions">
              <Link className="button button-primary" href={exportHref}>
                Ekspor CSV
              </Link>
            </div>
          </>
        }
      />

      <section className="data-kependudukan-kpis">
        <article className="data-kpi data-kpi-primary">
          <span>Rumah Tangga</span>
          <strong>{number.format(hasil.rekap.totalRtm)} RTM</strong>
          <small>{hasil.namaDesa ?? "Desa aktif"}</small>
        </article>
        <article className="data-kpi">
          <span>Anggota</span>
          <strong>{number.format(hasil.rekap.totalAnggota)} orang</strong>
          <small>Seluruh anggota yang terhubung</small>
        </article>
        <article className="data-kpi">
          <span>Rata-rata</span>
          <strong>
            {number.format(
              hasil.rekap.totalRtm === 0
                ? 0
                : Number((hasil.rekap.totalAnggota / hasil.rekap.totalRtm).toFixed(1)),
            )}
          </strong>
          <small>Anggota per rumah tangga</small>
        </article>
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Filter Laporan</h2>
          <p>Filter yang sama dipakai untuk ekspor CSV.</p>
        </header>
        <form className="data-filter" method="get">
          <input
            aria-label="Cari rumah tangga"
            defaultValue={filter.search}
            name="q"
            placeholder="Cari nomor RTM, kepala, NIK, alamat, BDT…"
            type="search"
          />
          <select
            aria-label="Kelas sosial"
            defaultValue={filter.kelasSosial ?? ""}
            name="kelasSosial"
          >
            <option value="">Semua kelas sosial</option>
            {filterOptions.kelasSosial.map((kelas) => (
              <option key={kelas} value={kelas}>
                Kelas {kelas}
              </option>
            ))}
          </select>
          <select aria-label="Dusun" defaultValue={filter.dusun} name="dusun">
            <option value="">Semua dusun</option>
            {filterOptions.dusun.map((dusun) => (
              <option key={dusun} value={dusun}>
                {dusun}
              </option>
            ))}
          </select>
          <button className="button button-secondary" type="submit">
            Terapkan
          </button>
          {query ? (
            <Link className="button button-secondary" href="/kependudukan/rumah-tangga/laporan">
              Reset
            </Link>
          ) : null}
        </form>
      </section>

      <div className={styles.reportGrid}>
        <section className="platform-card data-panel">
          <header>
            <h2>Menurut Kelas Sosial</h2>
            <p>Sebaran kesejahteraan rumah tangga.</p>
          </header>
          <RecapTable rows={hasil.rekap.perKelasSosial} />
        </section>
        <section className="platform-card data-panel">
          <header>
            <h2>Menurut Dusun</h2>
            <p>Sebaran rumah tangga per wilayah.</p>
          </header>
          <RecapTable rows={hasil.rekap.perDusun} />
        </section>
      </div>
    </div>
  );
}

function RecapTable({
  rows,
}: {
  rows: readonly { label: string; jumlahRtm: number; jumlahAnggota: number; percentage: number }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="modul-empty">
        <strong>Belum ada data.</strong>
        <p>Tambahkan rumah tangga terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Kelompok</th>
            <th>RTM</th>
            <th>Anggota</th>
            <th>Persentase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{number.format(row.jumlahRtm)}</td>
              <td>{number.format(row.jumlahAnggota)}</td>
              <td>
                <div className={styles.percentage}>
                  <span style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }} />
                </div>
                {row.percentage.toLocaleString("id-ID")}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
