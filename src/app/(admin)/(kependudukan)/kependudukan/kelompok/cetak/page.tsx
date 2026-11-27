import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import { getLaporanAnggota } from "@/features/kependudukan/kelompok/application/use-cases";
import { jabatanLabel, kelompokTipeLabel } from "@/features/kependudukan/kelompok/domain/kelompok";
import {
  judulLaporanAnggota,
  kelompokkanAnggota,
} from "@/features/kependudukan/kelompok/domain/laporan-anggota";

import styles from "../kelompok.module.css";

export const metadata: Metadata = { title: "Cetak Laporan Anggota Kelompok" };

export default async function CetakKelompokPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tipeParam = typeof params.tipe === "string" ? params.tipe : "";
  const tipe = tipeParam === "kelompok" ? tipeParam : "";

  const [rows, identitas] = await Promise.all([getLaporanAnggota(tipe), getIdentitas()]);
  const kelompokList = kelompokkanAnggota(rows);

  return (
    <div className={styles.printPage}>
      <div className={styles.printActions}>
        <ButtonLink variant="secondary" href="/kependudukan/kelompok">
          ← Kembali
        </ButtonLink>
        <TombolCetak />
      </div>

      <article className={styles.printCard}>
        <header className={styles.printHead}>
          <div>
            <strong>{identitas?.namaDesa ?? "Pemerintah Desa"}</strong>
            <span>{identitas?.namaKecamatan ?? "Kecamatan"}</span>
            <span>{identitas?.namaKabupaten ?? "Kabupaten/Kota"}</span>
          </div>
          <div>
            <span>LAPORAN</span>
            <strong>{judulLaporanAnggota(tipe).toUpperCase()}</strong>
          </div>
        </header>

        {kelompokList.length === 0 ? (
          <p>Belum ada data anggota kelompok.</p>
        ) : (
          kelompokList.map((kelompok) => (
            <section key={kelompok.kelompokId}>
              <h3>
                {kelompok.kelompokNama} ({kelompokTipeLabel(kelompok.kelompokTipe)})
                {kelompok.kategoriNama ? ` — ${kelompok.kategoriNama}` : ""}
              </h3>
              <table className={styles.printMembers}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Jabatan</th>
                    <th>No. Anggota</th>
                    <th>No. SK</th>
                  </tr>
                </thead>
                <tbody>
                  {kelompok.anggota.map((anggota, index) => (
                    <tr key={`${kelompok.kelompokId}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{anggota.nationalId ?? "—"}</td>
                      <td>{anggota.nama}</td>
                      <td>{jabatanLabel(anggota.position)}</td>
                      <td>{anggota.memberNumber ?? "—"}</td>
                      <td>{anggota.decreeNumber ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}

        <footer className={styles.printFoot}>
          <span>Dicetak dari Sistem Informasi Desa</span>
          <span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}</span>
        </footer>
      </article>
    </div>
  );
}
