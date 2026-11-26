import {
  BIRTH_ASSISTANT_LABELS,
  BIRTH_ASSISTANTS,
  BIRTH_PLACE_TYPE_LABELS,
  BIRTH_PLACE_TYPES,
  BIRTH_TYPE_LABELS,
  BIRTH_TYPES,
  GENDER_LABELS,
  GENDERS,
  KTP_EL_LABELS,
  KTP_ELS,
  STATUS_REKAM_LABELS,
  STATUS_REKAMS,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { GalatField } from "@/features/multi-desa/presentation/dialog-bagian";

import {
  Bagian,
  OpsiEnum,
  OpsiKatalog,
  OpsiLabel,
  type BagianPendudukProps,
} from "./form-penduduk-bagian";

export function BagianIdentitas({
  penduduk,
  references,
  galat,
  tidakValid,
  familyId,
  sembunyikanKeluarga = false,
}: BagianPendudukProps & { familyId?: number | null; sembunyikanKeluarga?: boolean }) {
  return (
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
  );
}

export function BagianKelahiran({ penduduk, galat, tidakValid }: BagianPendudukProps) {
  return (
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
  );
}
