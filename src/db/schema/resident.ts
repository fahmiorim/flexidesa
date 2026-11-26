import {
  date,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import {
  ACTIVE_STATUSES,
  BIRTH_ASSISTANTS,
  BIRTH_PLACE_TYPES,
  BIRTH_TYPES,
  CHRONIC_ILLNESSES,
  CONTACT_METHODS,
  DISABILITIES,
  GENDERS,
  INSURANCES,
  KB_METHODS,
  KTP_ELS,
  LIFE_STATUSES,
  LITERACIES,
  PREGNANCY_STATUSES,
  RESIDENCE_STATUSES,
  STATUS_REKAMS,
} from "@/features/kependudukan/penduduk/domain/penduduk";

import { families } from "./family";
import {
  bloodTypes,
  citizenships,
  educations,
  familyRelations,
  maritalStatuses,
  occupations,
  religions,
} from "./reference";
import { regions } from "./region";
import { rumahTangga } from "./rumah-tangga";
import { villages } from "./village";

/**
 * `residents` — data penduduk desa.
 *
 * Kolom bertipe teks bebas dibuat *nullable* karena data sering belum lengkap
 * (mis. NIK belum tercatat). NIK unik **per desa** (nama bisa sama); beberapa
 * baris boleh ber-NIK kosong karena indeks unik MySQL mengizinkan banyak NULL.
 *
 * Keanggotaan Kartu Keluarga dinyatakan lewat `family_id`. Domisili di sini
 * adalah domisili terkini penduduk dan boleh berbeda dari domisili pada KK.
 */
export const residents = mysqlTable(
  "residents",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id")
      .notNull()
      .references(() => villages.id, { onDelete: "cascade" }),

    /** Nomor Induk Kependudukan (16 angka). */
    nationalId: varchar("national_id", { length: 16 }),

    name: varchar("name", { length: 100 }).notNull(),
    gender: mysqlEnum("gender", GENDERS).notNull(),

    birthPlace: varchar("birth_place", { length: 100 }),
    birthDate: date("birth_date", { mode: "string" }),

    /* Data identitas & kelahiran (paritas form biodata OpenSID). */
    ktpEl: mysqlEnum("ktp_el", KTP_ELS),
    statusRekam: mysqlEnum("status_rekam", STATUS_REKAMS),
    idCardTag: varchar("id_card_tag", { length: 17 }),
    ktpIssuedPlace: varchar("ktp_issued_place", { length: 150 }),
    ktpIssuedDate: date("ktp_issued_date", { mode: "string" }),
    previousFamilyNumber: varchar("previous_family_number", { length: 30 }),
    arrivalPurpose: text("arrival_purpose"),
    birthTime: varchar("birth_time", { length: 5 }),
    birthPlaceType: mysqlEnum("birth_place_type", BIRTH_PLACE_TYPES),
    birthType: mysqlEnum("birth_type", BIRTH_TYPES),
    birthChildNumber: int("birth_child_number"),
    birthAssistant: mysqlEnum("birth_assistant", BIRTH_ASSISTANTS),
    birthWeightGram: int("birth_weight_gram"),
    birthLengthCm: int("birth_length_cm"),

    familyId: int("family_id"),

    /**
     * Rumah tangga tempat penduduk bernaung.
     *
     * Berbeda dari KK, RTM bersifat **eksklusif**: satu penduduk hanya boleh
     * berada di satu rumah tangga. `rtmLevel` menyimpan perannya
     * (1 = kepala rumah tangga, 2 = anggota; lihat domain rumah-tangga).
     */
    rtmId: int("rtm_id"),
    rtmLevel: int("rtm_level"),

    religionId: int("religion_id").references(() => religions.id, { onDelete: "set null" }),
    educationId: int("education_id").references(() => educations.id, { onDelete: "set null" }),
    /**
     * Pendidikan yang sedang ditempuh (parity `pendidikan_sedang_id`).
     *
     * memakai katalog `educations` yang sama dengan pendidikan terakhir; dipisah
     * agar isian surat/KK dapat membedakan keduanya.
     */
    educationSedangId: int("education_sedang_id").references(() => educations.id, {
      onDelete: "set null",
    }),
    occupationId: int("occupation_id").references(() => occupations.id, { onDelete: "set null" }),
    migrantWorker: varchar("migrant_worker", { length: 100 }),
    maritalStatusId: int("marital_status_id").references(() => maritalStatuses.id, {
      onDelete: "set null",
    }),
    familyRelationId: int("family_relation_id").references(() => familyRelations.id, {
      onDelete: "set null",
    }),
    bloodTypeId: int("blood_type_id").references(() => bloodTypes.id, { onDelete: "set null" }),
    citizenshipId: int("citizenship_id").references(() => citizenships.id, {
      onDelete: "set null",
    }),
    originCountry: varchar("origin_country", { length: 10 }),
    adat: varchar("adat", { length: 150 }),
    marga: varchar("marga", { length: 150 }),

    residenceStatus: mysqlEnum("residence_status", RESIDENCE_STATUSES)
      .notNull()
      .default("permanent"),
    lifeStatus: mysqlEnum("life_status", LIFE_STATUSES).notNull().default("alive"),

    regionId: int("region_id"),
    address: varchar("address", { length: 255 }),
    previousAddress: varchar("previous_address", { length: 200 }),
    currentAddress: varchar("current_address", { length: 200 }),
    /** Koordinat rumah dari peta penduduk; disimpan sebagai teks desimal. */
    latitude: varchar("latitude", { length: 30 }),
    longitude: varchar("longitude", { length: 30 }),

    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 50 }),
    telegram: varchar("telegram", { length: 100 }),
    contactMethod: mysqlEnum("contact_method", CONTACT_METHODS),
    fatherName: varchar("father_name", { length: 100 }),
    motherName: varchar("mother_name", { length: 100 }),
    /** NIK ayah (parity `ayah_nik`), dipakai pada placeholder surat/KK. */
    fatherNationalId: varchar("father_national_id", { length: 16 }),
    /** NIK ibu (parity `ibu_nik`), dipakai pada placeholder surat/KK. */
    motherNationalId: varchar("mother_national_id", { length: 16 }),

    birthCertificateNumber: varchar("birth_certificate_number", { length: 40 }),
    marriageCertificateNumber: varchar("marriage_certificate_number", { length: 40 }),
    marriageDate: date("marriage_date", { mode: "string" }),
    divorceCertificateNumber: varchar("divorce_certificate_number", { length: 40 }),
    divorceDate: date("divorce_date", { mode: "string" }),
    passportNumber: varchar("passport_number", { length: 45 }),
    passportExpiryDate: date("passport_expiry_date", { mode: "string" }),
    kitasNumber: varchar("kitas_number", { length: 45 }),
    ethnicity: varchar("ethnicity", { length: 150 }),

    /* Data kesehatan & literasi. */
    disability: mysqlEnum("disability", DISABILITIES),
    chronicIllness: mysqlEnum("chronic_illness", CHRONIC_ILLNESSES),
    kbMethod: mysqlEnum("kb_method", KB_METHODS),
    pregnancyStatus: mysqlEnum("pregnancy_status", PREGNANCY_STATUSES),
    insurance: mysqlEnum("insurance", INSURANCES),
    insuranceNumber: varchar("insurance_number", { length: 100 }),
    insuranceStatus: mysqlEnum("insurance_status", ACTIVE_STATUSES),
    bpjsEmploymentNumber: varchar("bpjs_employment_number", { length: 100 }),
    literacy: mysqlEnum("literacy", LITERACIES),
    notes: text("notes"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("residents_village_national_id_uq").on(t.villageId, t.nationalId),
    uniqueIndex("residents_village_id_uq").on(t.villageId, t.id),
    foreignKey({
      name: "residents_family_tenant_fk",
      columns: [t.villageId, t.familyId],
      foreignColumns: [families.villageId, families.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "residents_rtm_tenant_fk",
      columns: [t.villageId, t.rtmId],
      foreignColumns: [rumahTangga.villageId, rumahTangga.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "residents_region_tenant_fk",
      columns: [t.villageId, t.regionId],
      foreignColumns: [regions.villageId, regions.id],
    }).onDelete("restrict"),
    index("residents_village_name_idx").on(t.villageId, t.name),
    index("residents_village_family_idx").on(t.villageId, t.familyId),
    index("residents_village_life_status_idx").on(t.villageId, t.lifeStatus),
    index("residents_region_idx").on(t.regionId),
  ],
);
