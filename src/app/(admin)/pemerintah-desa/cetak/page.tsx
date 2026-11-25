import Link from "next/link";

import { JudulCetak, KopCetak, TandaTanganCetak } from "@/components/ui/cetak-dokumen";
import { TombolCetak } from "@/components/ui/tombol-cetak";
import {
  getKopCetakData,
  getPerangkatDesaData,
} from "@/features/pemerintahan/application/use-cases";
import { isJenisJabatan, LABEL_JENIS_JABATAN } from "@/features/pemerintahan/domain/aparat-desa";

export const metadata = { title: "Buku Pemerintah Desa" };

function labelJenis(jenis: string | null) {
  return jenis && isJenisJabatan(jenis) ? LABEL_JENIS_JABATAN[jenis] : "Jabatan lain";
}

export default async function CetakPemerintahDesaPage() {
  const [{ rows }, { desa, sekretaris }] = await Promise.all([
    getPerangkatDesaData(),
    getKopCetakData(),
  ]);
  const aktif = rows.filter((row) => row.status === "aktif");

  return (
    <div className="modul-page pemerintahan-page pemerintahan-cetak">
      <header className="page-heading pemerintahan-cetak-toolbar">
        <div>
          <span className="eyebrow">PEMERINTAH DESA</span>
          <h1>Buku Pemerintah Desa</h1>
          <p>Daftar aparat pemerintah desa untuk dicetak.</p>
        </div>
        <div className="page-heading-actions">
          <Link className="button button-ghost" href="/pemerintah-desa">
            Kembali
          </Link>
          <Link className="button button-ghost" href="/pemerintah-desa/cetak/ekspor-xlsx">
            Unduh XLSX
          </Link>
          <Link className="button button-ghost" href="/pemerintah-desa/cetak/ekspor-pdf">
            Unduh PDF
          </Link>
          <TombolCetak />
        </div>
      </header>
      <section className="modul-card">
        <KopCetak desa={desa} logo={desa?.logo} />
        <JudulCetak>DAFTAR APARAT PEMERINTAH DESA</JudulCetak>
        <p className="pemerintahan-cetak-meta">
          {aktif.length} aparat aktif dari {rows.length} data.
        </p>
        <div className="modul-table-wrap">
          <table className="modul-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Jabatan</th>
                <th>Jenis Kelamin</th>
                <th>Tempat & Tanggal Lahir</th>
                <th>Pendidikan</th>
                <th>Agama</th>
                <th>Pangkat</th>
                <th>SK Pengangkatan</th>
                <th>Masa Jabatan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>
                    {[row.gelarDepan, row.nama, row.gelarBelakang].filter(Boolean).join(" ")}
                    {row.nip ? <small>NIP {row.nip}</small> : null}
                  </td>
                  <td>
                    {row.jabatan ?? "—"}
                    <small>{labelJenis(row.jenisJabatan)}</small>
                  </td>
                  <td>
                    {row.jenisKelamin === "male"
                      ? "Laki-laki"
                      : row.jenisKelamin === "female"
                        ? "Perempuan"
                        : "—"}
                  </td>
                  <td>{[row.tempatLahir, row.tanggalLahir].filter(Boolean).join(", ") || "—"}</td>
                  <td>{row.pendidikan ?? "—"}</td>
                  <td>{row.agama ?? "—"}</td>
                  <td>{row.pangkat ?? "—"}</td>
                  <td>
                    {row.nomorSkPengangkatan ?? "—"}
                    {row.tanggalPengangkatan ? <small>{row.tanggalPengangkatan}</small> : null}
                  </td>
                  <td>{row.periode ?? "—"}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TandaTanganCetak desa={desa} sekretaris={sekretaris} />
      </section>
    </div>
  );
}
