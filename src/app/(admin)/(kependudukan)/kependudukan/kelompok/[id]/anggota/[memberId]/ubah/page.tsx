import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ubahAnggotaKelompokAction } from "@/app/(admin)/(kependudukan)/kependudukan/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getKelompokMembers } from "@/features/kependudukan/kelompok/application/use-cases";
import { KELOMPOK_RESOURCE } from "@/features/kependudukan/kelompok/domain/kelompok";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

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
      <PageHeading judul={<>Ubah Anggota</>} deskripsi={<>{member.name}</>} />
      <section className="platform-card data-panel">
        <header>
          <h2>Data Anggota</h2>
          <p>Jabatan, nomor anggota, SK jabatan, keterangan.</p>
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
          labelKembali="← Kembali ke rincian kelompok"
          penduduk={[{ id: member.residentId, label: member.name }]}
        />
      </section>
    </div>
  );
}
