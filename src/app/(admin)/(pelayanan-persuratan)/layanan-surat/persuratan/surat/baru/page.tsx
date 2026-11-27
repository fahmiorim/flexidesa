import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { getSuratFormOptions } from "@/features/pelayanan-persuratan/surat/application/daftar-surat";
import { parseIsianFields } from "@/features/pelayanan-persuratan/surat/domain/isian";
import { todayIsoDate } from "@/lib/forms";

import { buatKonsepSuratAction } from "../actions";
import { SuratForm } from "../surat-form";

export const metadata: Metadata = { title: "Buat Surat" };

type SearchParams = Promise<{ error?: string; jenis?: string }>;

export default async function BuatSuratPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ jenis, penduduk, fieldPendudukLuar }, query] = await Promise.all([
    getSuratFormOptions(),
    searchParams,
  ]);
  const options = jenis.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    requiresResident: item.requiresResident,
    fields: parseIsianFields(item.formIsian),
  }));
  // `?jenis=` dipakai katalog Cetak Surat agar jenis surat yang dipilih langsung aktif.
  const jenisAwal = Number(query.jenis);
  const jenisDefaultId = options.some((item) => item.id === jenisAwal) ? jenisAwal : undefined;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Buat Surat Baru</>}
        deskripsi={<>Buat konsep surat berdasarkan jenis layanan dan data penduduk desa.</>}
      />

      {query.error ? (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {query.error}
        </div>
      ) : null}

      {options.length === 0 ? (
        <section className="modul-card" style={{ padding: 24 }}>
          <h2 className="beranda-card-title">Belum ada jenis surat aktif</h2>
          <p className="modul-muted">
            Aktifkan atau buat jenis surat terlebih dahulu sebelum membuat surat baru.
          </p>
          <ButtonLink variant="secondary" href="/layanan-surat/persuratan/surat">
            Kembali ke Administrasi Surat
          </ButtonLink>
        </section>
      ) : (
        <SuratForm
          jenis={options}
          penduduk={penduduk}
          tanggalDefault={todayIsoDate()}
          jenisDefaultId={jenisDefaultId}
          action={buatKonsepSuratAction}
          fieldPendudukLuar={fieldPendudukLuar}
        />
      )}
    </div>
  );
}
