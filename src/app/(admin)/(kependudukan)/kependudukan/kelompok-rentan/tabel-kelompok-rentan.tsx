import Link from "next/link";

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
    <td className="kelompok-rentan-angka">
      {href ? <Link href={href}>{angka.format(value)}</Link> : angka.format(value)}
    </td>
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
    <table className="modul-table kelompok-rentan-table">
      <thead>
        <tr>
          <th rowSpan={2} scope="col">
            Dusun
          </th>
          <th rowSpan={2} scope="col">
            RW
          </th>
          <th rowSpan={2} scope="col">
            RT
          </th>
          <th colSpan={2} scope="colgroup">
            KK
          </th>
          <th colSpan={KELOMPOK_UMUR_RENTAN.length} scope="colgroup">
            Kondisi dan Kelompok Umur
          </th>
          <th colSpan={DISABILITAS_RENTAN.length + 1} scope="colgroup">
            Cacat
          </th>
          <th colSpan={2} scope="colgroup">
            Sakit Menahun
          </th>
          <th rowSpan={2} scope="col">
            Hamil
          </th>
        </tr>
        <tr>
          <th scope="col">L</th>
          <th scope="col">P</th>
          {KELOMPOK_UMUR_RENTAN.map((umur) => (
            <th key={umur.key} scope="col">
              {umur.label}
            </th>
          ))}
          {DISABILITAS_RENTAN.map((value) => (
            <th key={value} scope="col">
              {DISABILITAS_RENTAN_LABELS[value]}
            </th>
          ))}
          <th scope="col">Tidak Cacat</th>
          <th scope="col">L</th>
          <th scope="col">P</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const tautan = (filter: FilterTautan) =>
            tautkan ? tautanPenduduk(row, filter) : undefined;

          return (
            <tr key={row.regionId}>
              <td>{row.dusun}</td>
              <td>{row.rw}</td>
              <td>{row.rt}</td>
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
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={5}>Total</td>
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
        </tr>
      </tfoot>
    </table>
  );
}
