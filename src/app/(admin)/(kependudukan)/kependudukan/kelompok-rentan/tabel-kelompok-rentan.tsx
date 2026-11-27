import Link from "next/link";

import { Cell, HeaderCell, Row, Table, TBody, TFoot, THead } from "@/components/ui/table";
import {
  DISABILITAS_RENTAN,
  DISABILITAS_RENTAN_LABELS,
  KELOMPOK_UMUR_RENTAN,
  type BarisKelompokRentan,
  type KelompokUmurRentan,
} from "@/features/kependudukan/statistik/domain/kelompok-rentan";

const angka = new Intl.NumberFormat("id-ID");

/** Parameter tambahan di luar wilayah pada tautan daftar penduduk. */
type FilterTautan = Record<string, string>;

/** Batas umur yang sama dengan perhitungan laporan. */
const FILTER_UMUR: Record<KelompokUmurRentan, FilterTautan> = {
  bayi: { umurMin: "0", umurMax: "0" },
  balita: { umurMin: "1", umurMax: "5" },
  sd: { umurMin: "6", umurMax: "12" },
  smp: { umurMin: "13", umurMax: "15" },
  sma: { umurMin: "16", umurMax: "18" },
  lansia: { umurMin: "61" },
};

/**
 * Tautan ke daftar penduduk RT ini, mengikuti tautan angka OpenSID.
 *
 * Hanya penduduk hidup yang dihitung laporan, jadi daftar pun dibatasi
 * `status=alive` agar jumlahnya sama dengan angka yang diklik.
 */
function tautanPenduduk(row: BarisKelompokRentan, filter: FilterTautan): string {
  const query = new URLSearchParams({
    status: "alive",
    dusun: row.dusun,
    rw: row.rw,
    rt: row.rt,
    ...filter,
  });
  return `/kependudukan/penduduk?${query.toString()}`;
}

function Nilai({ value, href }: { value: number; href?: string }) {
  return (
    <Cell className="kelompok-rentan-angka">
      {href ? <Link href={href}>{angka.format(value)}</Link> : angka.format(value)}
    </Cell>
  );
}

/**
 * Tabel laporan kelompok rentan, dipakai halaman layar dan halaman cetak.
 *
 * Susunan kolom mengikuti OpenSID: grup "KK" berisi kolom L/P (OpenSID tidak
 * mencetak angka KK), lalu kelompok umur, cacat, sakit menahun, dan hamil.
 * Angka menjadi tautan daftar penduduk terfilter hanya saat `tautkan` aktif
 * (halaman layar), bukan pada hasil cetak.
 */
export function TabelKelompokRentan({
  rows,
  total,
  tautkan = false,
}: {
  rows: BarisKelompokRentan[];
  total: BarisKelompokRentan;
  tautkan?: boolean;
}) {
  return (
    <Table className="kelompok-rentan-table">
      <THead>
        <Row>
          <HeaderCell rowSpan={2} scope="col">
            Dusun
          </HeaderCell>
          <HeaderCell rowSpan={2} scope="col">
            RW
          </HeaderCell>
          <HeaderCell rowSpan={2} scope="col">
            RT
          </HeaderCell>
          <HeaderCell colSpan={2} scope="colgroup">
            KK
          </HeaderCell>
          <HeaderCell colSpan={KELOMPOK_UMUR_RENTAN.length} scope="colgroup">
            Kondisi dan Kelompok Umur
          </HeaderCell>
          <HeaderCell colSpan={DISABILITAS_RENTAN.length + 1} scope="colgroup">
            Cacat
          </HeaderCell>
          <HeaderCell colSpan={2} scope="colgroup">
            Sakit Menahun
          </HeaderCell>
          <HeaderCell rowSpan={2} scope="col">
            Hamil
          </HeaderCell>
        </Row>
        <Row>
          <HeaderCell scope="col">L</HeaderCell>
          <HeaderCell scope="col">P</HeaderCell>
          {KELOMPOK_UMUR_RENTAN.map((umur) => (
            <HeaderCell key={umur.key} scope="col">
              {umur.label}
            </HeaderCell>
          ))}
          {DISABILITAS_RENTAN.map((value) => (
            <HeaderCell key={value} scope="col">
              {DISABILITAS_RENTAN_LABELS[value]}
            </HeaderCell>
          ))}
          <HeaderCell scope="col">Tidak Cacat</HeaderCell>
          <HeaderCell scope="col">L</HeaderCell>
          <HeaderCell scope="col">P</HeaderCell>
        </Row>
      </THead>
      <TBody>
        {rows.map((row) => {
          const tautan = (filter: FilterTautan) =>
            tautkan ? tautanPenduduk(row, filter) : undefined;

          return (
            <Row key={row.regionId}>
              <Cell>{row.dusun}</Cell>
              <Cell>{row.rw}</Cell>
              <Cell>{row.rt}</Cell>
              <Nilai href={tautan({ gender: "male" })} value={row.lakiLaki} />
              <Nilai href={tautan({ gender: "female" })} value={row.perempuan} />
              {KELOMPOK_UMUR_RENTAN.map((umur) => (
                <Nilai key={umur.key} href={tautan(FILTER_UMUR[umur.key])} value={row[umur.key]} />
              ))}
              {DISABILITAS_RENTAN.map((value) => (
                <Nilai
                  key={value}
                  href={tautan({ disabilitas: value })}
                  value={row.disabilitas[value]}
                />
              ))}
              <Nilai href={tautan({ disabilitas: "none" })} value={row.tidakCacat} />
              <Nilai
                href={tautan({ sakitMenahun: "ada", gender: "male" })}
                value={row.sakitLakiLaki}
              />
              <Nilai
                href={tautan({ sakitMenahun: "ada", gender: "female" })}
                value={row.sakitPerempuan}
              />
              <Nilai href={tautan({ hamil: "pregnant" })} value={row.hamil} />
            </Row>
          );
        })}
      </TBody>
      <TFoot>
        <Row>
          <Cell colSpan={5}>Total</Cell>
          <Nilai value={total.bayi} />
          <Nilai value={total.balita} />
          <Nilai value={total.sd} />
          <Nilai value={total.smp} />
          <Nilai value={total.sma} />
          <Nilai value={total.lansia} />
          {DISABILITAS_RENTAN.map((value) => (
            <Nilai key={value} value={total.disabilitas[value]} />
          ))}
          <Nilai value={total.tidakCacat} />
          <Nilai value={total.sakitLakiLaki} />
          <Nilai value={total.sakitPerempuan} />
          <Nilai value={total.hamil} />
        </Row>
      </TFoot>
    </Table>
  );
}
