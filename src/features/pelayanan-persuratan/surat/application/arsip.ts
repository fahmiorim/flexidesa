import "server-only";

/**
 * Use case arsip nomor surat.
 *
 * Daftar dan ekspor arsip nomor surat.
 */

import { getIdentitasDesa } from "@/features/info-desa/desa/application/kontrak";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  ARSIP_MAKS_EKSPOR,
  buildArsipNomorCsv,
  namaBerkasArsipNomor,
} from "@/features/pelayanan-persuratan/surat/domain/arsip-nomor";
import { SURAT_RESOURCE } from "@/features/pelayanan-persuratan/surat/domain/surat";
import {
  listJenisSurat,
  listKlasifikasi,
} from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";
import { listLetterNumberArchive } from "@/features/pelayanan-persuratan/surat/infrastructure/surat-repository";
import { requirePermission } from "@/lib/dal";

interface ArsipNomorFilter {
  search: string;
  year?: number;
  typeId?: number;
  classificationId?: number;
  page?: number;
}

function bersihkanFilterArsip(params: ArsipNomorFilter): {
  q: string;
  year?: number;
  typeId?: number;
  classificationId?: number;
  page: number;
} {
  const idPositif = (value: number | undefined) =>
    value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined;

  return {
    q: params.search.trim().slice(0, 100),
    year:
      params.year !== undefined &&
      Number.isInteger(params.year) &&
      params.year >= 1900 &&
      params.year <= 9999
        ? params.year
        : undefined,
    typeId: idPositif(params.typeId),
    classificationId: idPositif(params.classificationId),
    page:
      params.page !== undefined && Number.isInteger(params.page) && params.page > 0
        ? params.page
        : 1,
  };
}

export async function listArsipNomorSuratData(params: ArsipNomorFilter) {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const filter = bersihkanFilterArsip(params);

  const [result, jenis, klasifikasi] = await Promise.all([
    listLetterNumberArchive(villageId, filter),
    listJenisSurat(villageId),
    listKlasifikasi(villageId),
  ]);

  return { ...result, jenis, klasifikasi };
}

/** Data ekspor CSV arsip nomor (mengikuti filter yang aktif). */

export async function eksporArsipNomorSuratData(params: ArsipNomorFilter) {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const filter = bersihkanFilterArsip(params);

  const [result, desa, jenis, klasifikasi] = await Promise.all([
    listLetterNumberArchive(villageId, { ...filter, page: 1, pageSize: ARSIP_MAKS_EKSPOR }),
    getIdentitasDesa(villageId),
    listJenisSurat(villageId),
    listKlasifikasi(villageId),
  ]);

  const labelFilter = [
    filter.year !== undefined ? `Tahun ${filter.year}` : null,
    filter.typeId !== undefined
      ? `Jenis ${jenis.find((item) => item.id === filter.typeId)?.name ?? filter.typeId}`
      : null,
    filter.classificationId !== undefined
      ? `Klasifikasi ${
          klasifikasi.find((item) => item.id === filter.classificationId)?.code ??
          filter.classificationId
        }`
      : null,
  ]
    .filter((item): item is string => item !== null)
    .join(" · ");

  return {
    csv: buildArsipNomorCsv({
      namaDesa: desa?.namaDesa ?? null,
      rows: result.rows,
      filter: labelFilter,
    }),
    filename: namaBerkasArsipNomor(desa?.namaDesa ?? null),
  };
}
