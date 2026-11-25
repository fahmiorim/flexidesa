"use client";

import { useActionState } from "react";

import { imporRumahTanggaAction } from "@/features/rumah-tangga/application/rumah-tangga-import-use-cases";
import { createIdleActionState } from "@/lib/action-state";

export function FormImporRtm() {
  const [state, formAction, pending] = useActionState(
    imporRumahTanggaAction,
    createIdleActionState<{ dihubungkan: number }>(),
  );

  return (
    <form action={formAction} className="form-stack">
      <label className="form-field">
        <span className="form-label">Berkas (.xlsx / .csv)</span>
        <input accept=".xlsx,.csv,.txt" className="form-input" name="berkas" required type="file" />
        <span className="form-help">
          Baris pertama berisi header: NIK, No. RTM, Level. Unduh template bila belum memiliki
          berkas.
        </span>
      </label>
      <div className="penduduk-heading-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Mengimpor…" : "Impor Rumah Tangga"}
        </button>
      </div>
      {state.status === "idle" ? null : (
        <p
          className={state.status === "error" ? "alert alert-error" : "alert alert-info"}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      )}
      {state.status === "error" && state.fieldErrors ? (
        <ul className="form-help">
          {Object.entries(state.fieldErrors).map(([baris, pesan]) => (
            <li key={baris}>
              {baris}: {pesan.join(" ")}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
