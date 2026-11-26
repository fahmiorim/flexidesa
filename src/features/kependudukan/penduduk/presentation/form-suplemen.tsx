"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  SASARAN_KELUARGA,
  SASARAN_LABELS,
  TIPE_FORM_ISIAN,
  TIPE_FORM_ISIAN_LABELS,
  type SuplemenFormField,
} from "@/features/kependudukan/penduduk/domain/suplemen";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

const PILIHAN_SASARAN = [1, SASARAN_KELUARGA];

const FIELD_BARU: SuplemenFormField = {
  label: "",
  tipe: "text",
  required: false,
  namaKode: "",
  deskripsiKode: "",
  pilihanKode: [],
  referensiKode: "",
  atribut: "",
  kolom: null,
};

export function FormSuplemen({
  aksi,
  awal,
  sasaranTerkunci,
  referensi,
  kembaliHref,
  labelKembali,
}: {
  aksi: (
    state: ActionState<{ id: number }>,
    formData: FormData,
  ) => Promise<ActionState<{ id: number }>>;
  awal: {
    nama: string;
    sasaran: number;
    keterangan: string;
    formIsian: SuplemenFormField[];
  } | null;
  sasaranTerkunci: boolean;
  referensi: string[];
  kembaliHref: string;
  /** Tautan kembali di baris aksi bawah, mis. "← Daftar Data Suplemen". */
  labelKembali?: string;
}) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const [sasaran, setSasaran] = useState(awal?.sasaran ?? 1);
  const [fields, setFields] = useState<SuplemenFormField[]>(awal?.formIsian ?? []);

  const ubahField = (indeks: number, perubahan: Partial<SuplemenFormField>) =>
    setFields((lama) => lama.map((item, i) => (i === indeks ? { ...item, ...perubahan } : item)));

  const tambahField = () => setFields((lama) => [...lama, { ...FIELD_BARU }]);
  const hapusField = (indeks: number) => setFields((lama) => lama.filter((_, i) => i !== indeks));

  const fieldTerpakai = fields
    .filter((field) => field.label.trim() !== "")
    .map((field) => ({
      ...field,
      namaKode: field.namaKode?.trim() || field.label.trim(),
      pilihanKode:
        field.tipe === "select-manual"
          ? (field.pilihanKode ?? []).map((item) => item.trim()).filter(Boolean)
          : [],
      options:
        field.tipe === "select-manual"
          ? (field.pilihanKode ?? []).map((item) => item.trim()).filter(Boolean)
          : undefined,
      referensiKode: field.tipe === "select-otomatis" ? (field.referensiKode ?? "") : "",
    }));

  return (
    <form action={formAction} className="form-stack suplemen-form">
      <input name="dataFormIsian" type="hidden" value={JSON.stringify(fieldTerpakai)} />

      <label className="form-field">
        <span className="form-label">Sasaran Data</span>
        <select
          disabled={sasaranTerkunci}
          name="sasaran"
          onChange={(event) => setSasaran(Number(event.target.value))}
          required
          value={sasaran}
        >
          <option value="">Pilih Sasaran</option>
          {PILIHAN_SASARAN.map((nilai) => (
            <option key={nilai} value={nilai}>
              {SASARAN_LABELS[nilai]}
            </option>
          ))}
        </select>
        {sasaranTerkunci ? (
          <>
            <input name="sasaran" type="hidden" value={sasaran} />
            <small>
              Sasaran tidak dapat diubah karena suplemen ini sudah memiliki data terdata.
            </small>
          </>
        ) : (
          <small>Penduduk mendata per orang; keluarga (KK) mendata per kartu keluarga.</small>
        )}
      </label>

      <label className="form-field">
        <span className="form-label">Nama Data Suplemen</span>
        <input
          defaultValue={awal?.nama ?? ""}
          maxLength={200}
          name="nama"
          placeholder="Nama Data Suplemen"
          required
        />
      </label>

      <label className="form-field">
        <span className="form-label">Keterangan</span>
        <textarea
          defaultValue={awal?.keterangan ?? ""}
          maxLength={300}
          name="keterangan"
          placeholder="Keterangan"
          rows={3}
        />
        <small>Maksimal 300 karakter.</small>
      </label>

      <fieldset className="suplemen-fieldset">
        <legend>Form Isian Tambahan</legend>
        <p className="suplemen-fieldset-note">
          Kolom tambahan yang muncul saat mendata warga pada suplemen ini — setara kode isian
          `form_isian` OpenSID. Kosongkan bila tidak diperlukan.
        </p>

        {fields.length === 0 ? (
          <p className="modul-muted">Belum ada kolom isian tambahan.</p>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table suplemen-field-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Tipe</th>
                  <th>Wajib</th>
                  <th>Pilihan / Referensi</th>
                  <th>Kolom</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, indeks) => (
                  <tr key={`${indeks}-${field.label}`}>
                    <td>
                      <input
                        aria-label={`Label kolom ${indeks + 1}`}
                        onChange={(event) => ubahField(indeks, { label: event.target.value })}
                        placeholder="Masukkan Label"
                        value={field.label}
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Tipe kolom ${indeks + 1}`}
                        onChange={(event) =>
                          ubahField(indeks, {
                            tipe: event.target.value as SuplemenFormField["tipe"],
                          })
                        }
                        value={field.tipe}
                      >
                        {TIPE_FORM_ISIAN.map((tipe) => (
                          <option key={tipe} value={tipe}>
                            {TIPE_FORM_ISIAN_LABELS[tipe]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="suplemen-field-center">
                      <input
                        aria-label={`Wajib diisi kolom ${indeks + 1}`}
                        checked={field.required ?? false}
                        onChange={(event) => ubahField(indeks, { required: event.target.checked })}
                        type="checkbox"
                      />
                    </td>
                    <td>
                      {field.tipe === "select-manual" ? (
                        <input
                          aria-label={`Pilihan kolom ${indeks + 1}`}
                          onChange={(event) =>
                            ubahField(indeks, {
                              pilihanKode: event.target.value.split(",").map((item) => item),
                            })
                          }
                          placeholder="Pisahkan dengan koma"
                          value={(field.pilihanKode ?? []).join(", ")}
                        />
                      ) : field.tipe === "select-otomatis" ? (
                        <select
                          aria-label={`Referensi kolom ${indeks + 1}`}
                          onChange={(event) =>
                            ubahField(indeks, { referensiKode: event.target.value })
                          }
                          value={field.referensiKode ?? ""}
                        >
                          <option value="">Pilih Referensi</option>
                          {referensi.map((nama) => (
                            <option key={nama} value={nama}>
                              {nama}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="modul-muted">—</span>
                      )}
                    </td>
                    <td>
                      <select
                        aria-label={`Lebar kolom ${indeks + 1}`}
                        onChange={(event) =>
                          ubahField(indeks, {
                            kolom: event.target.value === "" ? null : Number(event.target.value),
                          })
                        }
                        value={field.kolom ?? ""}
                      >
                        <option value="">Otomatis</option>
                        {[3, 4, 5, 6, 8, 9, 12].map((nilai) => (
                          <option key={nilai} value={nilai}>
                            col-{nilai}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="button button-danger"
                        onClick={() => hapusField(indeks)}
                        type="button"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button className="button button-secondary" onClick={tambahField} type="button">
          + Tambah Kolom Isian
        </button>
      </fieldset>

      <PesanDialog state={state} />

      <div className="suplemen-form-actions">
        <div className="suplemen-form-actions-kiri">
          {labelKembali ? (
            <Link className="suplemen-kembali-tautan" href={kembaliHref}>
              {labelKembali}
            </Link>
          ) : null}
        </div>
        <div className="suplemen-form-actions-kanan">
          <Link className="button button-secondary" href={kembaliHref}>
            Batal
          </Link>
          <button className="button button-primary" disabled={pending} type="submit">
            {pending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </form>
  );
}
