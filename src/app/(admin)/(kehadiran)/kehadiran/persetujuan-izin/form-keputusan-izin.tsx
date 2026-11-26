"use client";

import { useActionState } from "react";

import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export type AksiPutuskanIzin = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

/**
 * Form keputusan satu pengajuan izin.
 *
 * Dua tombol mengirim nilai `status` berbeda (Setujui/Tolak), sehingga satu
 * pengajuan cukup diputuskan dengan satu form berisi catatan opsional —
 * setara tombol Setujui/Tolak pada daftar Persetujuan Izin OpenSID.
 */
export function FormKeputusanIzin({ aksi, id }: { aksi: AksiPutuskanIzin; id: number }) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />

      <input name="id" type="hidden" value={id} />

      <label className="form-field">
        <span className="form-label">Catatan Keputusan</span>
        <textarea
          className="form-input"
          name="catatan"
          placeholder="Opsional, misalnya alasan penolakan"
          rows={2}
        />
      </label>

      <div className="penduduk-heading-actions">
        <button
          className="button button-primary"
          disabled={pending}
          name="status"
          type="submit"
          value="disetujui"
        >
          Setujui
        </button>
        <button
          className="button button-danger"
          disabled={pending}
          name="status"
          type="submit"
          value="ditolak"
        >
          Tolak
        </button>
      </div>
    </form>
  );
}
