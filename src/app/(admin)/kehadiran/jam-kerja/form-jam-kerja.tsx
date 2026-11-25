"use client";

import Link from "next/link";
import { useActionState } from "react";

import { KETERANGAN_JAM_KERJA_MAKS, type JamKerjaRow } from "@/features/kehadiran/domain/jam-kerja";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type AksiSimpanJamKerja = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

/**
 * Form ubah jam kerja satu hari.
 *
 * Field mengikuti formulir OpenSID `kehadiran_jam_kerja/form`: jam masuk,
 * jam keluar (tidak boleh lebih kecil dari jam masuk), keterangan opsional
 * maksimal 300 karakter, dan status Hari Kerja/Hari Libur.
 */
export function FormJamKerja({ aksi, awal }: { aksi: AksiSimpanJamKerja; awal: JamKerjaRow }) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const galat = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />

      <input name="id" type="hidden" value={awal.id} />

      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Jam Masuk</span>
          <input
            className="form-input"
            defaultValue={awal.jamMasuk}
            name="jamMasuk"
            required
            type="time"
          />
          <GalatField pesan={galat("jamMasuk")} />
        </label>

        <label className="form-field">
          <span className="form-label">Jam Keluar</span>
          <input
            className="form-input"
            defaultValue={awal.jamKeluar}
            name="jamKeluar"
            required
            type="time"
          />
          <GalatField pesan={galat("jamKeluar")} />
        </label>

        <div className="form-field">
          <span className="form-label" id="status-jam-kerja-label">
            Status
          </span>
          <div
            role="radiogroup"
            aria-labelledby="status-jam-kerja-label"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem 1.25rem",
              alignItems: "center",
            }}
          >
            <label style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
              <input defaultChecked={awal.status} name="status" type="radio" value="1" />
              Hari Kerja
            </label>
            <label style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
              <input defaultChecked={!awal.status} name="status" type="radio" value="0" />
              Hari Libur
            </label>
          </div>
          <GalatField pesan={galat("status")} />
        </div>

        <label className="form-field">
          <span className="form-label">Keterangan</span>
          <textarea
            className="form-input"
            defaultValue={awal.keterangan ?? ""}
            maxLength={KETERANGAN_JAM_KERJA_MAKS}
            name="keterangan"
            placeholder="Keterangan (opsional)"
            rows={3}
          />
          <GalatField pesan={galat("keterangan")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        <Link className="button button-secondary" href="/kehadiran/jam-kerja">
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
