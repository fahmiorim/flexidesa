"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  KELOMPOK_TIPE,
  KELOMPOK_TIPE_LABELS,
  type KategoriKelompokFormInput,
} from "@/features/kelompok/domain/kelompok";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type AksiFormKategori = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

export function FormKategori({
  aksi,
  awal,
}: {
  aksi: AksiFormKategori;
  awal?: KategoriKelompokFormInput;
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
          <span className="form-label">Klasifikasi / Kategori</span>
          <input
            className="form-input"
            defaultValue={awal?.nama ?? ""}
            maxLength={100}
            name="nama"
            placeholder="Nama kategori"
            required
          />
          <GalatField pesan={galat("nama")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tipe</span>
          <select className="form-input" defaultValue={awal?.tipe ?? "kelompok"} name="tipe">
            {KELOMPOK_TIPE.map((tipe) => (
              <option key={tipe} value={tipe}>
                {KELOMPOK_TIPE_LABELS[tipe]}
              </option>
            ))}
          </select>
          <GalatField pesan={galat("tipe")} />
        </label>

        <label className="form-field">
          <span className="form-label">Deskripsi</span>
          <textarea
            className="form-input"
            defaultValue={awal?.deskripsi ?? ""}
            maxLength={500}
            name="deskripsi"
            placeholder="Deskripsi kategori"
            rows={3}
          />
          <GalatField pesan={galat("deskripsi")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        <Link className="button button-secondary" href="/kelompok/kategori">
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : awal === undefined ? "Simpan Kategori" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
