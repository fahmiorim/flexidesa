import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getSuratPrintData } from "@/features/pelayanan-persuratan/surat/application/cetak";
import { getSuratFormOptions } from "@/features/pelayanan-persuratan/surat/application/daftar-surat";
import {
  parseIsianFields,
  parseNilaiIsian,
} from "@/features/pelayanan-persuratan/surat/domain/isian";
import {
  parsePendudukLuar,
  parsePengikutIds,
} from "@/features/pelayanan-persuratan/surat/domain/pengikut";
import { todayIsoDate } from "@/lib/forms";

import { perbaruiKonsepSuratAction } from "../../actions";
import { SuratForm } from "../../surat-form";

export const metadata: Metadata = { title: "Ubah Konsep Surat" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function UbahKonsepSuratPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const [data, options] = await Promise.all([getSuratPrintData(id), getSuratFormOptions()]);
  if (data.surat.status !== "draft") notFound();

  const jenis = options.jenis.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    requiresResident: item.requiresResident,
    fields: parseIsianFields(item.formIsian),
  }));
  const isiSurat = parseNilaiIsian(data.surat.nilaiIsian);

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Ubah Konsep Surat</>}
        deskripsi={<>Perbarui data surat sebelum diajukan ke proses verifikasi.</>}
      />
      {query.error ? (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {query.error}
        </div>
      ) : null}
      <SuratForm
        jenis={jenis}
        penduduk={options.penduduk}
        tanggalDefault={todayIsoDate()}
        initial={{
          id,
          typeId: data.surat.typeId,
          residentId: data.surat.residentId,
          letterDate: data.surat.letterDate,
          purpose: data.surat.purpose,
          isiSurat,
          pengikut: parsePengikutIds(isiSurat.__pengikut),
          luar: parsePendudukLuar(isiSurat.__luar),
        }}
        action={perbaruiKonsepSuratAction}
        fieldPendudukLuar={options.fieldPendudukLuar}
      />
    </div>
  );
}
