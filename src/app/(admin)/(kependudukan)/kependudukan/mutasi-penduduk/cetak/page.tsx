import type { Metadata } from "next";
import Link from "next/link";

import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import { listRiwayat } from "@/features/kependudukan/penduduk/application/riwayat-penduduk-use-cases";
import { GENDER_LABELS } from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  labelDetailMeta,
  MUTATION_TYPE_LABELS,
  normalisasiMutationType,
  type MutasiDetailMeta,
} from "@/features/kependudukan/penduduk/domain/riwayat-penduduk";

import styles from "../mutasi.module.css";

export const metadata: Metadata = { title: "Cetak Mutasi Penduduk" };

function angka(value: string | null, min: number, max: number): number | null {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

export default async function CetakMutasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const str = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : null);
  const gender = str("gender");
  const result = await listRiwayat({
    q: str("q") ?? "",
    type: normalisasiMutationType(str("type")),
    year: angka(str("year"), 1900, 2999),
    month: angka(str("month"), 1, 12),
    gender: gender === "male" || gender === "female" ? gender : null,
    religionId: angka(str("religionId"), 1, Number.MAX_SAFE_INTEGER),
    regionId: angka(str("regionId"), 1, Number.MAX_SAFE_INTEGER),
    page: 1,
    perPage: 100,
  });
  const identitas = await getIdentitas();
  const date = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className={styles.printPage}>
      <div className={styles.printActions}>
        <Link className="button button-secondary" href="/kependudukan/mutasi-penduduk">
          ← Kembali
        </Link>
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
            <span>DAFTAR MUTASI</span>
            <strong>PENDUDUK</strong>
          </div>
        </header>

        <table className={styles.printMembers}>
          <thead>
            <tr>
              <th>No.</th>
              <th>NIK</th>
              <th>Nama</th>
              <th>Jenis Kelamin</th>
              <th>Peristiwa</th>
              <th>Tgl Peristiwa</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={7}>Belum ada data mutasi.</td>
              </tr>
            ) : (
              result.rows.map((row, index) => {
                const meta = (row.meta ?? {}) as MutasiDetailMeta;
                const catatan = [row.notes, ...labelDetailMeta(meta), row.reason, row.referenceNo]
                  .filter((v) => typeof v === "string" && v.trim())
                  .join(" · ");
                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.residentNationalId ?? "—"}</td>
                    <td>{row.residentName ?? "—"}</td>
                    <td>{row.gender ? GENDER_LABELS[row.gender] : "—"}</td>
                    <td>{MUTATION_TYPE_LABELS[row.type]}</td>
                    <td>{date.format(new Date(`${row.eventDate}T00:00:00`))}</td>
                    <td>{catatan || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <footer className={styles.printFoot}>
          <span>Dicetak dari Sistem Informasi Desa</span>
          <span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}</span>
        </footer>
      </article>
    </div>
  );
}
