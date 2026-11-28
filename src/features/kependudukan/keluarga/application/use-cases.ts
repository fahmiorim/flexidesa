import "server-only";

import { getIdentitas } from "@/features/info-desa/desa/application/get-identitas";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  findWilayahById,
  listWilayahOptions,
} from "@/features/info-desa/wilayah/application/kontrak";
import { formatWilayahLabel } from "@/features/info-desa/wilayah/domain/wilayah";
import {
  HEAD_OF_FAMILY_RELATION_ID,
  isTemporaryFamilyNumber,
  KELUARGA_BULK_MAX,
  KELUARGA_RESOURCE,
  type KeluargaCreateInput,
  type KeluargaDetail,
  type KeluargaDTO,
  type KeluargaFormInput,
  type KeluargaListFilter,
  type KeluargaListRow,
  type KeluargaMember,
  type KeluargaMemberDetail,
  type KeluargaReferenceData,
  type KeluargaRingkasan,
  type KeluargaStatusFilter,
  type PecahKeluargaInput,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import {
  buildKeluargaDaftarPdf as buildKeluargaDaftarPdfFile,
  buildKeluargaDaftarXlsx as buildKeluargaDaftarXlsxFile,
} from "@/features/kependudukan/keluarga/infrastructure/keluarga-daftar";
import {
  buildKeluargaPdf,
  gabungKeluargaPdf,
} from "@/features/kependudukan/keluarga/infrastructure/keluarga-pdf";
import {
  deleteKeluargaBanyak as deleteKeluargaBanyakRow,
  deleteKeluarga as deleteKeluargaRow,
  findKeluargaById,
  findKeluargaDetail,
  findKeluargaHeadCandidate,
  getKeluargaRingkasan as getKeluargaRingkasanRow,
  insertKeluarga,
  keluargaNumberExists,
  listBantuanKeluargaOptions,
  listKeluargaAnggotaRows,
  listKeluargaHeadCandidates,
  listKeluargaMemberDetails,
  listKeluargaMembers as listKeluargaMembersRows,
  listKeluarga as listKeluargaRows,
  listLogAnggotaKk,
  nextTemporaryKeluargaNumber,
  pecahKeluarga as pecahKeluargaRow,
  pindahWilayahKeluarga as pindahWilayahKeluargaRow,
  updateKeluarga as updateKeluargaRow,
  validateKeluargaRegion,
  type KeluargaListResult,
} from "@/features/kependudukan/keluarga/infrastructure/keluarga-repository";
import { createPenduduk } from "@/features/kependudukan/penduduk/application/use-cases";
import { PENDUDUK_RESOURCE } from "@/features/kependudukan/penduduk/domain/penduduk";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound, validationError } from "@/lib/errors";

/**
 * Lapisan aplikasi (use case) untuk keluarga.
 *
 * Setiap use case menegakkan izinnya sendiri lewat `requirePermission`, jadi
 * pemanggil mana pun (Server Action, Route Handler, skrip) otomatis terlindungi.
 */

export interface ListKeluargaParams {
  search: string;
  status?: KeluargaStatusFilter;
  gender?: "male" | "female" | "all";
  regionId?: number | null;
  temporaryOnly?: boolean;
  programId?: number | null;
  numbers?: string[];
  page: number;
  pageSize: number;
}

export async function listKeluarga(params: ListKeluargaParams): Promise<KeluargaListResult> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  return listKeluargaRows({
    villageId,
    search: params.search,
    status: params.status ?? "all",
    gender: params.gender ?? "all",
    regionId: params.regionId ?? null,
    temporaryOnly: params.temporaryOnly ?? false,
    programId: params.programId ?? null,
    numbers: params.numbers ?? [],
    page: params.page,
    pageSize: params.pageSize,
  });
}

/**
 * Semua KK yang cocok dengan filter, tanpa paginasi.
 * Dipakai ekspor dan daftar cetak/unduh agar isinya sama dengan filter aktif.
 */
export async function listSemuaKeluarga(filter: KeluargaListFilter): Promise<KeluargaListRow[]> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const pageSize = 1000;
  const pertama = await listKeluargaRows({
    villageId,
    ...filter,
    page: 1,
    pageSize,
  });
  if (pertama.pageCount <= 1) return pertama.rows;

  const halamanLain = await Promise.all(
    Array.from({ length: pertama.pageCount - 1 }, (_, index) =>
      listKeluargaRows({
        villageId,
        ...filter,
        page: index + 2,
        pageSize,
      }),
    ),
  );
  return [...pertama.rows, ...halamanLain.flatMap((halaman) => halaman.rows)];
}

/** Data desa + seluruh KK terfilter untuk cetak/unduh daftar. */
async function getKeluargaDaftarData(filter: KeluargaListFilter) {
  const [rows, desa] = await Promise.all([listSemuaKeluarga(filter), getIdentitas()]);
  return { rows, namaDesa: desa?.namaDesa ?? "Desa" };
}

/** PDF daftar KK sesuai filter; `sensor` menyembunyikan NIK dan nomor KK. */
export async function buildKeluargaDaftarPdf(
  filter: KeluargaListFilter,
  sensor: boolean,
): Promise<Uint8Array> {
  const { rows, namaDesa } = await getKeluargaDaftarData(filter);
  return buildKeluargaDaftarPdfFile({ rows, namaDesa, sensor });
}

/** XLSX daftar KK sesuai filter; `sensor` menyembunyikan NIK dan nomor KK. */
export async function buildKeluargaDaftarXlsx(
  filter: KeluargaListFilter,
  sensor: boolean,
): Promise<Uint8Array> {
  const { rows, namaDesa } = await getKeluargaDaftarData(filter);
  return buildKeluargaDaftarXlsxFile({ rows, namaDesa, sensor });
}

/** Ringkasan KK dan anggota hidup untuk kartu statistik. */
export async function getRingkasanKeluarga(): Promise<KeluargaRingkasan> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return getKeluargaRingkasanRow(villageId);
}

/** Data referensi untuk mengisi formulir (butuh izin baca modul keluarga). */
/** Referensi formulir tambah/ubah KK; hanya pengguna yang boleh mengelola keluarga. */
export async function getKeluargaFormReference(): Promise<KeluargaReferenceData> {
  const user = await requirePermission(KELUARGA_RESOURCE, "create");
  const villageId = await resolveVillageId(user);
  const [regions, candidates, bantuanPrograms] = await Promise.all([
    listWilayahOptions(villageId),
    listKeluargaHeadCandidates(villageId),
    listBantuanKeluargaOptions(villageId),
  ]);
  return {
    regions: regions.map((region) => ({ id: region.id, label: formatWilayahLabel(region) })),
    headCandidates: candidates.map((candidate) => ({
      id: candidate.id,
      label: `${candidate.nationalId ? `NIK ${candidate.nationalId} - ` : "NIK belum diisi - "}${candidate.name}`,
    })),
    bantuanPrograms: bantuanPrograms.map((program) => ({
      id: program.id,
      label: program.name,
    })),
  };
}

export async function getKeluargaReference(): Promise<KeluargaReferenceData> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const [regions, bantuanPrograms] = await Promise.all([
    listWilayahOptions(villageId),
    listBantuanKeluargaOptions(villageId),
  ]);

  return {
    regions: regions.map((region) => ({ id: region.id, label: formatWilayahLabel(region) })),
    headCandidates: [],
    bantuanPrograms: bantuanPrograms.map((program) => ({
      id: program.id,
      label: program.name,
    })),
  };
}

/** Anggota sebuah KK; dipakai dialog rincian pada UI. */
export async function listKeluargaMembers(familyId: number): Promise<KeluargaMember[]> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const family = await findKeluargaById(villageId, familyId);
  if (!family) throw notFound("Kartu Keluarga tidak ditemukan.");

  return listKeluargaMembersRows(villageId, familyId);
}

/**
 * Data lengkap sebuah KK untuk dicetak.
 *
 * Menggabungkan identitas desa (untuk kop & wilayah), keluarga (nomor, alamat),
 * dan seluruh anggota berstatus hidup dengan kolom baku KK. Route PDF memakai
 * ini agar tidak perlu menyusun data sendiri.
 */
interface KeluargaPrintData {
  keluarga: KeluargaDTO;
  anggota: KeluargaMemberDetail[];
  wilayah: {
    dusun: string | null;
    rw: string | null;
    rt: string | null;
  };
}

/** Bangun PDF Kartu Keluarga; izin dan wilayah diperiksa di use case. */
export async function buildKeluargaPdfData(familyId: number): Promise<Uint8Array> {
  const { keluarga, anggota, wilayah } = await getKeluargaPrintData(familyId);
  const desa = await getIdentitas();
  return buildKeluargaPdf({
    desa,
    nomorKk: keluarga.number,
    alamat: keluarga.address,
    wilayah,
    anggota,
  });
}

/** Bangun satu PDF berisi beberapa KK untuk aksi cetak/unduh massal. */
export async function buildKeluargaPdfBatch(familyIds: readonly number[]): Promise<Uint8Array> {
  const ids = [...new Set(familyIds)].filter((id) => Number.isSafeInteger(id) && id > 0);
  if (ids.length === 0) throw validationError("Pilih minimal satu Kartu Keluarga.");
  if (ids.length > KELUARGA_BULK_MAX) {
    throw validationError(`Maksimal ${KELUARGA_BULK_MAX} KK dalam satu cetakan.`);
  }

  const dokumen = await Promise.all(ids.map((id) => buildKeluargaPdfData(id)));
  return gabungKeluargaPdf(dokumen);
}

export async function getKeluargaPrintData(familyId: number): Promise<KeluargaPrintData> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const keluarga = await findKeluargaById(villageId, familyId);
  if (!keluarga) throw notFound("Kartu Keluarga tidak ditemukan.");

  const [anggota, wilayah] = await Promise.all([
    listKeluargaMemberDetails(villageId, familyId),
    keluarga.regionId === null
      ? Promise.resolve(null)
      : findWilayahById(villageId, keluarga.regionId),
  ]);

  return {
    keluarga,
    anggota,
    wilayah: {
      dusun: wilayah?.dusun || null,
      rw: wilayah?.rw || null,
      rt: wilayah?.rt || null,
    },
  };
}

/**
 * Data lengkap sebuah KK untuk halaman rincian.
 *
 * Memuat identitas KK, kepala keluarga, seluruh anggota (termasuk yang sudah
 * meninggal/pindah), dan riwayat perubahan anggota.
 */
export async function getKeluargaDetail(familyId: number): Promise<KeluargaDetail> {
  const user = await requirePermission(KELUARGA_RESOURCE, "read");
  const villageId = await resolveVillageId(user);

  const detail = await findKeluargaDetail(villageId, familyId);
  if (!detail) throw notFound("Kartu Keluarga tidak ditemukan.");

  const [members, logs] = await Promise.all([
    listKeluargaAnggotaRows(villageId, familyId),
    listLogAnggotaKk(villageId, familyId),
  ]);

  const kepala = members.find((member) => member.relationId === HEAD_OF_FAMILY_RELATION_ID);

  return {
    keluarga: detail.keluarga,
    regionLabel: detail.regionLabel,
    headName: kepala?.name ?? null,
    members,
    logs,
  };
}

/** Tentukan nomor final: nomor sementara dibuat server, permanen harus 16 angka. */
async function resolveNomorKeluarga(
  villageId: number,
  input: Pick<KeluargaFormInput, "number" | "temporary">,
  existingNumber: string | null,
): Promise<string> {
  if (input.temporary) {
    if (existingNumber && isTemporaryFamilyNumber(existingNumber)) return existingNumber;
    return nextTemporaryKeluargaNumber(villageId);
  }

  if (isTemporaryFamilyNumber(input.number)) {
    throw validationError(
      "Nomor KK permanen tidak boleh diawali 0. Centang nomor sementara atau masukkan nomor permanen.",
    );
  }
  if (!/^\d{16}$/.test(input.number)) {
    throw validationError("Nomor KK harus 16 angka.");
  }
  return input.number;
}

export async function createKeluarga(input: KeluargaCreateInput): Promise<{ id: number }> {
  const user = await requirePermission(KELUARGA_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const head = input.headResidentId
    ? await findKeluargaHeadCandidate(villageId, input.headResidentId)
    : null;
  if (input.headResidentId && !head) {
    throw validationError(
      "Penduduk yang dipilih tidak ditemukan atau sudah menjadi anggota keluarga lain.",
    );
  }

  // Alamat/wilayah kepala keluarga diambil dari penduduk yang sudah
  // ada. Isian manual pada formulir tetap diutamakan bila diisi.
  const fields: KeluargaFormInput = {
    number: await resolveNomorKeluarga(villageId, input, null),
    temporary: input.temporary,
    address: input.address || head?.address || "",
    regionId: input.regionId ?? head?.regionId ?? null,
    welfareClass: input.welfareClass,
    cardPrintedAt: input.cardPrintedAt,
  };

  await validateKeluargaRegion(villageId, fields.regionId);

  if (await keluargaNumberExists(villageId, fields.number, null)) {
    throw conflict("Nomor KK tersebut sudah terdaftar.");
  }

  const id = await insertKeluarga(villageId, fields, head ? { head, actorId: user.id } : undefined);

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keluargaCreate,
    resource: KELUARGA_RESOURCE,
    resourceId: String(id),
    details: { nomor: fields.number, kepalaKeluarga: head?.name ?? null },
  });

  return { id };
}

/**
 * Tambah KK sekaligus penduduk kepala keluarga baru.
 *
 * Keluarga dibuat lebih dulu agar penduduk dapat ditautkan dengan `family_id`
 * yang sudah ada. Bila penyimpanan penduduk gagal, KK kosong yang baru dibuat
 * dihapus kembali supaya tidak tertinggal data setengah jadi.
 */
export async function createKeluargaDenganKepalaBaru(
  keluarga: KeluargaFormInput,
  penduduk: Parameters<typeof createPenduduk>[0],
): Promise<{ id: number; residentId: number }> {
  const user = await requirePermission(KELUARGA_RESOURCE, "create");
  await requirePermission(PENDUDUK_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const { id } = await createKeluarga({ ...keluarga, headResidentId: null });

  try {
    const hasil = await createPenduduk({
      ...penduduk,
      familyId: id,
      familyRelationId: HEAD_OF_FAMILY_RELATION_ID,
    });
    return { id, residentId: hasil.id };
  } catch (error) {
    await deleteKeluargaRow(villageId, id);
    throw error;
  }
}

export async function updateKeluarga(id: number, input: KeluargaFormInput): Promise<void> {
  const user = await requirePermission(KELUARGA_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const existing = await findKeluargaById(villageId, id);
  if (!existing) throw notFound("Kartu Keluarga tidak ditemukan.");

  const fields: KeluargaFormInput = {
    ...input,
    number: await resolveNomorKeluarga(villageId, input, existing.number),
  };

  await validateKeluargaRegion(villageId, fields.regionId);

  if (await keluargaNumberExists(villageId, fields.number, id)) {
    throw conflict("Nomor KK tersebut sudah terdaftar.");
  }

  await updateKeluargaRow(villageId, id, fields);

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keluargaUpdate,
    resource: KELUARGA_RESOURCE,
    resourceId: String(id),
  });
}

/** Pindahkan beberapa KK beserta anggotanya ke wilayah yang dipilih. */
export async function pindahWilayahKeluarga(
  familyIds: readonly number[],
  regionId: number,
): Promise<number> {
  const user = await requirePermission(KELUARGA_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const ids = [...new Set(familyIds)].filter((id) => Number.isSafeInteger(id) && id > 0);
  if (ids.length === 0) throw validationError("Pilih minimal satu Kartu Keluarga.");
  if (ids.length > KELUARGA_BULK_MAX) {
    throw validationError(`Maksimal ${KELUARGA_BULK_MAX} KK dalam satu aksi.`);
  }

  await validateKeluargaRegion(villageId, regionId);
  const jumlah = await pindahWilayahKeluargaRow(villageId, ids, regionId);

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keluargaUpdate,
    resource: KELUARGA_RESOURCE,
    details: { aksi: "pindah-wilayah-kolektif", jumlah, regionId },
  });

  return jumlah;
}

/** Pecah KK lama menjadi KK baru dengan kepala keluarga dari anggota hidup. */
export async function pecahKeluarga(
  id: number,
  input: PecahKeluargaInput,
): Promise<{ id: number }> {
  const user = await requirePermission(KELUARGA_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const existing = await findKeluargaById(villageId, id);
  if (!existing) throw notFound("Kartu Keluarga tidak ditemukan.");

  const number = await resolveNomorKeluarga(villageId, input, null);
  if (await keluargaNumberExists(villageId, number, null)) {
    throw conflict("Nomor KK tersebut sudah terdaftar.");
  }

  const newId = await pecahKeluargaRow(villageId, id, number, input.headResidentId, user.id);

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keluargaCreate,
    resource: KELUARGA_RESOURCE,
    resourceId: String(newId),
    details: { nomor: number, pecahDari: existing.number, kepalaBaruId: input.headResidentId },
  });

  return { id: newId };
}

export async function deleteKeluarga(id: number): Promise<void> {
  const user = await requirePermission(KELUARGA_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const existing = await findKeluargaById(villageId, id);
  if (!existing) throw notFound("Kartu Keluarga tidak ditemukan.");

  const members = await listKeluargaMembersRows(villageId, id);
  if (members.length > 0)
    throw conflict(
      "Kartu Keluarga masih memiliki anggota. Pindahkan atau lepaskan seluruh anggota terlebih dahulu.",
    );

  await deleteKeluargaRow(villageId, id);

  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.keluargaDelete,
    resource: KELUARGA_RESOURCE,
    resourceId: String(id),
    details: { nomor: existing.number },
  });
}

export async function deleteKeluargaBanyak(
  familyIds: readonly number[],
): Promise<{ dihapus: number; dilewati: string[] }> {
  const user = await requirePermission(KELUARGA_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  const ids = [...new Set(familyIds)].filter((id) => Number.isSafeInteger(id) && id > 0);
  if (ids.length === 0) throw validationError("Pilih minimal satu Kartu Keluarga.");
  if (ids.length > KELUARGA_BULK_MAX) {
    throw validationError(`Maksimal ${KELUARGA_BULK_MAX} KK dalam satu aksi.`);
  }

  const hasil = await deleteKeluargaBanyakRow(villageId, ids);
  if (hasil.dihapus > 0) {
    await recordAuditEvent({
      villageId,
      actorId: user.id,
      event: AUDIT_EVENTS.keluargaDelete,
      resource: KELUARGA_RESOURCE,
      details: { jumlah: hasil.dihapus, dilewati: hasil.dilewati.length },
    });
  }
  return hasil;
}
