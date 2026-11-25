import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahRumahTanggaAction } from "@/app/(admin)/rumah-tangga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { hasPermission } from "@/features/rbac/application/authorization";
import {
  getRumahTanggaDetail,
  getRumahTanggaReference,
} from "@/features/rumah-tangga/application/use-cases";
import { RUMAH_TANGGA_RESOURCE } from "@/features/rumah-tangga/domain/rumah-tangga";
import { verifySession } from "@/lib/dal";

import { FormRumahTangga } from "../../form-rumah-tangga";
import styles from "../../rumah-tangga.module.css";

export const metadata: Metadata = { title: "Ubah Rumah Tangga" };

export default async function UbahRumahTanggaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, detail, reference] = await Promise.all([
    verifySession(),
    getRumahTanggaDetail(id),
    getRumahTanggaReference(),
  ]);
  if (!hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "update")) notFound();

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href={`/rumah-tangga/${id}`}>
        ← Kembali ke detail rumah tangga
      </Link>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Ubah Rumah Tangga</h1>
            <p>Nomor RTM {detail.rumahTangga.number}</p>
          </div>
        </header>
      </PageHeading>
      <section className="platform-card data-panel">
        <header>
          <h2>Data Rumah Tangga</h2>
          <p>Perbarui alamat, wilayah, kelas sosial, dan BDT.</p>
        </header>
        <FormRumahTangga
          aksi={ubahRumahTanggaAction.bind(null, id)}
          awal={{
            alamat: detail.rumahTangga.address ?? "",
            regionId: detail.rumahTangga.regionId,
            kelasSosial: detail.rumahTangga.kelasSosial,
            bdt: detail.rumahTangga.bdt ?? "",
          }}
          kembaliHref={`/rumah-tangga/${id}`}
          penduduk={reference.penduduk}
          regions={reference.regions}
          terdaftarDtks={detail.hasDtks}
        />
      </section>
    </div>
  );
}
