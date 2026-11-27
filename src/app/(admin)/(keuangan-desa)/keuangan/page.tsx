import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { getKeuanganBulanan } from "@/features/keuangan-desa/keuangan/application/keuangan-bulanan-use-cases";
import { listKeuangan } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { formatRupiah, toMinor } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { listPembangunan } from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import { statusPembangunanLabel } from "@/features/pembangunan-aset/pembangunan/domain/pembangunan";

import { simpanTargetRealisasiBulananAction } from "./actions";
import styles from "./keuangan.module.css";

export const metadata: Metadata = { title: "Keuangan & Pembangunan" };

const rupiah = (value: bigint) => formatRupiah((Number(value) / 100).toFixed(2));
const pct = (realisasi: string, pagu: string) => {
  const total = toMinor(pagu);
  return total > 0n ? Math.min(100, Number((toMinor(realisasi) * 10000n) / total) / 100) : 0;
};

export default async function KeuanganPage() {
  const keuangan = await listKeuangan();
  const tahun = keuangan.tahun;
  const [pembangunan, bulanan] = await Promise.all([
    listPembangunan({ search: "", tahun, status: "", page: 1, pageSize: 1000 }).catch(() => ({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 1000,
      pageCount: 1,
    })),
    getKeuanganBulanan(tahun),
  ]);
  const akun = new Map(keuangan.rows.map((row) => [row.templateUuid, row]));
  const pendapatan = akun.get("4");
  const belanja = akun.get("5");
  const pembiayaan = akun.get("6");
  const paguBelanja = toMinor(belanja?.anggaran ?? "0");
  const realisasiBelanja = toMinor(belanja?.realisasi ?? "0");
  const sisa = paguBelanja - realisasiBelanja;
  const selesai = pembangunan.rows.filter((row) => row.status === "selesai").length;
  const berjalan = pembangunan.rows.filter((row) => row.status === "berjalan").length;
  const persiapan = pembangunan.rows.filter((row) => row.status === "rencana").length;
  const tertunda = pembangunan.rows.filter((row) => row.status === "dibatalkan").length;

  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Keuangan &amp; Pembangunan</>}
        deskripsi={<>Kelola APBDes dan realisasi anggaran desa.</>}
      />

      <section className={styles.metrics}>
        <article className={styles.metricPrimary}>
          <span>Pagu APBDes {keuangan.tahun}</span>
          <strong>{formatRupiah(pendapatan?.anggaran ?? "0")}</strong>
          <small>Tahun anggaran berjalan</small>
        </article>
        <article className={styles.metric}>
          <span>Realisasi Pendapatan</span>
          <strong>{formatRupiah(pendapatan?.realisasi ?? "0")}</strong>
          <small>
            {pct(pendapatan?.realisasi ?? "0", pendapatan?.anggaran ?? "0").toFixed(1)}% dari pagu
          </small>
        </article>
        <article className={styles.metric}>
          <span>Realisasi Belanja</span>
          <strong>{formatRupiah(belanja?.realisasi ?? "0")}</strong>
          <small>
            {pct(belanja?.realisasi ?? "0", belanja?.anggaran ?? "0").toFixed(1)}% dari pagu
          </small>
        </article>
        <article className={styles.metric}>
          <span>Sisa Anggaran</span>
          <strong>{rupiah(sisa)}</strong>
          <small>Dari pagu belanja</small>
        </article>
        <article className={styles.metric}>
          <span>Total Kegiatan</span>
          <strong>{pembangunan.total} kegiatan</strong>
          <small>
            {selesai} selesai · {berjalan} berjalan
          </small>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Tren Target &amp; Realisasi Bulanan {tahun}</h2>
            <p>
              Grafik memakai data bulanan yang dicatat operator, bukan pembagian otomatis angka
              tahunan.
            </p>
          </div>
          <strong>
            {formatRupiah(bulanan.totalRealisasi)} / {formatRupiah(bulanan.totalTarget)}
          </strong>
        </div>
        <div className={styles.monthChart}>
          {bulanan.rows.map((row) => {
            const max = Math.max(
              1,
              ...bulanan.rows.flatMap((x) => [Number(x.target), Number(x.realisasi)]),
            );
            return (
              <div className={styles.monthColumn} key={row.bulan}>
                <div className={styles.monthBars}>
                  <i
                    className={styles.monthTarget}
                    style={{
                      height:
                        (Number(row.target) > 0
                          ? Math.max(2, (Number(row.target) / max) * 100)
                          : 0) + "%",
                    }}
                  />
                  <i
                    className={styles.monthActual}
                    style={{
                      height:
                        (Number(row.realisasi) > 0
                          ? Math.max(2, (Number(row.realisasi) / max) * 100)
                          : 0) + "%",
                    }}
                  />
                </div>
                <span>{row.label}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.chartLegend}>
          <span>
            <i className={styles.monthTarget} /> Target
          </span>
          <span>
            <i className={styles.monthActual} /> Realisasi
          </span>
        </div>
        <details className={styles.monthEditor}>
          <summary>Input / perbarui target dan realisasi per bulan</summary>
          <form action={simpanTargetRealisasiBulananAction}>
            <input type="hidden" name="tahun" value={tahun} />
            <TableScroll className={styles.tableWrap}>
              <Table className={styles.dataTable}>
                <THead>
                  <Row>
                    <HeaderCell>Bulan</HeaderCell>
                    <HeaderCell>Target (Rp)</HeaderCell>
                    <HeaderCell>Realisasi (Rp)</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {bulanan.rows.map((row) => (
                    <Row key={row.bulan}>
                      <Cell>{row.label}</Cell>
                      <Cell>
                        <input
                          className={styles.moneyInput}
                          type="number"
                          min="0"
                          step="1"
                          name={"target:" + row.bulan}
                          defaultValue={Number(row.target)}
                        />
                      </Cell>
                      <Cell>
                        <input
                          className={styles.moneyInput}
                          type="number"
                          min="0"
                          step="1"
                          name={"realisasi:" + row.bulan}
                          defaultValue={Number(row.realisasi)}
                        />
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
            <Button type="submit">Simpan Data Bulanan</Button>
          </form>
        </details>
      </section>
      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Ringkasan APBDes {keuangan.tahun}</h2>
              <p>Ikhtisar pagu dan realisasi per akun utama</p>
            </div>
            <Link href="/keuangan/apbdes">Kelola APBDes →</Link>
          </div>
          <div className={styles.accountRows}>
            {[
              ["Pendapatan Desa", pendapatan],
              ["Belanja Desa", belanja],
              ["Pembiayaan Desa", pembiayaan],
            ].map(([label, row]) => {
              const item = row as (typeof keuangan.rows)[number] | undefined;
              const progress = pct(item?.realisasi ?? "0", item?.anggaran ?? "0");
              return (
                <div className={styles.accountRow} key={String(label)}>
                  <div>
                    <strong>{String(label)}</strong>
                    <span>
                      {formatRupiah(item?.realisasi ?? "0")} / {formatRupiah(item?.anggaran ?? "0")}
                    </span>
                  </div>
                  <div className={styles.progress}>
                    <i style={{ width: progress + "%" }} />
                  </div>
                  <b>{progress.toFixed(1)}%</b>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Status Kegiatan Pembangunan</h2>
              <p>Ringkasan kegiatan tahun anggaran {tahun}</p>
            </div>
            <Link href="/keuangan/kegiatan">Lihat semua →</Link>
          </div>
          <div className={styles.statusGrid}>
            <div>
              <strong>{selesai}</strong>
              <span>Selesai</span>
            </div>
            <div>
              <strong>{berjalan}</strong>
              <span>Berjalan</span>
            </div>
            <div>
              <strong>{persiapan}</strong>
              <span>Persiapan</span>
            </div>
            <div>
              <strong>{tertunda}</strong>
              <span>Tertunda</span>
            </div>
          </div>
          <p className={styles.note}>
            Ringkasan status dihitung dari maksimal 1.000 kegiatan terbaru pada tahun anggaran ini.
          </p>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Kegiatan &amp; Pembangunan Terbaru</h2>
              <p>Proyek yang tercatat pada tahun {tahun}</p>
            </div>
            <Link href="/keuangan/kegiatan">Kelola kegiatan →</Link>
          </div>
          {pembangunan.rows.length ? (
            <div className={styles.projectList}>
              {pembangunan.rows.map((row) => (
                <div className={styles.project} key={row.id}>
                  <div>
                    <strong>{row.judul}</strong>
                    <span>
                      {row.lokasi || "Lokasi belum diisi"} · {row.tahunAnggaran}
                    </span>
                  </div>
                  <div className={styles.projectMeta}>
                    <b>{statusPembangunanLabel(row.status)}</b>
                    <span>{row.progres}%</span>
                  </div>
                  <div className={styles.progress}>
                    <i style={{ width: row.progres + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              Belum ada kegiatan pembangunan untuk tahun ini. Tambahkan kegiatan pertama melalui
              menu Kegiatan &amp; Pembangunan.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
