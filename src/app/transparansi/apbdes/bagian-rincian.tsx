import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";

import styles from "./apbdes.module.css";
import { JudulSeksi, type LaporanApbdes } from "./bagian-apbdes";

export function RincianPendapatan({
  pendapatan,
  totalPendapatan,
}: {
  pendapatan: LaporanApbdes["pendapatan"];
  totalPendapatan: string;
}) {
  return (
    <section id="laporan" className={styles.panel}>
      <JudulSeksi
        ikon="♧"
        judul="Rincian Pendapatan Desa"
        keterangan="Rencana per sumber pendapatan."
      />
      {pendapatan.length ? (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Sumber Pendapatan</th>
                <th>Rencana (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {pendapatan.map((row, index) => (
                <tr key={row.kode}>
                  <td>{index + 1}</td>
                  <td>{row.uraian}</td>
                  <td>{formatRupiah(row.anggaran)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>Total Pendapatan Desa</th>
                <th>{formatRupiah(totalPendapatan)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>Rincian sumber pendapatan belum diisi pada APBDes.</p>
      )}
    </section>
  );
}

export function RincianBelanja({
  bidang,
  totalBelanja,
}: {
  bidang: LaporanApbdes["bidang"];
  totalBelanja: string;
}) {
  return (
    <section className={styles.panel}>
      <JudulSeksi
        ikon="🛒"
        judul="Rincian Belanja Desa"
        keterangan="Rencana anggaran per bidang."
      />
      {bidang.length ? (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Bidang Belanja</th>
                <th>Rencana (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {bidang.map((row, index) => (
                <tr key={row.kode}>
                  <td>{index + 1}</td>
                  <td>{row.uraian}</td>
                  <td>{formatRupiah(row.anggaran)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={2}>Total Belanja Desa</th>
                <th>{formatRupiah(totalBelanja)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>Rincian bidang belanja belum diisi pada APBDes.</p>
      )}
    </section>
  );
}
