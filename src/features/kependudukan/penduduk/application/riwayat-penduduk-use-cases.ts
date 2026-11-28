import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  isHeadOfFamily,
  PENDUDUK_RESOURCE,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  catatDatangSchema,
  catatKelahiranSchema,
  catatKematianSchema,
  catatPerubahanSchema,
  catatPindahKeluarSchema,
  opsiStatusDasar,
  ubahStatusDasarSchema,
  type CatatDatangInput,
  type CatatKelahiranInput,
  type CatatKematianInput,
  type CatatPerubahanInput,
  type CatatPindahKeluarInput,
  type ListRiwayatParams,
  type ListRiwayatResult,
  type MutasiDetailMeta,
  type UbahStatusDasarInput,
} from "@/features/kependudukan/penduduk/domain/riwayat-penduduk";
import {
  findPendudukById,
  nationalIdExists,
  validatePendudukTenantReferences,
} from "@/features/kependudukan/penduduk/infrastructure/penduduk-repository";
import {
  getKonteksMutasi,
  getRiwayatById,
  listRiwayatPenduduk,
  listRiwayatPendudukExport,
  simpanPendudukBaruDanMutasi,
  ubahRiwayatPenduduk,
  ubahStatusPendudukDanMutasi,
} from "@/features/kependudukan/penduduk/infrastructure/riwayat-penduduk-repository";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound } from "@/lib/errors";
import type { MutationType } from "@/lib/resident-mutation";

export async function listRiwayat(params: ListRiwayatParams): Promise<ListRiwayatResult> {
  const user = await requirePermission(PENDUDUK_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listRiwayatPenduduk(villageId, params);
}

export async function listRiwayatExport(params: ListRiwayatParams) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return listRiwayatPendudukExport(villageId, params);
}

export async function getRiwayatPendudukById(id: number) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return getRiwayatById(villageId, id);
}

/** Konteks form ubah status dasar: pilihan status yang diizinkan. */
export async function getKonteksMutasiPenduduk(residentId: number) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const [penduduk, konteks] = await Promise.all([
    findPendudukById(villageId, residentId),
    getKonteksMutasi(villageId, residentId),
  ]);
  if (!penduduk || !konteks) return null;
  return {
    penduduk,
    opsi: opsiStatusDasar(konteks),
    konteks,
  };
}

export async function catatKelahiran(input: CatatKelahiranInput) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const parsed = catatKelahiranSchema.parse(input);
  await validatePendudukTenantReferences(villageId, parsed);

  const nid = parsed.nationalId;
  if (nid && (await nationalIdExists(villageId, nid, null))) {
    throw conflict("NIK sudah terdaftar di desa ini.");
  }

  const id = await simpanPendudukBaruDanMutasi(
    {
      villageId,
      familyId: parsed.familyId ?? null,
      familyRelationId: parsed.familyRelationId ?? null,
      regionId: parsed.regionId ?? null,
      nationalId: nid,
      name: parsed.name.trim(),
      gender: parsed.gender === "male" || parsed.gender === "female" ? parsed.gender : "male",
      birthDate: parsed.eventDate,
      birthPlace: null,
      address: parsed.address || null,
      phone: null,
      fatherName: parsed.fatherName || null,
      motherName: parsed.motherName || null,
      fatherNationalId: null,
      motherNationalId: null,
      lifeStatus: "alive",
      residenceStatus: "permanent",
      religionId: null,
      maritalStatusId: null,
      educationId: null,
      educationSedangId: null,
      occupationId: null,
      citizenshipId: null,
      bloodTypeId: null,
      rtmId: null,
      rtmLevel: null,
    },
    {
      villageId,
      type: "birth",
      eventDate: parsed.eventDate,
      reportedAt: new Date(),
      actorId: user.id,
      reason: parsed.reason || null,
      notes: parsed.notes || null,
      referenceNo: parsed.referenceNo || null,
      meta: {
        fatherName: parsed.fatherName || null,
        motherName: parsed.motherName || null,
      },
    },
  );

  return { id };
}

export async function catatKematian(input: CatatKematianInput) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const parsed = catatKematianSchema.parse(input);

  const penduduk = await findPendudukById(villageId, parsed.residentId);
  if (!penduduk) throw notFound("Data penduduk tidak ditemukan.");

  if (penduduk.lifeStatus === "deceased") {
    throw conflict("Penduduk ini sudah tercatat meninggal.");
  }

  const meta: MutasiDetailMeta = {
    tempatMeninggal: parsed.tempatMeninggal || null,
    jamKematian: parsed.jamKematian || null,
    sebab: parsed.sebab,
    penolong: parsed.penolong,
    nomorAkta: parsed.nomorAkta || null,
    anakKe: parsed.anakKe,
    fromLifeStatus: penduduk.lifeStatus,
    toLifeStatus: "deceased",
    kepalaKeluarga: isHeadOfFamily(penduduk),
  };

  await ubahStatusPendudukDanMutasi(villageId, parsed.residentId, "deceased", {
    villageId,
    type: "death",
    eventDate: parsed.eventDate,
    reportedAt: parsed.reportDate ? new Date(`${parsed.reportDate}T00:00:00`) : new Date(),
    actorId: user.id,
    reason: null,
    notes: parsed.notes || null,
    referenceNo: parsed.referenceNo || null,
    meta,
  });
}

export async function catatPindahKeluar(input: CatatPindahKeluarInput) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const parsed = catatPindahKeluarSchema.parse(input);

  const penduduk = await findPendudukById(villageId, parsed.residentId);
  if (!penduduk) throw notFound("Data penduduk tidak ditemukan.");

  if (penduduk.lifeStatus === "moved") {
    throw conflict("Penduduk ini sudah tercatat pindah keluar.");
  }

  const meta: MutasiDetailMeta = {
    refPindah: parsed.refPindah,
    alamatTujuan: parsed.alamatTujuan || null,
    fromLifeStatus: penduduk.lifeStatus,
    toLifeStatus: "moved",
    kepalaKeluarga: isHeadOfFamily(penduduk),
  };

  await ubahStatusPendudukDanMutasi(villageId, parsed.residentId, "moved", {
    villageId,
    type: "move_out",
    eventDate: parsed.eventDate,
    reportedAt: parsed.reportDate ? new Date(`${parsed.reportDate}T00:00:00`) : new Date(),
    actorId: user.id,
    reason: parsed.reason || null,
    notes: parsed.notes || null,
    referenceNo: parsed.referenceNo || null,
    toAddress: parsed.alamatTujuan || parsed.toAddress || null,
    meta,
  });
}

/**
 * Ubah status dasar penduduk.
 * Hanya untuk penduduk yang masih `alive`; kepala KK beranggota banyak
 * tidak dapat langsung "Mati".
 */
export async function ubahStatusDasar(input: UbahStatusDasarInput) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const parsed = ubahStatusDasarSchema.parse(input);

  const [penduduk, konteks] = await Promise.all([
    findPendudukById(villageId, parsed.residentId),
    getKonteksMutasi(villageId, parsed.residentId),
  ]);
  if (!penduduk || !konteks) throw notFound("Data penduduk tidak ditemukan.");
  if (penduduk.lifeStatus !== "alive") {
    throw conflict("Mutasi hanya dapat dilakukan pada penduduk berstatus Hidup.");
  }
  if (!opsiStatusDasar(konteks).includes(parsed.lifeStatus)) {
    throw conflict("Status dasar baru tidak diizinkan untuk penduduk ini.");
  }

  const meta: MutasiDetailMeta = {
    fromLifeStatus: penduduk.lifeStatus,
    toLifeStatus: parsed.lifeStatus,
    kepalaKeluarga: konteks.kepalaKeluarga,
  };
  if (parsed.lifeStatus === "deceased") {
    meta.tempatMeninggal = parsed.tempatMeninggal ?? null;
    meta.jamKematian = parsed.jamKematian ?? null;
    if (parsed.sebab) meta.sebab = parsed.sebab;
    if (parsed.penolong) meta.penolong = parsed.penolong;
    meta.nomorAkta = parsed.nomorAkta ?? null;
    meta.anakKe = parsed.anakKe;
  }
  if (parsed.lifeStatus === "moved") {
    if (parsed.refPindah) meta.refPindah = parsed.refPindah;
    meta.alamatTujuan = parsed.alamatTujuan ?? null;
  }

  // Status dasar dipetakan ke jenis mutasi agar laporan bulanan dapat memisahkan
  // kelahiran, kematian, pindah, dan penduduk hilang.
  const type: MutationType =
    parsed.lifeStatus === "deceased"
      ? "death"
      : parsed.lifeStatus === "moved"
        ? "move_out"
        : parsed.lifeStatus === "missing"
          ? "missing"
          : "change";

  await ubahStatusPendudukDanMutasi(villageId, parsed.residentId, parsed.lifeStatus, {
    villageId,
    type,
    eventDate: parsed.eventDate,
    reportedAt: new Date(`${parsed.reportDate}T00:00:00`),
    actorId: user.id,
    reason: null,
    notes: parsed.notes || null,
    referenceNo: parsed.nomorAkta || null,
    toAddress: parsed.lifeStatus === "moved" ? (parsed.alamatTujuan ?? null) : null,
    meta,
  });
}

/**
 * Kembalikan status dasar penduduk menjadi Hidup.
 */
export async function kembalikanStatusPenduduk(residentId: number) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const penduduk = await findPendudukById(villageId, residentId);
  if (!penduduk) throw notFound("Data penduduk tidak ditemukan.");
  if (penduduk.lifeStatus === "alive") {
    throw conflict("Penduduk ini sudah berstatus Hidup.");
  }

  await ubahStatusPendudukDanMutasi(villageId, residentId, "alive", {
    villageId,
    type: "change",
    eventDate: new Date().toISOString().slice(0, 10),
    reportedAt: new Date(),
    actorId: user.id,
    reason: "Pengembalian status dasar",
    notes: null,
    referenceNo: null,
    meta: {
      fromLifeStatus: penduduk.lifeStatus,
      toLifeStatus: "alive",
      kepalaKeluarga: isHeadOfFamily(penduduk),
    } satisfies MutasiDetailMeta,
  });
}

export async function kembalikanStatusMassal(residentIds: number[]) {
  let jumlah = 0;
  for (const id of [...new Set(residentIds)]) {
    if (Number.isInteger(id) && id > 0) {
      await kembalikanStatusPenduduk(id);
      jumlah += 1;
    }
  }
  return { jumlah };
}

/** Perbarui catatan riwayat. */
export async function ubahRiwayat(
  id: number,
  input: {
    eventDate: string;
    reportDate: string;
    notes?: string;
    tempatMeninggal?: string;
    jamKematian?: string;
    sebab?: string;
    penolong?: string;
    nomorAkta?: string;
    anakKe?: number;
    refPindah?: string;
    alamatTujuan?: string;
  },
) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.reportDate)
  ) {
    throw conflict("Tanggal peristiwa/lapor tidak valid.");
  }
  if (input.reportDate < input.eventDate) {
    throw conflict("Tanggal lapor harus sama atau lebih besar dari tanggal peristiwa.");
  }

  const row = await getRiwayatById(villageId, id);
  if (!row) throw notFound("Catatan riwayat tidak ditemukan.");

  const metaLama = (row.meta ?? {}) as MutasiDetailMeta;
  const meta: MutasiDetailMeta = {
    ...metaLama,
    ...(input.tempatMeninggal !== undefined
      ? { tempatMeninggal: input.tempatMeninggal || null }
      : {}),
    ...(input.jamKematian !== undefined ? { jamKematian: input.jamKematian || null } : {}),
    ...(input.sebab ? { sebab: input.sebab as MutasiDetailMeta["sebab"] } : {}),
    ...(input.penolong ? { penolong: input.penolong as MutasiDetailMeta["penolong"] } : {}),
    ...(input.nomorAkta !== undefined ? { nomorAkta: input.nomorAkta || null } : {}),
    ...(input.anakKe !== undefined ? { anakKe: input.anakKe } : {}),
    ...(input.refPindah ? { refPindah: input.refPindah as MutasiDetailMeta["refPindah"] } : {}),
    ...(input.alamatTujuan !== undefined ? { alamatTujuan: input.alamatTujuan || null } : {}),
  };

  await ubahRiwayatPenduduk(villageId, id, {
    eventDate: input.eventDate,
    reportedAt: new Date(`${input.reportDate}T00:00:00`),
    notes: input.notes || null,
    toAddress:
      input.alamatTujuan !== undefined && input.alamatTujuan !== ""
        ? input.alamatTujuan
        : row.toAddress,
    meta,
  });
}

export async function catatPerubahan(input: CatatPerubahanInput) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const parsed = catatPerubahanSchema.parse(input);

  if (parsed.lifeStatus === "deceased" || parsed.lifeStatus === "moved") {
    throw conflict("Gunakan pencatatan kematian atau pindah keluar untuk status tersebut.");
  }

  const penduduk = await findPendudukById(villageId, parsed.residentId);
  if (!penduduk) throw notFound("Data penduduk tidak ditemukan.");
  if (penduduk.lifeStatus === parsed.lifeStatus) {
    throw conflict("Status kependudukan tidak berubah.");
  }

  await ubahStatusPendudukDanMutasi(villageId, parsed.residentId, parsed.lifeStatus, {
    villageId,
    type: "change",
    eventDate: parsed.eventDate,
    reportedAt: new Date(),
    actorId: user.id,
    reason: parsed.reason || null,
    notes: parsed.notes || null,
    referenceNo: parsed.referenceNo || null,
    meta: {
      fromLifeStatus: penduduk.lifeStatus,
      toLifeStatus: parsed.lifeStatus,
      kepalaKeluarga: isHeadOfFamily(penduduk),
    },
  });
}

export async function catatDatang(input: CatatDatangInput) {
  const user = await requirePermission(PENDUDUK_RESOURCE, "update");
  const villageId = await resolveVillageId(user);
  const parsed = catatDatangSchema.parse(input);
  await validatePendudukTenantReferences(villageId, parsed);

  const nid = parsed.nationalId;
  if (nid && (await nationalIdExists(villageId, nid, null))) {
    throw conflict("NIK sudah terdaftar di desa ini.");
  }

  const id = await simpanPendudukBaruDanMutasi(
    {
      villageId,
      familyId: parsed.familyId ?? null,
      familyRelationId: parsed.familyRelationId ?? null,
      regionId: parsed.regionId ?? null,
      nationalId: nid,
      name: parsed.name.trim(),
      gender: parsed.gender === "male" || parsed.gender === "female" ? parsed.gender : "male",
      birthDate: parsed.birthDate,
      birthPlace: parsed.birthPlace || null,
      address: parsed.address || null,
      phone: null,
      fatherName: null,
      motherName: null,
      fatherNationalId: null,
      motherNationalId: null,
      lifeStatus: "alive",
      residenceStatus: "permanent",
      religionId: null,
      maritalStatusId: null,
      educationId: null,
      educationSedangId: null,
      occupationId: null,
      citizenshipId: null,
      bloodTypeId: null,
      rtmId: null,
      rtmLevel: null,
    },
    {
      villageId,
      type: "move_in",
      eventDate: parsed.eventDate,
      reportedAt: new Date(),
      actorId: user.id,
      reason: parsed.reason || null,
      notes: parsed.notes || null,
      referenceNo: parsed.referenceNo || null,
      fromAddress: parsed.fromAddress || null,
      meta: { fromAddress: parsed.fromAddress || null },
    },
  );

  return { id };
}
