"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type { RumahTanggaFormInput } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";
import type { LabelOption } from "@/lib/forms";

export type AksiFormRumahTangga = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

const KELAS_SOSIAL = [
  { value: 1, label: "Kelas 1 — Pra Sejahtera" },
  { value: 2, label: "Kelas 2 — Sejahtera I" },
  { value: 3, label: "Kelas 3 — Sejahtera II" },
  { value: 4, label: "Kelas 4 — Sejahtera III" },
  { value: 5, label: "Kelas 5 — Sejahtera III Plus" },
] as const;

export function FormRumahTangga({
  aksi,
  awal,
  regions,
  penduduk,
  kembaliHref,
  terdaftarDtks = false,
}: {
  aksi: AksiFormRumahTangga;
  awal?: RumahTanggaFormInput;
  regions: LabelOption[];
  penduduk: LabelOption[];
  kembaliHref: string;
  terdaftarDtks?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const galat = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;
  const nilaiKelas = awal?.kelasSosial ?? "";
  const kelasDiLuarDaftar =
    nilaiKelas !== "" && !KELAS_SOSIAL.some((item) => String(item.value) === String(nilaiKelas));

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />

      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Alamat rumah</span>
          <textarea
            className="form-input"
            defaultValue={awal?.alamat ?? ""}
            maxLength={255}
            name="alamat"
            placeholder="Alamat lengkap rumah tangga"
            rows={3}
          />
          <GalatField pesan={galat("alamat")} />
        </label>

        <label className="form-field">
          <span className="form-label">Dusun / RW / RT</span>
          <select className="form-input" defaultValue={awal?.regionId ?? ""} name="regionId">
            <option value="">Belum ditentukan</option>
            {regions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="form-help">Wilayah domisili rumah tangga.</span>
          <GalatField pesan={galat("regionId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Kelas sosial</span>
          <select className="form-input" defaultValue={nilaiKelas} name="kelasSosial">
            <option value="">Belum ditetapkan</option>
            {kelasDiLuarDaftar ? (
              <option value={String(nilaiKelas)}>Kelas {String(nilaiKelas)}</option>
            ) : null}
            {KELAS_SOSIAL.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="form-help">Boleh dikosongkan bila belum ada data kesejahteraan.</span>
          <GalatField pesan={galat("kelasSosial")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor BDT</span>
          <input
            className="form-input"
            defaultValue={awal?.bdt ?? ""}
            inputMode="numeric"
            maxLength={30}
            name="bdt"
            placeholder="Nomor Basis Data Terpadu"
          />
          <span className="form-help">Opsional, diisi bila rumah tangga terdaftar di BDT.</span>
          <GalatField pesan={galat("bdt")} />
        </label>
      </div>

      <label className="form-field">
        <span className="form-label">
          <input defaultChecked={terdaftarDtks} name="terdaftarDtks" type="checkbox" /> Terdaftar
          DTKS
        </span>
        <span className="form-help">
          Centang untuk membuat formulir DTKS draf bagi rumah tangga ini. Formulir yang sudah
          terverifikasi tidak ikut dihapus bila centang dilepas.
        </span>
      </label>

      {awal === undefined ? (
        <label className="form-field">
          <span className="form-label">Kepala rumah tangga</span>
          <select className="form-input" defaultValue="" name="headResidentId">
            <option value="">Belum dipilih — tambahkan dari halaman detail</option>
            {penduduk.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="form-help">
            Pilih penduduk yang belum terdaftar di rumah tangga lain. Anggota lain dapat ditambahkan
            setelah RTM dibuat.
          </span>
        </label>
      ) : null}

      <div className="penduduk-heading-actions">
        <ButtonLink variant="secondary" href={kembaliHref}>
          Batal
        </ButtonLink>
        <Button variant="primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : awal === undefined ? "Simpan Rumah Tangga" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
