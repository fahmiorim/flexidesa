"use client";

import Link from "next/link";
import { useActionState } from "react";

import { KETERANGAN_HARI_LIBUR_MAKS } from "@/features/kehadiran/domain/hari-libur";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type AksiSimpanHariLibur = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

/**
 * Form tambah/ubah satu hari libur.
 *
 * Field mengikuti formulir OpenSID `kehadiran_hari_libur`: tanggal dan
 * keterangan (wajib, maksimal 300 karakter).
 */
export function FormHariLibur({
  aksi,
  awal,
}: {
  aksi: AksiSimpanHariLibur;
  awal?: { id: number; tanggal: string; keterangan: string | null };
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

      <input name="id" type="hidden" value={awal?.id ?? ""} />

      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Tanggal</span>
          <input
            className="form-input"
            defaultValue={awal?.tanggal ?? ""}
            name="tanggal"
            required
            type="date"
          />
          <GalatField pesan={galat("tanggal")} />
        </label>

        <label className="form-field">
          <span className="form-label">Keterangan</span>
          <textarea
            className="form-input"
            defaultValue={awal?.keterangan ?? ""}
            maxLength={KETERANGAN_HARI_LIBUR_MAKS}
            name="keterangan"
            placeholder="Contoh: Tahun Baru Masehi"
            required
            rows={3}
          />
          <GalatField pesan={galat("keterangan")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        {awal === undefined ? null : (
          <Link className="button button-secondary" href="/kehadiran/hari-libur">
            Batal
          </Link>
        )}
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : awal === undefined ? "Tambah Hari Libur" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
