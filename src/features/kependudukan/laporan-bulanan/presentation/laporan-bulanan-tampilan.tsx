import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
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

/** Tabel 12 kolom, dipakai halaman laporan maupun cetak. */
export function TabelLaporanBulanan({ baris }: { baris: readonly BarisLaporanBulanan[] }) {
  return (
    <TableScroll>
      <Table className="laporan-bulanan-table">
        <THead>
          <Row>
            <HeaderCell rowSpan={3}>No</HeaderCell>
            <HeaderCell rowSpan={3}>Perincian</HeaderCell>
            <HeaderCell colSpan={7}>Penduduk</HeaderCell>
            <HeaderCell colSpan={3} rowSpan={2}>
              Keluarga (KK)
            </HeaderCell>
          </Row>
          <Row>
            <HeaderCell colSpan={2}>WNI</HeaderCell>
            <HeaderCell colSpan={2}>WNA</HeaderCell>
            <HeaderCell colSpan={3}>Jumlah</HeaderCell>
          </Row>
          <Row>
            <HeaderCell>L</HeaderCell>
            <HeaderCell>P</HeaderCell>
            <HeaderCell>L</HeaderCell>
            <HeaderCell>P</HeaderCell>
            <HeaderCell>L</HeaderCell>
            <HeaderCell>P</HeaderCell>
            <HeaderCell>L+P</HeaderCell>
            <HeaderCell>L</HeaderCell>
            <HeaderCell>P</HeaderCell>
            <HeaderCell>L+P</HeaderCell>
          </Row>
        </THead>
        <TBody>
          {baris.map((item, index) => (
            <Row key={item.kode}>
              <Cell>{index + 1}</Cell>
              <Cell>{item.label}</Cell>
              <Cell>{number.format(item.wniL)}</Cell>
              <Cell>{number.format(item.wniP)}</Cell>
              <Cell>{number.format(item.wnaL)}</Cell>
              <Cell>{number.format(item.wnaP)}</Cell>
              <Cell>{number.format(item.jmlL)}</Cell>
              <Cell>{number.format(item.jmlP)}</Cell>
              <Cell>
                <strong>{number.format(item.jml)}</strong>
              </Cell>
              <Cell>{number.format(item.kkL)}</Cell>
              <Cell>{number.format(item.kkP)}</Cell>
              <Cell>
                <strong>{number.format(item.kk)}</strong>
              </Cell>
            </Row>
          ))}
        </TBody>
      </Table>
    </TableScroll>
  );
}
