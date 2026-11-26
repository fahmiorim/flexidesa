import type { BarisLaporanBulanan } from "@/features/kependudukan/laporan-bulanan/domain/laporan-bulanan";

const number = new Intl.NumberFormat("id-ID");

/** Kepala laporan (kabupaten, desa, kecamatan, periode) untuk tampilan & cetak. */
export function KopLaporanBulanan({
  kabupaten,
  namaDesa,
  kecamatan,
  labelPeriode,
}: {
  kabupaten: string | null;
  namaDesa: string | null;
  kecamatan: string | null;
  labelPeriode: string;
}) {
  return (
    <header className="laporan-bulanan-kop">
      <strong>PEMERINTAH KABUPATEN/KOTA {(kabupaten ?? "-").toUpperCase()}</strong>
      <h2>LAPORAN PERKEMBANGAN PENDUDUK (LAMPIRAN A-9)</h2>
      <dl>
        <div>
          <dt>Desa/Kelurahan</dt>
          <dd>{namaDesa ?? "-"}</dd>
        </div>
        <div>
          <dt>Kecamatan</dt>
          <dd>{kecamatan ?? "-"}</dd>
        </div>
        <div>
          <dt>Bulan/Tahun</dt>
          <dd>{labelPeriode}</dd>
        </div>
      </dl>
    </header>
  );
}

/** Tabel 12 kolom Lampiran A-9, dipakai halaman laporan maupun cetak. */
export function TabelLaporanBulanan({ baris }: { baris: readonly BarisLaporanBulanan[] }) {
  return (
    <div className="table-scroll">
      <table className="data-table laporan-bulanan-table">
        <thead>
          <tr>
            <th rowSpan={3}>No</th>
            <th rowSpan={3}>Perincian</th>
            <th colSpan={7}>Penduduk</th>
            <th colSpan={3} rowSpan={2}>
              Keluarga (KK)
            </th>
          </tr>
          <tr>
            <th colSpan={2}>WNI</th>
            <th colSpan={2}>WNA</th>
            <th colSpan={3}>Jumlah</th>
          </tr>
          <tr>
            <th>L</th>
            <th>P</th>
            <th>L</th>
            <th>P</th>
            <th>L</th>
            <th>P</th>
            <th>L+P</th>
            <th>L</th>
            <th>P</th>
            <th>L+P</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((item, index) => (
            <tr key={item.kode}>
              <td>{index + 1}</td>
              <td>{item.label}</td>
              <td>{number.format(item.wniL)}</td>
              <td>{number.format(item.wniP)}</td>
              <td>{number.format(item.wnaL)}</td>
              <td>{number.format(item.wnaP)}</td>
              <td>{number.format(item.jmlL)}</td>
              <td>{number.format(item.jmlP)}</td>
              <td>
                <strong>{number.format(item.jml)}</strong>
              </td>
              <td>{number.format(item.kkL)}</td>
              <td>{number.format(item.kkP)}</td>
              <td>
                <strong>{number.format(item.kk)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
