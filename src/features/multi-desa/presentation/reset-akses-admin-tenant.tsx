"use client";

import { useActionState } from "react";

import { createIdleActionState, type ActionState } from "@/lib/action-state";

export interface HasilResetAksesAdmin {
  username: string | null;
  email: string;
  sandiSementara: string;
}

/**
 * Satu-satunya kontrol "Reset akses admin" untuk sebuah tenant.
 *
 * Dipakai panel Konsol Tenant maupun toolbar Detail Domain supaya kedua entry
 * point memakai Server Action, validasi, dan tampilan sandi sementara yang
 * sama. Sandi hanya ditampilkan sekali setelah reset berhasil.
 */
export function ResetAksesAdmin({
  villageId,
  aksi,
  nonaktif = false,
  className = "tenant-inline-form",
  formClassName,
}: {
  villageId: number;
  aksi: (
    state: ActionState<HasilResetAksesAdmin>,
    formData: FormData,
  ) => Promise<ActionState<HasilResetAksesAdmin>>;
  nonaktif?: boolean;
  className?: string;
  formClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<HasilResetAksesAdmin>(),
  );

  return (
    <div className={className}>
      <form action={formAction} className={formClassName}>
        <input type="hidden" name="villageId" value={villageId} />
        <button className="button button-secondary" type="submit" disabled={pending || nonaktif}>
          {pending ? "Mereset..." : "Reset akses admin"}
        </button>
        <span className="form-help">Sandi sementara ditampilkan sekali setelah reset.</span>
      </form>
      {state.status === "success" ? (
        <p className="tenant-secret" aria-live="polite">
          Sandi sementara untuk <strong>{state.data.username ?? state.data.email}</strong>:{" "}
          <code>{state.data.sandiSementara}</code>
        </p>
      ) : null}
      {state.status === "error" ? (
        <span aria-live="polite" className="form-error">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}
