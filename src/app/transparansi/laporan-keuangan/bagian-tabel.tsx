import Link from "next/link";

import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import { persen, tanggal, type DokumenLaporan, type LaporanKeuangan } from "./bagian-laporan";
import styles from "./laporan-keuangan.module.css";

export function RealisasiApbdes({ laporan }: { laporan: LaporanKeuangan }) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionTitle}>
        <span>▥</span>
        <div>
          <h2>Realisasi APBDes {laporan.tahun}</h2>
          <p>Ringkasan pendapatan, belanja, dan pembiayaan desa.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Uraian</th>
              <th>Anggaran (Rp)</th>
              <th>Realisasi (Rp)</th>
              <th>Persentase</th>
            </tr>
          </thead>
          <tbody>
            {laporan.baris.map((row, index) => (
              <tr key={row.kode} className={styles["row" + index]}>
                <td>
                  <span className={styles.rowDot} />
                  {row.uraian}
                </td>
                <td>{formatRupiah(row.anggaran)}</td>
                <td>{formatRupiah(row.realisasi)}</td>
                <td>{persen(row.persen)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total Pendapatan + Belanja + Pembiayaan</th>
              <th>{formatRupiah(laporan.total.anggaran)}</th>
              <th>{formatRupiah(laporan.total.realisasi)}</th>
              <th>—</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className={styles.note}>
        Nilai ditampilkan berdasarkan pencatatan APBDes tenant desa yang sedang diakses.
      </div>
    </section>
  );
}

export function RincianBidang({ bidang }: { bidang: LaporanKeuangan["bidang"] }) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionTitle}>
        <span>▤</span>
        <div>
          <h2>Rincian Belanja per Bidang</h2>
          <p>Perbandingan anggaran dan realisasi pada setiap bidang belanja.</p>
        </div>
      </div>
      {bidang.length ? (
        <div className={styles.budgetRows}>
          {bidang.map((row) => (
            <div className={styles.budgetRow} key={row.kode}>
              <div>
                <strong>{row.uraian}</strong>
                <small>
                  {formatRupiah(row.realisasi)} / {formatRupiah(row.anggaran)}
                </small>
              </div>
              <div className={styles.progress}>
                <i style={{ width: Math.min(100, Math.max(0, row.persen)) + "%" }} />
              </div>
              <b>{persen(row.persen)}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Rincian bidang belanja belum tersedia.</p>
      )}
    </section>
  );
}

export function DokumenTerkait({ dokumen }: { dokumen: DokumenLaporan[] }) {
  return (
    <section className={styles.panel}>
      <div className={styles.sectionTitle}>
        <span>▧</span>
        <div>
          <h2>Dokumen Terkait</h2>
          <p>Dokumen APBDes yang telah diserahkan dan dapat diakses publik.</p>
        </div>
      </div>
      {dokumen.length ? (
        <div className={styles.documents}>
          {dokumen.map((doc) => (
            <article key={doc.id}>
              <span className={styles.pdf}>PDF</span>
              <div>
                <strong>{doc.judul}</strong>
                <small>
                  {doc.tahun} · {doc.semesterLabel} · Diserahkan {tanggal(doc.diserahkanPada)}
                </small>
              </div>
              <Link
                href={"/desa/apbdes/dokumen/" + doc.id + "/berkas"}
                aria-label={"Unduh " + doc.judul}
              >
                ↓
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Belum ada dokumen APBDes yang dipublikasikan untuk tahun ini. Dokumen akan muncul setelah
          Admin Desa mengunggah dan mencatat penyerahannya.
        </p>
      )}
    </section>
  );
}
