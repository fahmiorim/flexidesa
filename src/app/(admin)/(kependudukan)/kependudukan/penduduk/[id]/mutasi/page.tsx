import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { getKonteksMutasiPenduduk } from "@/features/kependudukan/penduduk/application/riwayat-penduduk-use-cases";
import { LIFE_STATUS_LABELS } from "@/features/kependudukan/penduduk/domain/penduduk";
import { hitungUmur } from "@/features/kependudukan/penduduk/domain/umur";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { FormMutasiPenduduk } from "../form-mutasi";

export const metadata: Metadata = { title: "Mutasi Penduduk" };

export default async function MutasiPendudukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, konteks] = await Promise.all([verifySession(), getKonteksMutasiPenduduk(id)]);
  if (!user || !konteks) notFound();
  if (!hasPermission(user.permissions, "penduduk", "update")) notFound();
  if (konteks.penduduk.lifeStatus !== "alive") notFound();

  const { penduduk, opsi } = konteks;
  const kepalaKeluargaBanyak =
    konteks.konteks.kepalaKeluarga && konteks.konteks.jumlahAnggotaKk > 1;
  const umur = penduduk.birthDate ? hitungUmur(penduduk.birthDate) : null;

  return (
    <div className="modul-page data-kependudukan-page">
      <ButtonLink variant="secondary" href={`/kependudukan/penduduk/${id}`}>
        ← Kembali
      </ButtonLink>
      <PageHeading
        judul={<>{penduduk.name}</>}
        deskripsi={
          <>
            NIK {penduduk.nationalId} · Umur {umur ?? "-"} · Status saat ini{" "}
            {LIFE_STATUS_LABELS[penduduk.lifeStatus]}
          </>
        }
      />
      <section className="platform-card data-panel">
        <header>
          <h2>Ubah Status Dasar</h2>
          <p>Catat peristiwa mutasi; penduduk dan riwayat tersimpan dalam satu proses.</p>
        </header>
        <FormMutasiPenduduk
          kepalaKeluargaBanyak={kepalaKeluargaBanyak}
          opsi={opsi}
          residentId={id}
        />
      </section>
    </div>
  );
}
