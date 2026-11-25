"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  KETERANGAN_ALASAN_MAKS,
  PANJANG_ALASAN_MAKS,
} from "@/features/kehadiran/domain/alasan-keluar";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type AksiSimpanAlasanKeluar = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

/**
 * Form tambah/ubah satu alasan keluar.
 *
 * Field mengikuti formulir OpenSID `kehadiran_alasan_keluar`: alasan (wajib)
 * dan keterangan (opsional, maksimal 300 karakter).
 */
export function FormAlasanKeluar({
  aksi,
  awal,
}: {
  aksi: AksiSimpanAlasanKeluar;
  awal?: { id: number; alasan: string; keterangan: string | null };
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
          <span className="form-label">Alasan</span>
          <input
            className="form-input"
            defaultValue={awal?.alasan ?? ""}
            maxLength={PANJANG_ALASAN_MAKS}
            name="alasan"
            placeholder="Contoh: Keperluan keluarga"
            required
            type="text"
          />
          <GalatField pesan={galat("alasan")} />
        </label>

        <label className="form-field">
          <span className="form-label">Keterangan</span>
          <textarea
            className="form-input"
            defaultValue={awal?.keterangan ?? ""}
            maxLength={KETERANGAN_ALASAN_MAKS}
            name="keterangan"
            placeholder="Keterangan (opsional)"
            rows={3}
          />
          <GalatField pesan={galat("keterangan")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        {awal === undefined ? null : (
          <Link className="button button-secondary" href="/kehadiran/alasan-keluar">
            Batal
          </Link>
        )}
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : awal === undefined ? "Tambah Alasan" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
