"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";

import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import {
  ACTIVE_STATUS_LABELS,
  ACTIVE_STATUSES,
  BIRTH_ASSISTANT_LABELS,
  BIRTH_ASSISTANTS,
  BIRTH_PLACE_TYPE_LABELS,
  BIRTH_PLACE_TYPES,
  BIRTH_TYPE_LABELS,
  BIRTH_TYPES,
  CHRONIC_ILLNESS_LABELS,
  CHRONIC_ILLNESSES,
  CONTACT_METHOD_LABELS,
  CONTACT_METHODS,
  DISABILITIES,
  DISABILITY_LABELS,
  GENDER_LABELS,
  GENDERS,
  INSURANCE_LABELS,
  INSURANCES,
  KB_METHOD_LABELS,
  KB_METHODS,
  KTP_EL_LABELS,
  KTP_ELS,
  LIFE_STATUS_LABELS,
  LIFE_STATUSES,
  LITERACIES,
  LITERACY_LABELS,
  PREGNANCY_STATUS_LABELS,
  PREGNANCY_STATUSES,
  RESIDENCE_STATUS_LABELS,
  RESIDENCE_STATUSES,
  STATUS_REKAM_LABELS,
  STATUS_REKAMS,
  type PendudukDTO,
  type PendudukReferenceData,
  type ReferenceOption,
} from "@/features/penduduk/domain/penduduk";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type AksiFormPenduduk = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

interface Props {
  aksi: AksiFormPenduduk;
  references: PendudukReferenceData;
  /** Diisi pada mode ubah; `undefined` pada mode tambah. */
  penduduk?: PendudukDTO;
  familyId?: number | null;
  /** Section tambahan di atas identitas, mis. data KK pada form gabungan. */
  children?: ReactNode;
  /** Sembunyikan pilihan KK/hubungan karena diatur oleh alur gabungan. */
  sembunyikanKeluarga?: boolean;
  /** Awalan tujuan setelah simpan, mis. "/keluarga" atau "/penduduk". */
  redirectPrefix?: string;
  kembaliHref?: string;
  labelSimpan?: string;
}

function OpsiKatalog({ options }: { options: ReferenceOption[] }) {
  return (
    <>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </>
  );
}

function OpsiLabel({ options }: { options: PendudukReferenceData["families"] }) {
  return (
    <>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </>
  );
}

function OpsiEnum<T extends string>({
  values,
  labels,
}: {
  values: readonly T[];
  labels: Readonly<Record<T, string>>;
}) {
  return (
    <>
      {values.map((value) => (
        <option key={value} value={value}>
          {labels[value]}
        </option>
      ))}
    </>
  );
}

function Bagian({
  nomor,
  id,
  judul,
  keterangan,
  children,
}: {
  nomor: string;
  id: string;
  judul: string;
  keterangan: string;
  children: ReactNode;
}) {
  return (
    <section className="platform-card penduduk-form-card" id={id}>
      <header className="penduduk-form-section-head">
        <span aria-hidden="true" className="penduduk-form-step">
          {nomor}
        </span>
        <div>
          <h2>{judul}</h2>
          <p>{keterangan}</p>
        </div>
      </header>
      <div className="platform-card-body">
        <div className="platform-form-grid">{children}</div>
      </div>
    </section>
  );
}

const NAVIGASI = [
  { id: "identitas", label: "Identitas" },
  { id: "kelahiran", label: "Kelahiran" },
  { id: "pendidikan", label: "Pendidikan & pekerjaan" },
  { id: "kewarganegaraan", label: "Kewarganegaraan" },
  { id: "alamat", label: "Alamat & kontak" },
  { id: "orang-tua", label: "Orang tua" },
  { id: "perkawinan", label: "Perkawinan" },
  { id: "kesehatan", label: "Kesehatan" },
  { id: "lainnya", label: "Lainnya" },
] as const;

/**
 * Form tambah dan ubah penduduk.
 *
 * Satu komponen dipakai untuk kedua mode agar aturan field tidak bercabang.
 * Susunan bagian mengikuti kelompok data biodata OpenSID; validasi tetap
 * dijalankan ulang di Server Action, atribut HTML hanya membantu pengguna.
 */
export function FormPenduduk({
  aksi,
  references,
  penduduk,
  familyId,
  children,
  sembunyikanKeluarga = false,
  redirectPrefix = "/penduduk",
  kembaliHref,
  labelSimpan,
}: Props) {
  const router = useRouter();
  const ubah = penduduk !== undefined;
  const kembali = kembaliHref ?? (ubah ? `/penduduk/${penduduk.id}` : "/penduduk");
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const galat = (name: string): string | undefined => fieldErrors[name]?.[0];
  const tidakValid = (name: string): boolean => galat(name) !== undefined;

  useEffect(() => {
    if (state.status !== "success") return;
    router.push(`${redirectPrefix}/${state.data.id}`);
  }, [state, router, redirectPrefix]);

  return (
    <form action={formAction} className="form-stack penduduk-form">
      {ubah ? <input name="id" type="hidden" value={penduduk.id} /> : null}
      {children}

      <nav aria-label="Bagian formulir" className="penduduk-form-nav">
        {NAVIGASI.map((item) => (
          <a href={`#${item.id}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>

      <Bagian
        id="identitas"
        keterangan="Data pokok kependudukan, kepemilikan identitas, dan Kartu Keluarga."
        judul="Identitas Penduduk"
        nomor="01"
      >
        <label className="form-field">
          <span className="form-label">NIK (opsional)</span>
          <input
            aria-invalid={tidakValid("nationalId")}
            autoComplete="off"
            className="form-input"
            defaultValue={penduduk?.nationalId ?? ""}
            inputMode="numeric"
            maxLength={16}
            name="nationalId"
            pattern="[0-9]{16}"
          />
          <span className="form-help">16 angka. Kosongkan bila belum tersedia.</span>
          <GalatField pesan={galat("nationalId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nama lengkap</span>
          <input
            aria-invalid={tidakValid("name")}
            className="form-input"
            defaultValue={penduduk?.name ?? ""}
            maxLength={100}
            name="name"
            required
          />
          <span className="form-help">Tanpa gelar, sesuai dokumen kependudukan.</span>
          <GalatField pesan={galat("name")} />
        </label>

        <label className="form-field">
          <span className="form-label">Jenis kelamin</span>
          <select
            aria-invalid={tidakValid("gender")}
            className="form-input"
            defaultValue={penduduk?.gender ?? ""}
            name="gender"
            required
          >
            <option disabled value="">
              Pilih jenis kelamin
            </option>
            <OpsiEnum labels={GENDER_LABELS} values={GENDERS} />
          </select>
          <GalatField pesan={galat("gender")} />
        </label>

        {sembunyikanKeluarga ? null : (
          <>
            <label className="form-field">
              <span className="form-label">Hubungan dalam keluarga</span>
              <select
                aria-invalid={tidakValid("familyRelationId")}
                className="form-input"
                defaultValue={penduduk?.familyRelationId ?? ""}
                name="familyRelationId"
              >
                <option value="">Tidak diisi</option>
                <OpsiKatalog options={references.familyRelations} />
              </select>
              <GalatField pesan={galat("familyRelationId")} />
            </label>

            <label className="form-field">
              <span className="form-label">Kartu Keluarga</span>
              <select
                aria-invalid={tidakValid("familyId")}
                className="form-input"
                defaultValue={penduduk?.familyId ?? familyId ?? ""}
                name="familyId"
              >
                <option value="">Tidak ditautkan</option>
                <OpsiLabel options={references.families} />
              </select>
              <GalatField pesan={galat("familyId")} />
            </label>
          </>
        )}

        <label className="form-field">
          <span className="form-label">Nomor KK sebelumnya</span>
          <input
            aria-invalid={tidakValid("previousFamilyNumber")}
            className="form-input"
            defaultValue={penduduk?.previousFamilyNumber ?? ""}
            maxLength={30}
            name="previousFamilyNumber"
            placeholder="Nomor KK sebelum pindah"
          />
          <GalatField pesan={galat("previousFamilyNumber")} />
        </label>

        <label className="form-field">
          <span className="form-label">Status kepemilikan identitas</span>
          <select
            aria-invalid={tidakValid("ktpEl")}
            className="form-input"
            defaultValue={penduduk?.ktpEl ?? ""}
            name="ktpEl"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={KTP_EL_LABELS} values={KTP_ELS} />
          </select>
          <GalatField pesan={galat("ktpEl")} />
        </label>

        <label className="form-field">
          <span className="form-label">Status rekam KTP</span>
          <select
            aria-invalid={tidakValid("statusRekam")}
            className="form-input"
            defaultValue={penduduk?.statusRekam ?? ""}
            name="statusRekam"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={STATUS_REKAM_LABELS} values={STATUS_REKAMS} />
          </select>
          <GalatField pesan={galat("statusRekam")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tag ID Card</span>
          <input
            aria-invalid={tidakValid("idCardTag")}
            className="form-input"
            defaultValue={penduduk?.idCardTag ?? ""}
            inputMode="numeric"
            maxLength={17}
            minLength={10}
            name="idCardTag"
            pattern="[0-9]{10,17}"
            placeholder="10–17 angka"
          />
          <GalatField pesan={galat("idCardTag")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tempat penerbitan KTP</span>
          <input
            aria-invalid={tidakValid("ktpIssuedPlace")}
            className="form-input"
            defaultValue={penduduk?.ktpIssuedPlace ?? ""}
            maxLength={150}
            name="ktpIssuedPlace"
          />
          <GalatField pesan={galat("ktpIssuedPlace")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tanggal penerbitan KTP</span>
          <input
            aria-invalid={tidakValid("ktpIssuedDate")}
            className="form-input"
            defaultValue={penduduk?.ktpIssuedDate ?? ""}
            name="ktpIssuedDate"
            type="date"
          />
          <GalatField pesan={galat("ktpIssuedDate")} />
        </label>
      </Bagian>

      <Bagian
        id="kelahiran"
        keterangan="Detail kelahiran, termasuk data yang dipakai pada akta dan laporan kelahiran."
        judul="Data Kelahiran"
        nomor="02"
      >
        <label className="form-field">
          <span className="form-label">Tempat lahir</span>
          <input
            aria-invalid={tidakValid("birthPlace")}
            className="form-input"
            defaultValue={penduduk?.birthPlace ?? ""}
            maxLength={100}
            name="birthPlace"
          />
          <GalatField pesan={galat("birthPlace")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tanggal lahir</span>
          <input
            aria-invalid={tidakValid("birthDate")}
            className="form-input"
            defaultValue={penduduk?.birthDate ?? ""}
            name="birthDate"
            type="date"
          />
          <GalatField pesan={galat("birthDate")} />
        </label>

        <label className="form-field">
          <span className="form-label">Waktu lahir</span>
          <input
            aria-invalid={tidakValid("birthTime")}
            className="form-input"
            defaultValue={penduduk?.birthTime ?? ""}
            name="birthTime"
            type="time"
          />
          <GalatField pesan={galat("birthTime")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tempat dilahirkan</span>
          <select
            aria-invalid={tidakValid("birthPlaceType")}
            className="form-input"
            defaultValue={penduduk?.birthPlaceType ?? ""}
            name="birthPlaceType"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={BIRTH_PLACE_TYPE_LABELS} values={BIRTH_PLACE_TYPES} />
          </select>
          <GalatField pesan={galat("birthPlaceType")} />
        </label>

        <label className="form-field">
          <span className="form-label">Jenis kelahiran</span>
          <select
            aria-invalid={tidakValid("birthType")}
            className="form-input"
            defaultValue={penduduk?.birthType ?? ""}
            name="birthType"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={BIRTH_TYPE_LABELS} values={BIRTH_TYPES} />
          </select>
          <GalatField pesan={galat("birthType")} />
        </label>

        <label className="form-field">
          <span className="form-label">Anak ke-</span>
          <input
            aria-invalid={tidakValid("birthChildNumber")}
            className="form-input"
            defaultValue={penduduk?.birthChildNumber ?? ""}
            max={20}
            min={1}
            name="birthChildNumber"
            type="number"
          />
          <GalatField pesan={galat("birthChildNumber")} />
        </label>

        <label className="form-field">
          <span className="form-label">Penolong kelahiran</span>
          <select
            aria-invalid={tidakValid("birthAssistant")}
            className="form-input"
            defaultValue={penduduk?.birthAssistant ?? ""}
            name="birthAssistant"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={BIRTH_ASSISTANT_LABELS} values={BIRTH_ASSISTANTS} />
          </select>
          <GalatField pesan={galat("birthAssistant")} />
        </label>

        <label className="form-field">
          <span className="form-label">Berat lahir (gram)</span>
          <input
            aria-invalid={tidakValid("birthWeightGram")}
            className="form-input"
            defaultValue={penduduk?.birthWeightGram ?? ""}
            max={999999}
            min={1}
            name="birthWeightGram"
            type="number"
          />
          <GalatField pesan={galat("birthWeightGram")} />
        </label>

        <label className="form-field">
          <span className="form-label">Panjang lahir (cm)</span>
          <input
            aria-invalid={tidakValid("birthLengthCm")}
            className="form-input"
            defaultValue={penduduk?.birthLengthCm ?? ""}
            max={999}
            min={1}
            name="birthLengthCm"
            type="number"
          />
          <GalatField pesan={galat("birthLengthCm")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor akta kelahiran</span>
          <input
            className="form-input"
            defaultValue={penduduk?.birthCertificateNumber ?? ""}
            maxLength={40}
            name="birthCertificateNumber"
          />
          <GalatField pesan={galat("birthCertificateNumber")} />
        </label>
      </Bagian>

      <Bagian
        id="pendidikan"
        keterangan="Pendidikan, pekerjaan, perkawinan, dan data kesukuan penduduk."
        judul="Pendidikan, Pekerjaan & Kesukuan"
        nomor="03"
      >
        <label className="form-field">
          <span className="form-label">Pendidikan terakhir</span>
          <select
            aria-invalid={tidakValid("educationId")}
            className="form-input"
            defaultValue={penduduk?.educationId ?? ""}
            name="educationId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.educations} />
          </select>
          <GalatField pesan={galat("educationId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Pendidikan sedang ditempuh</span>
          <select
            aria-invalid={tidakValid("educationSedangId")}
            className="form-input"
            defaultValue={penduduk?.educationSedangId ?? ""}
            name="educationSedangId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.educations} />
          </select>
          <GalatField pesan={galat("educationSedangId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Pekerjaan</span>
          <select
            aria-invalid={tidakValid("occupationId")}
            className="form-input"
            defaultValue={penduduk?.occupationId ?? ""}
            name="occupationId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.occupations} />
          </select>
          <GalatField pesan={galat("occupationId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Pekerja migran</span>
          <input
            aria-invalid={tidakValid("migrantWorker")}
            className="form-input"
            defaultValue={penduduk?.migrantWorker ?? ""}
            maxLength={100}
            name="migrantWorker"
            placeholder="Negara/daerah penempatan, atau Bukan Pekerja Migran"
          />
          <GalatField pesan={galat("migrantWorker")} />
        </label>

        <label className="form-field">
          <span className="form-label">Status perkawinan</span>
          <select
            aria-invalid={tidakValid("maritalStatusId")}
            className="form-input"
            defaultValue={penduduk?.maritalStatusId ?? ""}
            name="maritalStatusId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.maritalStatuses} />
          </select>
          <GalatField pesan={galat("maritalStatusId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Agama</span>
          <select
            aria-invalid={tidakValid("religionId")}
            className="form-input"
            defaultValue={penduduk?.religionId ?? ""}
            name="religionId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.religions} />
          </select>
          <GalatField pesan={galat("religionId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Wilayah adat</span>
          <input
            aria-invalid={tidakValid("adat")}
            className="form-input"
            defaultValue={penduduk?.adat ?? ""}
            maxLength={150}
            name="adat"
          />
          <GalatField pesan={galat("adat")} />
        </label>

        <label className="form-field">
          <span className="form-label">Suku/etnis</span>
          <input
            aria-invalid={tidakValid("ethnicity")}
            className="form-input"
            defaultValue={penduduk?.ethnicity ?? ""}
            maxLength={150}
            name="ethnicity"
          />
          <GalatField pesan={galat("ethnicity")} />
        </label>

        <label className="form-field">
          <span className="form-label">Marga</span>
          <input
            aria-invalid={tidakValid("marga")}
            className="form-input"
            defaultValue={penduduk?.marga ?? ""}
            maxLength={150}
            name="marga"
          />
          <GalatField pesan={galat("marga")} />
        </label>
      </Bagian>

      <Bagian
        id="kewarganegaraan"
        keterangan="Status kewarganegaraan dan dokumen perjalanan atau izin tinggal."
        judul="Kewarganegaraan & Dokumen"
        nomor="04"
      >
        <label className="form-field">
          <span className="form-label">Kewarganegaraan</span>
          <select
            aria-invalid={tidakValid("citizenshipId")}
            className="form-input"
            defaultValue={penduduk?.citizenshipId ?? ""}
            name="citizenshipId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.citizenships} />
          </select>
          <GalatField pesan={galat("citizenshipId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Negara asal</span>
          <input
            aria-invalid={tidakValid("originCountry")}
            className="form-input"
            defaultValue={penduduk?.originCountry ?? ""}
            maxLength={10}
            name="originCountry"
          />
          <GalatField pesan={galat("originCountry")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor paspor</span>
          <input
            className="form-input"
            defaultValue={penduduk?.passportNumber ?? ""}
            maxLength={45}
            name="passportNumber"
          />
          <GalatField pesan={galat("passportNumber")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tanggal akhir paspor</span>
          <input
            className="form-input"
            defaultValue={penduduk?.passportExpiryDate ?? ""}
            name="passportExpiryDate"
            type="date"
          />
          <GalatField pesan={galat("passportExpiryDate")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor KITAS/KITAP</span>
          <input
            className="form-input"
            defaultValue={penduduk?.kitasNumber ?? ""}
            maxLength={45}
            name="kitasNumber"
          />
          <GalatField pesan={galat("kitasNumber")} />
        </label>
      </Bagian>

      <Bagian
        id="alamat"
        keterangan="Domisili, riwayat alamat, dan kanal kontak yang dapat dihubungi."
        judul="Alamat & Kontak"
        nomor="05"
      >
        <label className="form-field">
          <span className="form-label">Wilayah</span>
          <select
            aria-invalid={tidakValid("regionId")}
            className="form-input"
            defaultValue={penduduk?.regionId ?? ""}
            name="regionId"
          >
            <option value="">Tidak diisi</option>
            <OpsiLabel options={references.regions} />
          </select>
          <GalatField pesan={galat("regionId")} />
        </label>

        <label className="form-field penduduk-form-wide">
          <span className="form-label">Alamat KK</span>
          <input
            aria-invalid={tidakValid("address")}
            className="form-input"
            defaultValue={penduduk?.address ?? ""}
            maxLength={255}
            name="address"
          />
          <GalatField pesan={galat("address")} />
        </label>

        <label className="form-field">
          <span className="form-label">Alamat sebelumnya</span>
          <input
            aria-invalid={tidakValid("previousAddress")}
            className="form-input"
            defaultValue={penduduk?.previousAddress ?? ""}
            maxLength={200}
            name="previousAddress"
          />
          <GalatField pesan={galat("previousAddress")} />
        </label>

        <label className="form-field">
          <span className="form-label">Alamat sekarang</span>
          <input
            aria-invalid={tidakValid("currentAddress")}
            className="form-input"
            defaultValue={penduduk?.currentAddress ?? ""}
            maxLength={200}
            name="currentAddress"
          />
          <GalatField pesan={galat("currentAddress")} />
        </label>

        <label className="form-field">
          <span className="form-label">Latitude</span>
          <input
            aria-invalid={tidakValid("latitude")}
            className="form-input"
            defaultValue={penduduk?.latitude ?? ""}
            inputMode="decimal"
            maxLength={30}
            name="latitude"
            placeholder="mis. -6.200000"
          />
          <GalatField pesan={galat("latitude")} />
        </label>

        <label className="form-field">
          <span className="form-label">Longitude</span>
          <input
            aria-invalid={tidakValid("longitude")}
            className="form-input"
            defaultValue={penduduk?.longitude ?? ""}
            inputMode="decimal"
            maxLength={30}
            name="longitude"
            placeholder="mis. 106.816666"
          />
          <GalatField pesan={galat("longitude")} />
        </label>

        <label className="form-field">
          <span className="form-label">Telepon</span>
          <input
            aria-invalid={tidakValid("phone")}
            className="form-input"
            defaultValue={penduduk?.phone ?? ""}
            maxLength={30}
            name="phone"
            type="tel"
          />
          <GalatField pesan={galat("phone")} />
        </label>

        <label className="form-field">
          <span className="form-label">Email</span>
          <input
            aria-invalid={tidakValid("email")}
            autoComplete="email"
            className="form-input"
            defaultValue={penduduk?.email ?? ""}
            maxLength={50}
            name="email"
            type="email"
          />
          <GalatField pesan={galat("email")} />
        </label>

        <label className="form-field">
          <span className="form-label">Telegram</span>
          <input
            aria-invalid={tidakValid("telegram")}
            className="form-input"
            defaultValue={penduduk?.telegram ?? ""}
            maxLength={100}
            name="telegram"
            placeholder="Akun Telegram"
          />
          <GalatField pesan={galat("telegram")} />
        </label>

        <label className="form-field">
          <span className="form-label">Cara hubung warga</span>
          <select
            aria-invalid={tidakValid("contactMethod")}
            className="form-input"
            defaultValue={penduduk?.contactMethod ?? ""}
            name="contactMethod"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={CONTACT_METHOD_LABELS} values={CONTACT_METHODS} />
          </select>
          <GalatField pesan={galat("contactMethod")} />
        </label>

        <label className="form-field penduduk-form-wide">
          <span className="form-label">Maksud dan tujuan kedatangan</span>
          <textarea
            aria-invalid={tidakValid("arrivalPurpose")}
            className="form-input"
            defaultValue={penduduk?.arrivalPurpose ?? ""}
            maxLength={500}
            name="arrivalPurpose"
            rows={2}
          />
          <span className="form-help">Untuk penduduk tidak tetap; boleh dikosongkan.</span>
          <GalatField pesan={galat("arrivalPurpose")} />
        </label>
      </Bagian>

      <Bagian
        id="orang-tua"
        keterangan="Nama dan NIK orang tua sebagaimana tercatat pada dokumen kependudukan."
        judul="Data Orang Tua"
        nomor="06"
      >
        <label className="form-field">
          <span className="form-label">Nama ayah</span>
          <input
            aria-invalid={tidakValid("fatherName")}
            className="form-input"
            defaultValue={penduduk?.fatherName ?? ""}
            maxLength={100}
            name="fatherName"
          />
          <GalatField pesan={galat("fatherName")} />
        </label>

        <label className="form-field">
          <span className="form-label">NIK ayah (opsional)</span>
          <input
            aria-invalid={tidakValid("fatherNationalId")}
            autoComplete="off"
            className="form-input"
            defaultValue={penduduk?.fatherNationalId ?? ""}
            inputMode="numeric"
            maxLength={16}
            name="fatherNationalId"
            pattern="[0-9]{16}"
          />
          <GalatField pesan={galat("fatherNationalId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nama ibu</span>
          <input
            aria-invalid={tidakValid("motherName")}
            className="form-input"
            defaultValue={penduduk?.motherName ?? ""}
            maxLength={100}
            name="motherName"
          />
          <GalatField pesan={galat("motherName")} />
        </label>

        <label className="form-field">
          <span className="form-label">NIK ibu (opsional)</span>
          <input
            aria-invalid={tidakValid("motherNationalId")}
            autoComplete="off"
            className="form-input"
            defaultValue={penduduk?.motherNationalId ?? ""}
            inputMode="numeric"
            maxLength={16}
            name="motherNationalId"
            pattern="[0-9]{16}"
          />
          <GalatField pesan={galat("motherNationalId")} />
        </label>
      </Bagian>

      <Bagian
        id="perkawinan"
        keterangan="Dokumen dan tanggal perkawinan atau perceraian yang tercatat."
        judul="Data Perkawinan"
        nomor="07"
      >
        <label className="form-field">
          <span className="form-label">Nomor akta kawin</span>
          <input
            className="form-input"
            defaultValue={penduduk?.marriageCertificateNumber ?? ""}
            maxLength={40}
            name="marriageCertificateNumber"
          />
          <GalatField pesan={galat("marriageCertificateNumber")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tanggal perkawinan</span>
          <input
            className="form-input"
            defaultValue={penduduk?.marriageDate ?? ""}
            name="marriageDate"
            type="date"
          />
          <GalatField pesan={galat("marriageDate")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor akta cerai</span>
          <input
            className="form-input"
            defaultValue={penduduk?.divorceCertificateNumber ?? ""}
            maxLength={40}
            name="divorceCertificateNumber"
          />
          <GalatField pesan={galat("divorceCertificateNumber")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tanggal perceraian</span>
          <input
            className="form-input"
            defaultValue={penduduk?.divorceDate ?? ""}
            name="divorceDate"
            type="date"
          />
          <GalatField pesan={galat("divorceDate")} />
        </label>
      </Bagian>

      <Bagian
        id="kesehatan"
        keterangan="Golongan darah, kondisi kesehatan, program KB, dan kepesertaan asuransi."
        judul="Kesehatan & Asuransi"
        nomor="08"
      >
        <label className="form-field">
          <span className="form-label">Golongan darah</span>
          <select
            aria-invalid={tidakValid("bloodTypeId")}
            className="form-input"
            defaultValue={penduduk?.bloodTypeId ?? ""}
            name="bloodTypeId"
          >
            <option value="">Tidak diisi</option>
            <OpsiKatalog options={references.bloodTypes} />
          </select>
          <GalatField pesan={galat("bloodTypeId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Disabilitas</span>
          <select
            aria-invalid={tidakValid("disability")}
            className="form-input"
            defaultValue={penduduk?.disability ?? ""}
            name="disability"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={DISABILITY_LABELS} values={DISABILITIES} />
          </select>
          <GalatField pesan={galat("disability")} />
        </label>

        <label className="form-field">
          <span className="form-label">Sakit menahun</span>
          <select
            aria-invalid={tidakValid("chronicIllness")}
            className="form-input"
            defaultValue={penduduk?.chronicIllness ?? ""}
            name="chronicIllness"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={CHRONIC_ILLNESS_LABELS} values={CHRONIC_ILLNESSES} />
          </select>
          <GalatField pesan={galat("chronicIllness")} />
        </label>

        <label className="form-field">
          <span className="form-label">Akseptor KB</span>
          <select
            aria-invalid={tidakValid("kbMethod")}
            className="form-input"
            defaultValue={penduduk?.kbMethod ?? ""}
            name="kbMethod"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={KB_METHOD_LABELS} values={KB_METHODS} />
          </select>
          <GalatField pesan={galat("kbMethod")} />
        </label>

        <label className="form-field">
          <span className="form-label">Status kehamilan</span>
          <select
            aria-invalid={tidakValid("pregnancyStatus")}
            className="form-input"
            defaultValue={penduduk?.pregnancyStatus ?? ""}
            name="pregnancyStatus"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={PREGNANCY_STATUS_LABELS} values={PREGNANCY_STATUSES} />
          </select>
          <GalatField pesan={galat("pregnancyStatus")} />
        </label>

        <label className="form-field">
          <span className="form-label">Asuransi kesehatan</span>
          <select
            aria-invalid={tidakValid("insurance")}
            className="form-input"
            defaultValue={penduduk?.insurance ?? ""}
            name="insurance"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={INSURANCE_LABELS} values={INSURANCES} />
          </select>
          <GalatField pesan={galat("insurance")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor asuransi</span>
          <input
            aria-invalid={tidakValid("insuranceNumber")}
            className="form-input"
            defaultValue={penduduk?.insuranceNumber ?? ""}
            maxLength={100}
            name="insuranceNumber"
          />
          <GalatField pesan={galat("insuranceNumber")} />
        </label>

        <label className="form-field">
          <span className="form-label">Status kepesertaan asuransi</span>
          <select
            aria-invalid={tidakValid("insuranceStatus")}
            className="form-input"
            defaultValue={penduduk?.insuranceStatus ?? ""}
            name="insuranceStatus"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={ACTIVE_STATUS_LABELS} values={ACTIVE_STATUSES} />
          </select>
          <GalatField pesan={galat("insuranceStatus")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor BPJS Ketenagakerjaan</span>
          <input
            aria-invalid={tidakValid("bpjsEmploymentNumber")}
            className="form-input"
            defaultValue={penduduk?.bpjsEmploymentNumber ?? ""}
            maxLength={100}
            name="bpjsEmploymentNumber"
          />
          <GalatField pesan={galat("bpjsEmploymentNumber")} />
        </label>
      </Bagian>

      <Bagian
        id="lainnya"
        keterangan="Status kependudukan, kemampuan membaca huruf, dan catatan tambahan."
        judul="Status & Data Lainnya"
        nomor="09"
      >
        <label className="form-field">
          <span className="form-label">Status tempat tinggal</span>
          <select
            aria-invalid={tidakValid("residenceStatus")}
            className="form-input"
            defaultValue={penduduk?.residenceStatus ?? "permanent"}
            name="residenceStatus"
            required
          >
            <OpsiEnum labels={RESIDENCE_STATUS_LABELS} values={RESIDENCE_STATUSES} />
          </select>
          <GalatField pesan={galat("residenceStatus")} />
        </label>

        <label className="form-field">
          <span className="form-label">Status kependudukan</span>
          <select
            aria-invalid={tidakValid("lifeStatus")}
            className="form-input"
            defaultValue={penduduk?.lifeStatus ?? "alive"}
            name="lifeStatus"
            required
          >
            <OpsiEnum labels={LIFE_STATUS_LABELS} values={LIFE_STATUSES} />
          </select>
          <GalatField pesan={galat("lifeStatus")} />
        </label>

        <label className="form-field">
          <span className="form-label">Dapat membaca huruf</span>
          <select
            aria-invalid={tidakValid("literacy")}
            className="form-input"
            defaultValue={penduduk?.literacy ?? ""}
            name="literacy"
          >
            <option value="">Tidak diisi</option>
            <OpsiEnum labels={LITERACY_LABELS} values={LITERACIES} />
          </select>
          <GalatField pesan={galat("literacy")} />
        </label>

        <label className="form-field penduduk-form-wide">
          <span className="form-label">Keterangan</span>
          <textarea
            className="form-input"
            defaultValue={penduduk?.notes ?? ""}
            maxLength={255}
            name="notes"
            rows={3}
          />
          <GalatField pesan={galat("notes")} />
        </label>
      </Bagian>

      <PesanDialog state={state} />

      <div className="penduduk-form-actions">
        <span className="penduduk-form-actions-note">
          {ubah
            ? "Periksa kembali perubahan sebelum menyimpan."
            : "Field bertanda wajib harus diisi."}
        </span>
        <div className="penduduk-form-actions-buttons">
          <Link className="button button-secondary" href={kembali}>
            Batal
          </Link>
          <button className="button button-primary" disabled={pending} type="submit">
            {pending
              ? "Menyimpan..."
              : (labelSimpan ?? (ubah ? "Simpan Perubahan" : "Simpan Penduduk"))}
          </button>
        </div>
      </div>
    </form>
  );
}
