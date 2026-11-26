import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import {
  getKelompokDetail,
  getKelompokMembers,
  getReferensiKelompok,
} from "@/features/kependudukan/kelompok/application/use-cases";
import {
  isKetuaKelompok,
  jabatanLabel,
  kelompokTipeLabel,
} from "@/features/kependudukan/kelompok/domain/kelompok";
import { RTM_GENDER_LABELS } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";

import styles from "../../kelompok.module.css";

export const metadata: Metadata = { title: "Cetak Anggota Kelompok" };

export default async function CetakAnggotaKelompokPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [detail, members, referensi, identitas] = await Promise.all([
    getKelompokDetail(id),
    getKelompokMembers(id),
    getReferensiKelompok(id),
    getIdentitas(),
  ]);
  const ketua = members.find((member) => isKetuaKelompok(member.position)) ?? null;
  const kategori = referensi.kategori.find((item) => item.id === detail.categoryId) ?? null;
  const tipeLabel = kelompokTipeLabel(detail.type);

  return (
    <div className={styles.printPage}>
      <div className={styles.printActions}>
        <Link className="button button-secondary" href={`/kependudukan/kelompok/${id}`}>
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
            <span>DAFTAR ANGGOTA</span>
            <strong>{tipeLabel.toUpperCase()}</strong>
          </div>
        </header>

        <table className={styles.printInfo}>
          <tbody>
            <tr>
              <th>Kode {tipeLabel}</th>
              <td>{detail.code ?? "—"}</td>
              <th>Ketua {tipeLabel}</th>
              <td>{ketua?.name ?? "Belum ditentukan"}</td>
            </tr>
            <tr>
              <th>Nama {tipeLabel}</th>
              <td>{detail.name}</td>
              <th>Kategori {tipeLabel}</th>
              <td>{kategori?.label ?? "—"}</td>
            </tr>
            <tr>
              <th>No. SK Pendirian</th>
              <td colSpan={3}>{detail.decreeNumber ?? "—"}</td>
            </tr>
          </tbody>
        </table>

        <table className={styles.printMembers}>
          <thead>
            <tr>
              <th>No.</th>
              <th>No. Anggota</th>
              <th>NIK</th>
              <th>Nama</th>
              <th>Jenis Kelamin</th>
              <th>Jabatan</th>
              <th>Nomor SK Jabatan</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={7}>Belum ada anggota.</td>
              </tr>
            ) : (
              members.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
                  <td>{member.memberNumber ?? "—"}</td>
                  <td>{member.nationalId ?? "—"}</td>
                  <td>{member.name}</td>
                  <td>{RTM_GENDER_LABELS[member.gender]}</td>
                  <td>{jabatanLabel(member.position)}</td>
                  <td>{member.decreeNumber ?? "—"}</td>
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
