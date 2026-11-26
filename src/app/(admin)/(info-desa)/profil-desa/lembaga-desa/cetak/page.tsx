import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { JudulCetak, KopCetak, TandaTanganCetak } from "@/components/ui/cetak-dokumen";
import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getLembagaCetakData } from "@/features/info-desa/pemerintahan/application/lembaga";

import styles from "./lembaga-cetak.module.css";

export const metadata = { title: "Cetak Data Lembaga" };

const KOLOM = 7;

/** Ikon garis sederhana untuk bilah aksi (tanpa pustaka ikon tambahan). */
function Ikon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
    >
      {children}
    </svg>
  );
}

export default async function CetakLembagaDesaPage() {
  const { rows, master, ketua, desa, sekretaris } = await getLembagaCetakData();
  const namaKategori = (masterId: number | null) =>
    master.find((item) => item.id === masterId)?.nama ?? "—";
  const namaKetua = (lembagaId: number) =>
    ketua.find((item) => item.lembagaId === lembagaId)?.nama ?? "—";

  return (
    <div className={`modul-page pemerintahan-page pemerintahan-cetak ${styles.page}`}>
      <PageHeading
        atasJudul={
          <>
            <span className="eyebrow">PEMERINTAHAN DESA</span>
          </>
        }
        judul={<>Cetak Data Lembaga</>}
        deskripsi={<>Daftar lembaga desa beserta blok penandatangan.</>}
        kelas="page-heading pemerintahan-cetak-toolbar"
        aksi={
          <>
            <div className={styles.actions}>
              <Link className="button button-secondary" href="/profil-desa/lembaga-desa">
                <Ikon>
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </Ikon>
                Kembali
              </Link>
              <Link
                className="button button-secondary"
                href="/profil-desa/lembaga-desa/cetak/ekspor-xlsx"
              >
                <Ikon>
                  <path d="M14 3v5h5" />
                  <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z" />
                  <path d="m9 13 6 5m0-5-6 5" />
                </Ikon>
                Unduh XLSX
              </Link>
              <Link
                className="button button-secondary"
                href="/profil-desa/lembaga-desa/cetak/ekspor-pdf"
              >
                <Ikon>
                  <path d="M14 3v5h5" />
                  <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z" />
                  <path d="M9 15h6M9 11h3" />
                </Ikon>
                Unduh PDF
              </Link>
              <TombolCetak />
            </div>
          </>
        }
      />

      <article className={styles.sheet}>
        <KopCetak desa={desa} logo={desa?.logo} />
        <JudulCetak>Data Lembaga Desa</JudulCetak>
        <p className={styles.meta}>
          {rows.length} lembaga terdata
          {desa?.namaDesa ? ` di Desa ${desa.namaDesa}` : ""}.
        </p>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.nomor}>No</th>
              <th>Nama Lembaga</th>
              <th>Kode</th>
              <th>Kategori</th>
              <th>Ketua</th>
              <th>Masa Bakti</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.id}>
                  <td className={styles.nomor}>{index + 1}</td>
                  <td>{row.nama}</td>
                  <td>{row.kode ?? "—"}</td>
                  <td>{namaKategori(row.masterId)}</td>
                  <td>{namaKetua(row.id)}</td>
                  <td className={styles.masaBakti}>
                    {row.masaBaktiMulai ?? "—"} – {row.masaBaktiSelesai ?? "—"}
                  </td>
                  <td>{row.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.kosong} colSpan={KOLOM}>
                  Belum ada data lembaga untuk dicetak.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <TandaTanganCetak desa={desa} sekretaris={sekretaris} />
      </article>
    </div>
  );
}
