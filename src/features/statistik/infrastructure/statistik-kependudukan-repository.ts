import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bantuanPeserta, bantuanProgram } from "@/db/schema/bantuan";
import { jabatanPerangkat, perangkatDesa } from "@/db/schema/content";
import { dtks } from "@/db/schema/dtks";
import { families } from "@/db/schema/family";
import {
  bloodTypes,
  citizenships,
  educations,
  familyRelations,
  maritalStatuses,
  occupations,
  religions,
} from "@/db/schema/reference";
import { regions } from "@/db/schema/region";
import { residents } from "@/db/schema/resident";
import { rumahTangga } from "@/db/schema/rumah-tangga";
import {
  ACTIVE_STATUS_LABELS,
  calculateAge,
  CHRONIC_ILLNESS_LABELS,
  DISABILITY_LABELS,
  INSURANCE_LABELS,
  KB_METHOD_LABELS,
  KTP_EL_LABELS,
  PREGNANCY_STATUS_LABELS,
  RESIDENCE_STATUS_LABELS,
  STATUS_REKAM_LABELS,
  type ActiveStatus,
  type ChronicIllness,
  type Disability,
  type Gender,
  type Insurance,
  type KbMethod,
  type KtpEl,
  type PregnancyStatus,
  type ResidenceStatus,
  type StatusRekam,
} from "@/features/penduduk/domain/penduduk";
import {
  type BantuanStatistik,
  type DataStatistikKependudukan,
  type KeluargaStatistik,
  type PejabatPenandatanganStatistik,
  type RtmStatistik,
} from "@/features/statistik/domain/statistik-kependudukan";
import { listRentangUmur } from "@/features/statistik/infrastructure/rentang-umur-repository";
import { formatWilayahLabel } from "@/features/wilayah/domain/wilayah";

export interface FilterWilayahStatistik {
  dusun?: string;
  rw?: string;
  rt?: string;
}

/** Pejabat aktif yang dapat dipilih sebagai penanda tangan laporan. */
export async function listPejabatPenandatangan(
  villageId: number,
): Promise<PejabatPenandatanganStatistik[]> {
  const rows = await db
    .select({
      id: perangkatDesa.id,
      nama: perangkatDesa.nama,
      gelarDepan: perangkatDesa.gelarDepan,
      gelarBelakang: perangkatDesa.gelarBelakang,
      jabatan: jabatanPerangkat.nama,
      jenisJabatan: jabatanPerangkat.jenis,
    })
    .from(perangkatDesa)
    .leftJoin(
      jabatanPerangkat,
      and(
        eq(perangkatDesa.jabatanId, jabatanPerangkat.id),
        eq(jabatanPerangkat.villageId, villageId),
      ),
    )
    .where(and(eq(perangkatDesa.villageId, villageId), eq(perangkatDesa.status, "aktif")))
    .orderBy(asc(perangkatDesa.urut), asc(perangkatDesa.id));

  return rows.map((row) => ({
    id: row.id,
    nama: [row.gelarDepan, row.nama, row.gelarBelakang].filter(Boolean).join(" "),
    jabatan: row.jabatan,
    jenisJabatan: row.jenisJabatan,
  }));
}

function label<T extends string>(
  labels: Readonly<Record<T, string>>,
  value: T | null,
): string | null {
  return value ? (labels[value] ?? null) : null;
}

function whereWilayah(dusun?: string, rw?: string, rt?: string) {
  return [
    dusun ? eq(regions.dusun, dusun) : undefined,
    rw ? eq(regions.rw, rw) : undefined,
    rt ? eq(regions.rt, rt) : undefined,
  ];
}

/**
 * Muat seluruh bahan statistik kependudukan untuk satu desa.
 *
 * Penduduk dibaca satu kali lengkap dengan katalog referensinya, lalu
 * pengelompokan dilakukan di domain. Filter wilayah diterapkan pada penduduk,
 * keluarga, dan rumah tangga agar angka konsisten dengan tabelnya.
 */
export async function ambilDataStatistikKependudukan(
  villageId: number,
  filter: FilterWilayahStatistik = {},
): Promise<DataStatistikKependudukan> {
  const { dusun, rw, rt } = filter;

  const [
    pendudukRows,
    keluargaRows,
    rtmRows,
    dtksRows,
    programRows,
    pesertaRows,
    rentangUmur,
    agamaRows,
    pendidikanRows,
    pekerjaanRows,
    statusKawinRows,
    hubunganRows,
    wargaNegaraRows,
    golonganDarahRows,
  ] = await Promise.all([
    db
      .select({
        id: residents.id,
        nama: residents.name,
        nik: residents.nationalId,
        alamat: residents.address,
        dusun: regions.dusun,
        rw: regions.rw,
        rt: regions.rt,
        gender: residents.gender,
        birthDate: residents.birthDate,
        religion: religions.name,
        education: educations.name,
        educationSedang: residents.educationSedangId,
        occupation: occupations.name,
        maritalStatus: maritalStatuses.name,
        maritalStatusId: residents.maritalStatusId,
        familyRelation: familyRelations.name,
        citizenship: citizenships.name,
        residenceStatus: residents.residenceStatus,
        bloodType: bloodTypes.name,
        disability: residents.disability,
        chronicIllness: residents.chronicIllness,
        kbMethod: residents.kbMethod,
        birthCertificateNumber: residents.birthCertificateNumber,
        statusRekam: residents.statusRekam,
        ktpEl: residents.ktpEl,
        insurance: residents.insurance,
        insuranceStatus: residents.insuranceStatus,
        ethnicity: residents.ethnicity,
        marga: residents.marga,
        adat: residents.adat,
        migrantWorker: residents.migrantWorker,
        bpjsEmploymentNumber: residents.bpjsEmploymentNumber,
        pregnancyStatus: residents.pregnancyStatus,
        familyId: residents.familyId,
        rtmId: residents.rtmId,
        rtmLevel: residents.rtmLevel,
      })
      .from(residents)
      .leftJoin(regions, and(eq(residents.regionId, regions.id), eq(regions.villageId, villageId)))
      .leftJoin(religions, eq(residents.religionId, religions.id))
      .leftJoin(educations, eq(residents.educationId, educations.id))
      .leftJoin(occupations, eq(residents.occupationId, occupations.id))
      .leftJoin(maritalStatuses, eq(residents.maritalStatusId, maritalStatuses.id))
      .leftJoin(familyRelations, eq(residents.familyRelationId, familyRelations.id))
      .leftJoin(citizenships, eq(residents.citizenshipId, citizenships.id))
      .leftJoin(bloodTypes, eq(residents.bloodTypeId, bloodTypes.id))
      .where(
        and(
          eq(residents.villageId, villageId),
          eq(residents.lifeStatus, "alive"),
          ...whereWilayah(dusun, rw, rt),
        ),
      ),
    db
      .select({
        id: families.id,
        welfareClass: families.welfareClass,
      })
      .from(families)
      .leftJoin(regions, and(eq(families.regionId, regions.id), eq(regions.villageId, villageId)))
      .where(and(eq(families.villageId, villageId), ...whereWilayah(dusun, rw, rt))),
    db
      .select({
        id: rumahTangga.id,
        bdt: rumahTangga.bdt,
      })
      .from(rumahTangga)
      .leftJoin(
        regions,
        and(eq(rumahTangga.regionId, regions.id), eq(regions.villageId, villageId)),
      )
      .where(and(eq(rumahTangga.villageId, villageId), ...whereWilayah(dusun, rw, rt))),
    db.select({ rtmId: dtks.rtmId }).from(dtks).where(eq(dtks.villageId, villageId)),
    db
      .select({
        id: bantuanProgram.id,
        slug: bantuanProgram.slug,
        name: bantuanProgram.name,
        sasaran: bantuanProgram.sasaran,
      })
      .from(bantuanProgram)
      .where(eq(bantuanProgram.villageId, villageId))
      .orderBy(asc(bantuanProgram.name)),
    db
      .select({
        programId: bantuanPeserta.programId,
        residentId: bantuanPeserta.residentId,
        familyId: bantuanPeserta.familyId,
      })
      .from(bantuanPeserta)
      .where(eq(bantuanPeserta.villageId, villageId)),
    listRentangUmur(villageId),
    db.select({ name: religions.name }).from(religions).orderBy(asc(religions.id)),
    db.select({ name: educations.name }).from(educations).orderBy(asc(educations.id)),
    db.select({ name: occupations.name }).from(occupations).orderBy(asc(occupations.id)),
    db
      .select({ name: maritalStatuses.name })
      .from(maritalStatuses)
      .orderBy(asc(maritalStatuses.id)),
    db
      .select({ name: familyRelations.name })
      .from(familyRelations)
      .orderBy(asc(familyRelations.id)),
    db.select({ name: citizenships.name }).from(citizenships).orderBy(asc(citizenships.id)),
    db.select({ name: bloodTypes.name }).from(bloodTypes).orderBy(asc(bloodTypes.id)),
  ]);

  // Pendidikan sedang memakai katalog pendidikan yang sama; ambil namanya dari
  // katalog agar nilai id tidak tampil di UI.
  const pendidikanById = new Map(
    (await db.select({ id: educations.id, name: educations.name }).from(educations)).map((row) => [
      row.id,
      row.name,
    ]),
  );

  const penduduk = pendudukRows.map((row) => ({
    id: row.id,
    nama: row.nama,
    nik: row.nik,
    alamat: row.alamat,
    wilayah:
      row.dusun || row.rw || row.rt
        ? formatWilayahLabel({
            dusun: row.dusun ?? "",
            rw: row.rw ?? "",
            rt: row.rt ?? "",
          })
        : null,
    gender: row.gender as Gender,
    umur: calculateAge(row.birthDate),
    agama: row.religion,
    pendidikan: row.education,
    pendidikanSedang:
      row.educationSedang === null ? null : (pendidikanById.get(row.educationSedang) ?? null),
    pekerjaan: row.occupation,
    statusKawin: row.maritalStatus,
    statusKawinId: row.maritalStatusId,
    hubunganKk: row.familyRelation,
    wargaNegara: row.citizenship,
    statusPenduduk: label<ResidenceStatus>(RESIDENCE_STATUS_LABELS, row.residenceStatus),
    golonganDarah: row.bloodType,
    disabilitas: label<Disability>(DISABILITY_LABELS, row.disability),
    penyakitMenahun: label<ChronicIllness>(CHRONIC_ILLNESS_LABELS, row.chronicIllness),
    akseptorKb: label<KbMethod>(KB_METHOD_LABELS, row.kbMethod),
    aktaKelahiran: row.birthCertificateNumber,
    statusRekam: label<StatusRekam>(STATUS_REKAM_LABELS, row.statusRekam),
    ktpEl: label<KtpEl>(KTP_EL_LABELS, row.ktpEl),
    asuransi: label<Insurance>(INSURANCE_LABELS, row.insurance),
    statusAsuransi: label<ActiveStatus>(ACTIVE_STATUS_LABELS, row.insuranceStatus),
    suku: row.ethnicity,
    marga: row.marga,
    adat: row.adat,
    pekerjaMigran: row.migrantWorker,
    bpjsKetenagakerjaan: row.bpjsEmploymentNumber,
    statusKehamilan: label<PregnancyStatus>(PREGNANCY_STATUS_LABELS, row.pregnancyStatus),
  }));

  const familyHeads = new Map<number, Gender>();
  const rtmHeads = new Map<number, Gender>();
  for (const row of pendudukRows) {
    if (row.familyId !== null && (row.familyRelation ?? "").toUpperCase().includes("KEPALA")) {
      familyHeads.set(row.familyId, row.gender as Gender);
    }
    if (row.rtmId !== null && row.rtmLevel === 1) {
      rtmHeads.set(row.rtmId, row.gender as Gender);
    }
  }

  const keluarga: KeluargaStatistik[] = keluargaRows.map((row) => ({
    welfareClass: row.welfareClass,
    kepalaGender: familyHeads.get(row.id) ?? null,
  }));

  const terdaftarDtks = new Set(dtksRows.map((row) => row.rtmId));
  const rtm: RtmStatistik[] = rtmRows.map((row) => ({
    bdt: row.bdt,
    terdaftarDtks: terdaftarDtks.has(row.id),
    kepalaGender: rtmHeads.get(row.id) ?? null,
  }));

  const genderById = new Map(pendudukRows.map((row) => [row.id, row.gender as Gender]));
  const kepalaKeluarga = new Map(
    keluargaRows.map((row) => [row.id, familyHeads.get(row.id) ?? null]),
  );

  const hitungPenerima = new Map<number, { lakiLaki: number; perempuan: number }>();
  for (const peserta of pesertaRows) {
    const isi = hitungPenerima.get(peserta.programId) ?? { lakiLaki: 0, perempuan: 0 };
    const gender =
      peserta.residentId !== null
        ? genderById.get(peserta.residentId)
        : peserta.familyId !== null
          ? kepalaKeluarga.get(peserta.familyId)
          : null;
    if (gender === "male") isi.lakiLaki += 1;
    else if (gender === "female") isi.perempuan += 1;
    hitungPenerima.set(peserta.programId, isi);
  }

  const bantuan: BantuanStatistik[] = programRows.map((program) => {
    const isi = hitungPenerima.get(program.id) ?? { lakiLaki: 0, perempuan: 0 };
    return {
      slug: program.slug,
      nama: program.name,
      sasaran: program.sasaran,
      lakiLaki: isi.lakiLaki,
      perempuan: isi.perempuan,
    };
  });

  return {
    penduduk,
    rentangUmur,
    katalog: {
      agama: agamaRows.map((row) => row.name),
      pendidikan: pendidikanRows.map((row) => row.name),
      pekerjaan: pekerjaanRows.map((row) => row.name),
      statusKawin: statusKawinRows.map((row) => row.name),
      hubunganKk: hubunganRows.map((row) => row.name),
      wargaNegara: wargaNegaraRows.map((row) => row.name),
      golonganDarah: golonganDarahRows.map((row) => row.name),
    },
    keluarga,
    rtm,
    bantuan,
  };
}
