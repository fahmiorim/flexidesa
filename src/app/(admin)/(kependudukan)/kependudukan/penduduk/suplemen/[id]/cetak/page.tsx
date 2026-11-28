import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button-link";
import { TombolCetak } from "@/components/ui/tombol-cetak";
import {
  filterTerdataDariQuery,
  getCetakSuplemenData,
  labelSasaranSuplemen,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { labelKolomIsian } from "@/features/kependudukan/penduduk/domain/suplemen";
import { formatTanggal } from "@/lib/format-tanggal";

import styles from "../../suplemen.module.css";

export const metadata: Metadata = { title: "Cetak Daftar Terdata Suplemen" };

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function CetakSuplemenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: mentah } = await params;
  const id = Number(mentah);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const query = await searchParams;
  const filterParams = new URLSearchParams();
  for (const kunci of ["q", "sex", "dusun", "rw", "rt"]) {
    const nilai = Array.isArray(query[kunci]) ? query[kunci][0] : query[kunci];
    if (nilai && nilai.trim() !== "") filterParams.set(kunci, nilai);
  }
  const filter = filterTerdataDariQuery(filterParams);
  const cetakQuery = filterParams.toString();

  const data = await getCetakSuplemenData(id, filter);
  if (!data) notFound();

  const { suplemen, rows, desa, sekretaris } = data;
  const sasaranPenduduk = suplemen.sasaran !== 2;
  const kolomIsian = [...new Set(rows.flatMap((row) => Object.keys(row.isian)))];
  const kop = [
    desa?.namaPropinsi ? `PEMERINTAH PROVINSI ${desa.namaPropinsi.toUpperCase()}` : null,
    desa?.namaKabupaten ? `KABUPATEN ${desa.namaKabupaten.toUpperCase()}` : null,
    desa?.namaKecamatan ? `KECAMATAN ${desa.namaKecamatan.toUpperCase()}` : null,
    desa?.namaDesa ? `DESA ${desa.namaDesa.toUpperCase()}` : "PEMERINTAH DESA",
  ].filter((baris): baris is string => baris !== null);
  const namaSekretaris = sekretaris
    ? [sekretaris.gelarDepan, sekretaris.nama, sekretaris.gelarBelakang].filter(Boolean).join(" ")
    : null;

  return (
    <div className="modul-page pemerintahan-page pemerintahan-cetak">
      <header className="page-heading pemerintahan-cetak-toolbar">
        <div>
          <span className="eyebrow">DATA SUPLEMEN</span>
          <h1>Cetak Daftar Terdata</h1>
          <p>Daftar sesuai filter aktif, siap dicetak atau disimpan sebagai PDF.</p>
        </div>
        <div className="page-heading-actions">
          <ButtonLink variant="ghost" href={`/kependudukan/penduduk/suplemen/${id}`}>
            Kembali
          </ButtonLink>
          <ButtonLink
            variant="ghost"
            href={`/kependudukan/penduduk/suplemen/${id}/cetak/unduh${cetakQuery ? `?${cetakQuery}` : ""}`}
          >
            Unduh CSV
          </ButtonLink>
          <TombolCetak />
        </div>
      </header>

      <section className="modul-card">
        <header className="pemerintahan-cetak-kop">
          {kop.map((baris) => (
            <strong key={baris}>{baris}</strong>
          ))}
        </header>
        <h2 className="pemerintahan-cetak-judul">
          DAFTAR TERDATA SUPLEMEN {suplemen.nama.toUpperCase()}
        </h2>
        <p className={styles.cetakMeta}>
          <strong>Sasaran Suplemen : </strong>
          {labelSasaranSuplemen(suplemen.sasaran)}
          <br />
          <strong>Keterangan : </strong>
          {suplemen.keterangan?.trim() || "—"}
        </p>

        {rows.length === 0 ? (
          <p className="pemerintahan-cetak-kosong">Belum ada data terdata untuk dicetak.</p>
        ) : (
          <div className="modul-table-wrap">
            <table className="modul-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>{sasaranPenduduk ? "No." : "NIK"} KK</th>
                  <th>{sasaranPenduduk ? "NIK Penduduk" : "No. KK"}</th>
                  <th>{sasaranPenduduk ? "Nama Penduduk" : "Kepala Keluarga"}</th>
                  <th>Tempat Lahir</th>
                  <th>Tanggal Lahir</th>
                  <th>Jenis Kelamin</th>
                  <th>Alamat</th>
                  <th>Keterangan</th>
                  {kolomIsian.map((kunci) => (
                    <th key={kunci}>{labelKolomIsian(kunci)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, indeks) => (
                  <tr key={row.id}>
                    <td>{indeks + 1}</td>
                    <td>{sasaranPenduduk ? (row.nomorKk ?? "—") : (row.nik ?? "—")}</td>
                    <td>{sasaranPenduduk ? (row.nik ?? "—") : (row.nomorKk ?? "—")}</td>
                    <td>{row.nama ?? "—"}</td>
                    <td>{row.tempatLahir ?? "—"}</td>
                    <td>{formatTanggal(row.tanggalLahir)}</td>
                    <td>
                      {row.gender === "male"
                        ? "Laki-laki"
                        : row.gender === "female"
                          ? "Perempuan"
                          : "—"}
                    </td>
                    <td>{row.alamat ?? "—"}</td>
                    <td>{row.keterangan?.trim() || "—"}</td>
                    {kolomIsian.map((kunci) => (
                      <td key={kunci}>{row.isian[kunci] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pemerintahan-cetak-ttd">
          <div>
            Mengetahui,
            <strong>
              {desa?.namaDesa ? `KEPALA DESA ${desa.namaDesa.toUpperCase()}` : "KEPALA DESA"}
            </strong>
            <div className="pemerintahan-cetak-ttd-space" />
            <strong>
              <u>{desa?.namaKepalaDesa ?? "(........................)"}</u>
            </strong>
            {desa?.nipKepalaDesa ? <span>NIP. {desa.nipKepalaDesa}</span> : null}
          </div>
          <div>
            {desa?.namaDesa ?? "Desa"}, {tanggalPanjang.format(new Date())}
            <strong>
              {desa?.namaDesa
                ? `SEKRETARIS DESA ${desa.namaDesa.toUpperCase()}`
                : "SEKRETARIS DESA"}
            </strong>
            <div className="pemerintahan-cetak-ttd-space" />
            <strong>
              <u>{namaSekretaris ?? "(........................)"}</u>
            </strong>
            {sekretaris?.nip ? (
              <span>NIP. {sekretaris.nip}</span>
            ) : sekretaris?.niap ? (
              <span>NIAP. {sekretaris.niap}</span>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
