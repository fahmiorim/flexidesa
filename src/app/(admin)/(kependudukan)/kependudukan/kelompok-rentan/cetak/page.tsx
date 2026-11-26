import type { Metadata } from "next";
import Link from "next/link";

import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getLaporanKelompokRentanData } from "@/features/kependudukan/statistik/application/kelompok-rentan-use-cases";

import { TabelKelompokRentan } from "../tabel-kelompok-rentan";
import styles from "./cetak.module.css";

export const metadata: Metadata = {
  title: "Cetak Laporan Kelompok Rentan",
};

export default async function CetakLaporanKelompokRentanPage({
  searchParams,
}: {
  searchParams: Promise<{ dusun?: string | string[] }>;
}) {
  const params = await searchParams;
  const dusunParam = Array.isArray(params.dusun) ? params.dusun[0] : params.dusun;
  const data = await getLaporanKelompokRentanData(dusunParam);

  const bulan = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date());
  const kembali = data.dusun
    ? `/kependudukan/kelompok-rentan?dusun=${encodeURIComponent(data.dusun)}`
    : "/kependudukan/kelompok-rentan";

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <Link className="button button-secondary" href={kembali}>
          ← Kembali
        </Link>
        <TombolCetak />
      </div>

      <article className={styles.card}>
        <div className={styles.kop}>
          <h3>PEMERINTAH KABUPATEN/KOTA {data.namaKabupaten?.toUpperCase() ?? "—"}</h3>
          <h4>DATA PILAH KEPENDUDUKAN MENURUT UMUR DAN FAKTOR KERENTANAN (LAMPIRAN A - 9)</h4>
          <table className={styles.info}>
            <tbody>
              <tr>
                <td>Desa/Kelurahan</td>
                <td>:</td>
                <td>{data.namaDesa ?? "—"}</td>
              </tr>
              <tr>
                <td>Kecamatan</td>
                <td>:</td>
                <td>{data.namaKecamatan ?? "—"}</td>
              </tr>
              <tr>
                <td>Laporan Bulan</td>
                <td>:</td>
                <td>{bulan}</td>
              </tr>
              {data.dusun ? (
                <tr>
                  <td>Dusun</td>
                  <td>:</td>
                  <td>{data.dusun}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {data.dusun ? (
          <h3 className={styles.subjudul}>DATA PILAH DUSUN {data.dusun.toUpperCase()}</h3>
        ) : null}

        {data.rows.length === 0 ? (
          <p>Belum ada data penduduk pada wilayah ini.</p>
        ) : (
          <div className={styles.tableWrap}>
            <TabelKelompokRentan rows={data.rows} total={data.total} />
          </div>
        )}

        <p className={styles.tanggal}>
          Tanggal cetak :{" "}
          <span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}</span>
        </p>
      </article>
    </div>
  );
}
