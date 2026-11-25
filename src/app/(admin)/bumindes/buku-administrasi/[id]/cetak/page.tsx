import Link from "next/link";
import { notFound } from "next/navigation";

import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getBukuCetakData } from "@/features/bumindes/application/use-cases";
import {
  formatTanggalIndonesia,
  kopDesaAlamat,
  kopDesaLines,
} from "@/features/bumindes/domain/buku-resmi";
import { todayIsoDate } from "@/lib/forms";

import styles from "../../bumindes.module.css";

export const metadata = { title: "Cetak Buku Administrasi" };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CetakBukuAdministrasiPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const data = await getBukuCetakData(id);
  if (!data) notFound();

  const { buku, desa, tabel } = data;
  const kop = desa ? kopDesaLines(desa) : ["PEMERINTAH DESA"];
  const alamat = desa ? kopDesaAlamat(desa) : "";
  const tanggalCetak = formatTanggalIndonesia(todayIsoDate());
  const kolomTanggal = tabel.kolom.findIndex((kolom) => kolom.toLowerCase().includes("tanggal"));

  return (
    <main className={`${styles.printPage} bumindes-cetak`}>
      <div className={styles.printToolbar}>
        <div>
          <Link className={styles.ghost} href={`/bumindes/buku-administrasi/${buku.id}`}>
            ← Kembali ke buku
          </Link>
          <p>Gunakan dialog cetak untuk mencetak atau menyimpan sebagai PDF.</p>
        </div>
        <div className={styles.printToolbar}>
          <a
            className={styles.secondary}
            href={`/bumindes/buku-administrasi/${buku.id}/ekspor`}
            download
          >
            Unduh CSV
          </a>
          <TombolCetak />
        </div>
      </div>

      <header className={styles.kop}>
        {kop.map((baris) => (
          <div className={styles.kopLine} key={baris}>
            {baris}
          </div>
        ))}
        {alamat ? <div className={styles.kopAlamat}>{alamat}</div> : null}
      </header>

      <h2 className={styles.bookTitle}>{tabel.namaBuku}</h2>
      <p className={styles.printMeta}>
        Kode buku: <strong>{tabel.kodeBuku}</strong> · Jumlah catatan:{" "}
        <strong>{tabel.baris.length}</strong>
      </p>

      <table className={styles.printTable}>
        <thead>
          <tr>
            {tabel.kolom.map((kolom) => (
              <th key={kolom}>{kolom}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabel.baris.length === 0 ? (
            <tr>
              <td className={styles.printEmpty} colSpan={tabel.kolom.length}>
                Belum ada catatan pada buku ini.
              </td>
            </tr>
          ) : (
            tabel.baris.map((baris, indeks) => (
              <tr key={indeks}>
                {baris.map((sel, kolom) => {
                  const nilai = sel === null || sel === undefined ? "" : String(sel);
                  return (
                    <td
                      className={
                        kolom === 0
                          ? styles.number
                          : kolom === kolomTanggal
                            ? styles.tanggal
                            : undefined
                      }
                      key={kolom}
                    >
                      {kolom === kolomTanggal && nilai ? formatTanggalIndonesia(nilai) : nilai}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.signature}>
        <div>
          Mengetahui,
          <strong>KEPALA DESA</strong>
          <div className={styles.signatureSpace} />
          <strong>{desa?.namaKepalaDesa ?? "(........................)"}</strong>
        </div>
        <div>
          {desa?.namaDesa ?? "Desa"}, {tanggalCetak}
          <strong>SEKRETARIS DESA</strong>
          <div className={styles.signatureSpace} />
          <strong>(........................)</strong>
        </div>
      </div>
    </main>
  );
}
