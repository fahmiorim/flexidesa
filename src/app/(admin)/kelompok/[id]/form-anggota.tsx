"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  JABATAN_KELOMPOK,
  jabatanLabel,
  type AnggotaKelompokFormInput,
} from "@/features/kelompok/domain/kelompok";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";
import type { LabelOption } from "@/lib/forms";

export type AksiFormAnggota = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

export function FormAnggotaKelompok({
  aksi,
  awal,
  penduduk,
  kelompokId,
}: {
  aksi: AksiFormAnggota;
  awal?: AnggotaKelompokFormInput;
  penduduk: LabelOption[];
  kelompokId: number;
}) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const galat = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />

      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Nama Anggota</span>
          <select
            className="form-input"
            defaultValue={awal?.residentId ?? ""}
            disabled={awal !== undefined}
            name="residentId"
            required
          >
            <option value="">— Silakan Masukkan NIK / Nama —</option>
            {penduduk.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="form-help">
            {awal === undefined
              ? "Penduduk yang sudah menjadi anggota kelompok ini tidak ditampilkan."
              : "Anggota tidak dapat diganti; keluarkan dulu bila perlu mengganti orang."}
          </span>
          <GalatField pesan={galat("residentId")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor Anggota</span>
          <input
            className="form-input"
            defaultValue={awal?.nomorAnggota ?? ""}
            maxLength={50}
            name="nomorAnggota"
            placeholder="Nomor anggota"
          />
          <span className="form-help">Pastikan nomor anggota belum pernah dipakai.</span>
          <GalatField pesan={galat("nomorAnggota")} />
        </label>

        <label className="form-field">
          <span className="form-label">Jabatan</span>
          <select className="form-input" defaultValue={awal?.jabatan ?? 90} name="jabatan" required>
            {JABATAN_KELOMPOK.map((jabatan) => (
              <option key={jabatan} value={jabatan}>
                {jabatanLabel(jabatan)}
              </option>
            ))}
          </select>
          <GalatField pesan={galat("jabatan")} />
        </label>

        <label className="form-field">
          <span className="form-label">Nomor SK Jabatan</span>
          <input
            className="form-input"
            defaultValue={awal?.nomorSk ?? ""}
            maxLength={100}
            name="nomorSk"
            placeholder="Nomor SK jabatan"
          />
          <GalatField pesan={galat("nomorSk")} />
        </label>

        <label className="form-field">
          <span className="form-label">Keterangan</span>
          <textarea
            className="form-input"
            defaultValue={awal?.keterangan ?? ""}
            maxLength={300}
            name="keterangan"
            placeholder="Keterangan anggota"
            rows={3}
          />
          <GalatField pesan={galat("keterangan")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        <Link className="button button-secondary" href={`/kelompok/${kelompokId}`}>
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Simpan Anggota"}
        </button>
      </div>
    </form>
  );
}
