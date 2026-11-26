import type { Metadata } from "next";
import Link from "next/link";

import { TombolCetak } from "@/components/ui/tombol-cetak";
import {
  getStatistikKependudukanCetakData,
  labelFilterWilayah,
  nilaiFilter,
} from "@/features/kependudukan/statistik/application/statistik-kependudukan-use-cases";
import { persen } from "@/features/kependudukan/statistik/domain/statistik-kependudukan";

import { CetakOtomatis } from "./cetak-otomatis";
import styles from "./cetak.module.css";

export const metadata: Metadata = { title: "Cetak Statistik Kependudukan" };

const angka = new Intl.NumberFormat("id-ID");

export default async function CetakStatistikKependudukanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kategoriSlug = nilaiFilter(params.kategori) ?? "";
  const dusun = nilaiFilter(params.dusun);
  const rw = nilaiFilter(params.rw);
  const rt = nilaiFilter(params.rt);
  const nomorParam = nilaiFilter(params.nomor);
  const ttdAngka = Number(nilaiFilter(params.ttd));
  const ttd = Number.isSafeInteger(ttdAngka) && ttdAngka > 0 ? ttdAngka : undefined;
  const otomatis = nilaiFilter(params.auto) === "1";

  const data = await getStatistikKependudukanCetakData({
    kategoriSlug,
    dusun,
    rw,
    rt,
    ttd,
    nomor: nomorParam,
  });

  const kembaliQuery = new URLSearchParams({ kategori: data.kategori.slug });
  if (dusun) kembaliQuery.set("dusun", dusun);
  if (rw) kembaliQuery.set("rw", rw);
  if (rt) kembaliQuery.set("rt", rt);

  const total = data.hasil.total.jumlah;
  const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date());
  const labelBelum = data.kategori.slug.startsWith("bantuan") ? "BUKAN PENERIMA" : "BELUM MENGISI";

  return (
    <div className={styles.page}>
      {otomatis ? <CetakOtomatis /> : null}

      <div className={styles.actions}>
        <Link
          className="button button-secondary"
          href={`/kependudukan/statistik?${kembaliQuery.toString()}`}
        >
          ← Kembali ke Statistik
        </Link>
        <TombolCetak />
      </div>

      <article className={styles.card}>
        <header className={styles.head}>
          <div>
            <strong>
              {data.namaDesa ? `Pemerintah Desa ${data.namaDesa}` : "Pemerintah Desa"}
            </strong>
            <span>Sistem Informasi Desa</span>
            <span>Statistik Kependudukan</span>
          </div>
          <div className={styles.judul}>
            <h1>Laporan {data.kategori.label}</h1>
            <p>{labelFilterWilayah({ dusun, rw, rt })}</p>
            {data.nomor ? <p>Nomor: {data.nomor}</p> : null}
          </div>
        </header>

        <div className={styles.meta}>
          <span>Satuan: {data.kategori.satuan}</span>
          <span>Dicetak: {tanggal}</span>
        </div>

        {data.hasil.baris.length === 0 ? (
          <p className={styles.empty}>Belum ada data untuk kategori ini.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th rowSpan={2}>No.</th>
                  <th rowSpan={2}>Kelompok</th>
                  <th colSpan={2}>Jumlah</th>
                  <th colSpan={2}>Laki-laki</th>
                  <th colSpan={2}>Perempuan</th>
                </tr>
                <tr>
                  <th>Total</th>
                  <th>Persen</th>
                  <th>Total</th>
                  <th>Persen</th>
                  <th>Total</th>
                  <th>Persen</th>
                </tr>
              </thead>
              <tbody>
                {data.hasil.baris.map((row, index) => (
                  <tr key={row.label}>
                    <td>{index + 1}</td>
                    <td>{row.label}</td>
                    <td>{angka.format(row.jumlah)}</td>
                    <td>{persen(row.jumlah, total)}%</td>
                    <td>{angka.format(row.lakiLaki)}</td>
                    <td>{persen(row.lakiLaki, total)}%</td>
                    <td>{angka.format(row.perempuan)}</td>
                    <td>{persen(row.perempuan, total)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th />
                  <th>JUMLAH</th>
                  <th>{angka.format(data.hasil.jumlah.jumlah)}</th>
                  <th>{persen(data.hasil.jumlah.jumlah, total)}%</th>
                  <th>{angka.format(data.hasil.jumlah.lakiLaki)}</th>
                  <th>{persen(data.hasil.jumlah.lakiLaki, total)}%</th>
                  <th>{angka.format(data.hasil.jumlah.perempuan)}</th>
                  <th>{persen(data.hasil.jumlah.perempuan, total)}%</th>
                </tr>
                <tr>
                  <th />
                  <th>{labelBelum}</th>
                  <th>{angka.format(data.hasil.belumMengisi.jumlah)}</th>
                  <th>{persen(data.hasil.belumMengisi.jumlah, total)}%</th>
                  <th>{angka.format(data.hasil.belumMengisi.lakiLaki)}</th>
                  <th>{persen(data.hasil.belumMengisi.lakiLaki, total)}%</th>
                  <th>{angka.format(data.hasil.belumMengisi.perempuan)}</th>
                  <th>{persen(data.hasil.belumMengisi.perempuan, total)}%</th>
                </tr>
                <tr>
                  <th />
                  <th>TOTAL</th>
                  <th>{angka.format(data.hasil.total.jumlah)}</th>
                  <th>{persen(data.hasil.total.jumlah, total)}%</th>
                  <th>{angka.format(data.hasil.total.lakiLaki)}</th>
                  <th>{persen(data.hasil.total.lakiLaki, total)}%</th>
                  <th>{angka.format(data.hasil.total.perempuan)}</th>
                  <th>{persen(data.hasil.total.perempuan, total)}%</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className={styles.signature}>
          <p>
            {data.namaDesa ?? "Desa"}, {tanggal}
          </p>
          <p>{data.pejabat?.jabatan ?? "Pejabat Desa"}</p>
          <div className={styles.ruang} />
          <strong>{data.pejabat?.nama ?? "........................"}</strong>
        </div>
      </article>
    </div>
  );
}
