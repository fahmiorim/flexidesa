import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahAnggotaKelompokAction } from "@/app/(admin)/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getKelompokMembers } from "@/features/kelompok/application/use-cases";
import { KELOMPOK_RESOURCE } from "@/features/kelompok/domain/kelompok";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../../../../kelompok.module.css";
import { FormAnggotaKelompok } from "../../../form-anggota";

export const metadata: Metadata = { title: "Ubah Anggota Kelompok" };

export default async function UbahAnggotaKelompokPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id: raw, memberId: rawMember } = await params;
  const id = Number(raw);
  const memberId = Number(rawMember);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(memberId) || memberId <= 0) {
    notFound();
  }

  const [user, members] = await Promise.all([verifySession(), getKelompokMembers(id)]);
  if (!hasPermission(user.permissions, KELOMPOK_RESOURCE, "update")) notFound();

  const member = members.find((item) => item.id === memberId) ?? null;
  if (!member) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href={`/kelompok/${id}`}>
        ← Kembali ke rincian kelompok
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Ubah Anggota</h1>
            <p>{member.name}</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Anggota</h2>
          <p>Perbarui jabatan, nomor anggota, nomor SK jabatan, dan keterangan.</p>
        </header>
        <FormAnggotaKelompok
          aksi={ubahAnggotaKelompokAction.bind(null, id, memberId)}
          awal={{
            residentId: member.residentId,
            jabatan: member.position,
            nomorAnggota: member.memberNumber ?? "",
            nomorSk: member.decreeNumber ?? "",
            keterangan: member.keterangan ?? "",
          }}
          kelompokId={id}
          penduduk={[{ id: member.residentId, label: member.name }]}
        />
      </section>
    </div>
  );
}
