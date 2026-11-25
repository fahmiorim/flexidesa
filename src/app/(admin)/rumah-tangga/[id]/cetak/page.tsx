import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getIdentitas } from "@/features/desa/application/get-identitas";
import { getRumahTanggaDetail } from "@/features/rumah-tangga/application/use-cases";
import { rtmLevelLabel } from "@/features/rumah-tangga/domain/rumah-tangga";

import styles from "../../rumah-tangga.module.css";

export const metadata: Metadata = { title: "Cetak Kartu Rumah Tangga" };

function labelKelas(value: number | null): string {
  return value === null ? "Belum ditetapkan" : `Kelas ${value}`;
}

export default async function CetakKartuRumahTanggaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [detail, identitas] = await Promise.all([getRumahTanggaDetail(id), getIdentitas()]);
  const kepala = detail.members.find((member) => member.level === 1) ?? null;

  return (
    <div className={styles.printPage}>
      <div className={styles.printActions}>
        <Link className="button button-secondary" href={`/rumah-tangga/${id}`}>
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
            <span>KARTU</span>
            <strong>RUMAH TANGGA</strong>
          </div>
        </header>

        <div className={styles.printNumber}>
          <span>Nomor Rumah Tangga</span>
          <strong>{detail.rumahTangga.number}</strong>
        </div>

        <table className={styles.printInfo}>
          <tbody>
            <tr>
              <th>Kepala Rumah Tangga</th>
              <td>{kepala?.name ?? "Belum ditentukan"}</td>
              <th>Jumlah Anggota</th>
              <td>{detail.members.length} orang</td>
            </tr>
            <tr>
              <th>Alamat</th>
              <td colSpan={3}>{detail.rumahTangga.address ?? "—"}</td>
            </tr>
            <tr>
              <th>Wilayah</th>
              <td>{detail.regionLabel ?? "—"}</td>
              <th>Kelas Sosial</th>
              <td>{labelKelas(detail.rumahTangga.kelasSosial)}</td>
            </tr>
            <tr>
              <th>BDT</th>
              <td>{detail.rumahTangga.bdt ?? "—"}</td>
              <th>DTKS</th>
              <td>{detail.hasDtks ? "Terdaftar" : "Belum terdaftar"}</td>
            </tr>
          </tbody>
        </table>

        <table className={styles.printMembers}>
          <thead>
            <tr>
              <th>No.</th>
              <th>NIK</th>
              <th>Nama</th>
              <th>Tingkat Hubungan</th>
            </tr>
          </thead>
          <tbody>
            {detail.members.length === 0 ? (
              <tr>
                <td colSpan={4}>Belum ada anggota rumah tangga.</td>
              </tr>
            ) : (
              detail.members.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
                  <td>{member.nationalId ?? "—"}</td>
                  <td>{member.name}</td>
                  <td>{rtmLevelLabel(member.level)}</td>
                </tr>
              ))
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
