import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahTerdataAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  getFormTerdataData,
  getReferensiIsianSuplemenData,
  labelSasaranSuplemen,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { FormTerdataSuplemen } from "@/features/kependudukan/penduduk/presentation/form-terdata-suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Ubah Data Terdata Suplemen" };

export default async function UbahTerdataPage({
  params,
}: {
  params: Promise<{ id: string; terdataId: string }>;
}) {
  const { id: mentah, terdataId: terdataMentah } = await params;
  const id = Number(mentah);
  const terdataId = Number(terdataMentah);
  if (!Number.isInteger(id) || id <= 0) notFound();
  if (!Number.isInteger(terdataId) || terdataId <= 0) notFound();

  const [user, referensi] = await Promise.all([verifySession(), getReferensiIsianSuplemenData()]);
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update")) notFound();

  const data = await getFormTerdataData(id, { terdataId });
  if (!data) notFound();

  const { suplemen, terdata } = data;
  if (!terdata) notFound();

  const sasaranId = terdata.pendudukId ?? terdata.keluargaId;
  if (sasaranId === null) {
    return (
      <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
        <PageHeading judul={<>Ubah Data Terdata</>} deskripsi={<>{suplemen.nama}</>} />
        <p className="alert alert-error" role="alert">
          Data menunjuk penduduk/keluarga di luar desa aktif; hapus lalu tambah ulang.
        </p>
        <p className="suplemen-kembali">
          <Link href={`/kependudukan/penduduk/suplemen/${id}`}>← Daftar Terdata</Link>
        </p>
      </div>
    );
  }

  const detail = await getFormTerdataData(id, { sasaranId });
  const sasaranDetail =
    detail?.sasaranDetail ??
    (terdata
      ? {
          sasaran: suplemen.sasaran,
          nomorKk: terdata.nomorKk,
          nik: terdata.nik,
          nama: terdata.nama,
          tempatLahir: terdata.tempatLahir,
          tanggalLahir: terdata.tanggalLahir,
          alamat: terdata.alamat,
          pendidikan: null,
          warganegara: null,
          agama: null,
        }
      : null);

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading
        judul={<>Ubah Data Terdata</>}
        deskripsi={
          <>
            {suplemen.nama} · sasaran {labelSasaranSuplemen(suplemen.sasaran)}
          </>
        }
      />

      <p className="suplemen-kembali">
        <Link href={`/kependudukan/penduduk/suplemen/${id}`}>← Daftar Terdata</Link>
      </p>

      <section className="platform-card data-panel">
        <header>
          <h2>Isian Terdata</h2>
          <p>Identitas sasaran tidak dapat diubah; perbarui kolom tambahan dan keterangan.</p>
        </header>
        <FormTerdataSuplemen
          aksi={ubahTerdataAction}
          fields={suplemen.formIsian}
          isianAwal={terdata.isian}
          keteranganAwal={terdata.keterangan ?? ""}
          kembaliHref={`/kependudukan/penduduk/suplemen/${id}`}
          referensi={referensi}
          sasaran={suplemen.sasaran}
          sasaranDetail={sasaranDetail}
          sasaranId={sasaranId}
          suplemenId={id}
          terdataId={terdataId}
        />
      </section>
    </div>
  );
}
