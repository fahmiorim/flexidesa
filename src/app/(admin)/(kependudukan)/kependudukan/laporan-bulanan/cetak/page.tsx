import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { TombolCetak } from "@/components/ui/tombol-cetak";
import {
  getLaporanBulanan,
  getPamongPenandaTangan,
  type PamongPenandaTangan,
} from "@/features/kependudukan/laporan-bulanan/application/laporan-bulanan-use-cases";
import { normalisasiPeriode } from "@/features/kependudukan/laporan-bulanan/domain/laporan-bulanan";
import {
  KopLaporanBulanan,
  TabelLaporanBulanan,
} from "@/features/kependudukan/laporan-bulanan/presentation/laporan-bulanan-tampilan";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Cetak Laporan Kependudukan Bulanan" };

const tanggalCetak = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function teks(kolom: string | string[] | undefined): string | null {
  return typeof kolom === "string" ? kolom : null;
}

/** Penanda tangan awal: kepala desa, lalu sekretaris desa, lalu aparat pertama. */
function penandaTanganAwal(pamong: readonly PamongPenandaTangan[]): PamongPenandaTangan | null {
  return (
    pamong.find((row) => row.jenisJabatan === "kades") ??
    pamong.find((row) => row.jenisJabatan === "sekdes") ??
    pamong[0] ??
    null
  );
}

export default async function CetakLaporanBulananPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  if (!hasPermission(user.permissions, RESOURCES.laporanBulanan, "read")) notFound();

  const periode = normalisasiPeriode(teks(params.tahun), teks(params.bulan));
  const [laporan, pamong] = await Promise.all([
    getLaporanBulanan(String(periode.tahun), String(periode.bulan)),
    getPamongPenandaTangan(),
  ]);

  const diminta = Number(teks(params.ttd));
  const penandaTangan =
    pamong.find((row) => Number.isInteger(diminta) && row.id === diminta) ??
    penandaTanganAwal(pamong);

  return (
    <div className="modul-page laporan-bulanan-page laporan-bulanan-cetak-page">
      <PageHeading
        judul={<>Laporan Kependudukan Bulanan</>}
        deskripsi={<>Pilih aparat penanda tangan, lalu cetak laporan.</>}
      />

      <section className="platform-card data-panel laporan-bulanan-toolbar">
        <form className="data-custom-filter" method="get">
          <input name="tahun" type="hidden" value={periode.tahun} />
          <input name="bulan" type="hidden" value={periode.bulan} />
          <label className="form-field">
            <span className="form-label">Laporan ditandatangani oleh</span>
            <select
              className="form-input"
              defaultValue={penandaTangan ? String(penandaTangan.id) : ""}
              disabled={pamong.length === 0}
              name="ttd"
            >
              {pamong.length === 0 ? <option value="">Belum ada aparat aktif</option> : null}
              {pamong.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.nama}
                  {row.jabatan ? ` (${row.jabatan})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="data-custom-actions">
            <button
              className="button button-secondary"
              disabled={pamong.length === 0}
              type="submit"
            >
              Terapkan
            </button>
            <TombolCetak />
            <a
              className="button button-secondary"
              href={`/kependudukan/laporan-bulanan?tahun=${periode.tahun}&bulan=${periode.bulan}`}
            >
              Kembali
            </a>
          </div>
        </form>
      </section>

      <section className="platform-card data-panel laporan-bulanan-lembar">
        <KopLaporanBulanan
          kabupaten={laporan.kabupaten}
          kecamatan={laporan.kecamatan}
          labelPeriode={laporan.labelPeriode}
          namaDesa={laporan.namaDesa}
        />
        <TabelLaporanBulanan baris={laporan.baris} />

        <div className="laporan-bulanan-ttd">
          <p>
            {laporan.namaDesa ?? "-"}, {tanggalCetak.format(new Date())}
          </p>
          <p>{penandaTangan?.jabatan ?? "-"}</p>
          <div className="laporan-bulanan-ttd-ruang" />
          <p className="laporan-bulanan-ttd-nama">( {penandaTangan?.nama ?? "-"} )</p>
          <p>NIP/NIAP {penandaTangan?.nip ?? penandaTangan?.niap ?? "-"}</p>
        </div>
      </section>
    </div>
  );
}
