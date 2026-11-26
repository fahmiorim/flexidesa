import {
  CONTACT_METHOD_LABELS,
  CONTACT_METHODS,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { GalatField } from "@/features/multi-desa/presentation/dialog-bagian";

import {
  Bagian,
  OpsiEnum,
  OpsiKatalog,
  OpsiLabel,
  type BagianPendudukProps,
} from "./form-penduduk-bagian";

export function BagianPendidikan({ penduduk, references, galat, tidakValid }: BagianPendudukProps) {
  return (
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
  );
}

export function BagianKewarganegaraan({
  penduduk,
  references,
  galat,
  tidakValid,
}: BagianPendudukProps) {
  return (
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
  );
}

export function BagianAlamatKontak({
  penduduk,
  references,
  galat,
  tidakValid,
}: BagianPendudukProps) {
  return (
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
  );
}

export function BagianOrangTua({ penduduk, galat, tidakValid }: BagianPendudukProps) {
  return (
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
  );
}

export function BagianPerkawinan({ penduduk, galat }: BagianPendudukProps) {
  return (
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
  );
}
