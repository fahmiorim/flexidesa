import "server-only";

/**
 * Use case daftar, draft, dan penghapusan surat.
 *
 * Daftar surat dengan meta, riwayat, opsi form, serta buat/ubah/hapus draft.
 */

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { listPendudukOptions } from "@/features/kependudukan/penduduk/application/kontrak";
import { serializeNilaiIsian } from "@/features/pelayanan-persuratan/surat/domain/isian";
import {
  SURAT_MAKS_PER_HALAMAN,
  SURAT_PER_HALAMAN,
  SURAT_RESOURCE,
  type LetterStatus,
  type SuratInput,
} from "@/features/pelayanan-persuratan/surat/domain/surat";
import {
  listJenisSurat,
  listSyaratSurat,
} from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";
import {
  createSuratDraft,
  deleteSurat,
  getSurat,
  listSurat,
  recapSuratByStatus,
  updateSuratDraft,
} from "@/features/pelayanan-persuratan/surat/infrastructure/surat-repository";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { listAuditLogs } from "@/features/pengaturan/audit/application/kontrak";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { bacaPengaturan } from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound } from "@/lib/errors";

import { denganPengikut, ensureResident, loadJenis, resolveIsianValues } from "./bersama";

export async function listSuratWithMeta(params: {
  search: string;
  status: LetterStatus | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const page = params.page && params.page > 0 ? Math.trunc(params.page) : 1;
  const pageSize = Math.min(
    SURAT_MAKS_PER_HALAMAN,
    Math.max(1, Math.trunc(params.pageSize ?? SURAT_PER_HALAMAN)),
  );

  const [result, jenis, penduduk, recap, syarat] = await Promise.all([
    listSurat({ villageId, search: params.search, status: params.status, page, pageSize }),
    listJenisSurat(villageId),
    listPendudukOptions(villageId),
    recapSuratByStatus(villageId),
    listSyaratSurat(villageId),
  ]);

  return { ...result, jenis: jenis.filter((item) => item.isActive), penduduk, recap, syarat };
}

/** Riwayat aktivitas satu surat, dibatasi tenant dan izin baca surat. */

export async function getRiwayatSuratData(id: number) {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");
  const history = await listAuditLogs(villageId, {
    page: 1,
    pageSize: 50,
    resource: SURAT_RESOURCE,
    resourceId: String(id),
  });
  return history.rows;
}

export async function getSuratFormOptions() {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const [jenis, penduduk, pengaturan] = await Promise.all([
    listJenisSurat(villageId),
    listPendudukOptions(villageId),
    bacaPengaturan(villageId),
  ]);

  return {
    jenis: jenis.filter((item) => item.isActive),
    penduduk,
    // Isian penduduk luar mengikuti pilihan pada Pengaturan Surat.
    fieldPendudukLuar: pengaturan.suratPendudukLuarField,
  };
}

/**
 * Hitung nilai isian dari formulir dan periksa isian wajib.
 *
 * Nilai disimpan sebagai JSON map `kode isian → nilai`; isian yang tidak
 * diisi tidak ikut disimpan agar surat tetap ringkas.
 */

export async function createSuratDraftData(input: SuratInput): Promise<{ id: number }> {
  const user = await requirePermission(SURAT_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const jenis = await loadJenis(villageId, input.typeId);
  await ensureResident(villageId, jenis, input.residentId);

  const { values } = resolveIsianValues(jenis, input.isiSurat);

  const letterDate = input.letterDate ?? "-";
  const year = Number(letterDate.slice(0, 4));
  const id = await createSuratDraft({
    villageId,
    typeId: jenis.id,
    residentId: input.residentId,
    letterDate: input.letterDate,
    year,
    purpose: input.purpose,
    typeName: jenis.name,
    nilaiIsian: serializeNilaiIsian(denganPengikut(values, input.pengikut ?? [], input.luar ?? [])),
    createdBy: user.id,
  });

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.suratCreate,
    resource: SURAT_RESOURCE,
    resourceId: String(id),
    details: { typeId: jenis.id },
  });
  return { id };
}

export async function updateSuratDraftData(id: number, input: SuratInput): Promise<void> {
  const user = await requirePermission(SURAT_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");
  if (surat.status !== "draft") throw conflict("Hanya konsep surat yang dapat diubah.");

  const jenis = await loadJenis(villageId, input.typeId);
  await ensureResident(villageId, jenis, input.residentId);

  const { values } = resolveIsianValues(jenis, input.isiSurat);

  const letterDate = input.letterDate ?? "-";
  await updateSuratDraft(villageId, id, {
    typeId: jenis.id,
    residentId: input.residentId,
    letterDate: input.letterDate,
    year: Number(letterDate.slice(0, 4)),
    purpose: input.purpose,
    typeName: jenis.name,
    nilaiIsian: serializeNilaiIsian(denganPengikut(values, input.pengikut ?? [], input.luar ?? [])),
  });
  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.suratUpdate,
    resource: SURAT_RESOURCE,
    resourceId: String(id),
    details: { typeId: jenis.id },
  });
}

export async function deleteSuratData(id: number): Promise<void> {
  const user = await requirePermission(SURAT_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");
  if (surat.status !== "draft") throw conflict("Hanya konsep surat yang dapat dihapus.");

  await deleteSurat(villageId, id);
  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.suratDelete,
    resource: SURAT_RESOURCE,
    resourceId: String(id),
  });
}

/** Ajukan konsep ke antrean verifikasi (operator → sekdes → kades). */
