import {
  ACTIVE_STATUS_LABELS,
  ACTIVE_STATUSES,
  CHRONIC_ILLNESS_LABELS,
  CHRONIC_ILLNESSES,
  DISABILITIES,
  DISABILITY_LABELS,
  INSURANCE_LABELS,
  INSURANCES,
  KB_METHOD_LABELS,
  KB_METHODS,
  LIFE_STATUS_LABELS,
  LIFE_STATUSES,
  LITERACIES,
  LITERACY_LABELS,
  PREGNANCY_STATUS_LABELS,
  PREGNANCY_STATUSES,
  RESIDENCE_STATUS_LABELS,
  RESIDENCE_STATUSES,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { GalatField } from "@/features/multi-desa/presentation/dialog-bagian";

import { Bagian, OpsiEnum, OpsiKatalog, type BagianPendudukProps } from "./form-penduduk-bagian";

export function BagianKesehatan({ penduduk, references, galat, tidakValid }: BagianPendudukProps) {
  return (
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
  );
}

export function BagianLainnya({ penduduk, galat, tidakValid }: BagianPendudukProps) {
  return (
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
  );
}
