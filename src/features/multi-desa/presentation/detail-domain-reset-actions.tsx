"use client";

import { useActionState } from "react";

import { createIdleActionState, type ActionState } from "@/lib/action-state";

export interface HasilResetAksesAdmin {
  username: string | null;
  email: string;
  sandiSementara: string;
}

/**
 * Tombol reset akses administrator desa di toolbar Detail Domain.
 *
 * Memakai Server Action yang sama dengan panel Kelola di Konsol Tenant:
 * `villageId` dikirim sebagai field tersembunyi dan sandi sementara hanya
 * ditampilkan sekali di sini setelah berhasil.
 */
export function DetailDomainResetActions({
  villageId,
  aksi,
}: {
  villageId: number;
  aksi: (
    state: ActionState<HasilResetAksesAdmin>,
    formData: FormData,
  ) => Promise<ActionState<HasilResetAksesAdmin>>;
}) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<HasilResetAksesAdmin>(),
  );

  return (
    <div className="domain-network-actions">
      <form action={formAction} className="domain-network-buttons">
        <input type="hidden" name="villageId" value={villageId} />
        <button className="button button-secondary" disabled={pending} type="submit">
          {pending ? "Mereset..." : "Reset akses admin"}
        </button>
      </form>
      {state.status === "success" ? (
        <p className="tenant-secret" aria-live="polite">
          Sandi sementara untuk <strong>{state.data.username ?? state.data.email}</strong>:{" "}
          <code>{state.data.sandiSementara}</code>
        </p>
      ) : null}
      {state.status === "error" ? (
        <span aria-live="polite" className="domain-network-note is-error">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}
