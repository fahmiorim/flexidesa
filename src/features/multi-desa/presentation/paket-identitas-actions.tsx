"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { GalatField } from "./dialog-bagian";
import { PlatformCard } from "./platform-ui";

type HasilUbah = { id: number };
type HasilStatus = { status: "active" | "archived" };
type Aksi<T> = (state: ActionState<T>, formData: FormData) => Promise<ActionState<T>>;

export function PaketIdentitasActions({
  paket,
  ubahAction,
  ubahStatusAction,
}: {
  paket: { id: number; name: string; description: string | null; status: "active" | "archived" };
  ubahAction: Aksi<HasilUbah>;
  ubahStatusAction: Aksi<HasilStatus>;
}) {
  const router = useRouter();
  const [ubahState, ubahFormAction, ubahPending] = useActionState(
    ubahAction,
    createIdleActionState<HasilUbah>(),
  );
  const [statusState, statusFormAction, statusPending] = useActionState(
    ubahStatusAction,
    createIdleActionState<HasilStatus>(),
  );
  const [confirmed, setConfirmed] = useState(false);
  const aktif = paket.status === "active";

  useEffect(() => {
    if (ubahState.status === "success") router.refresh();
  }, [router, ubahState]);
  useEffect(() => {
    if (statusState.status === "success") router.refresh();
  }, [router, statusState]);

  const fieldErrors = ubahState.status === "error" ? (ubahState.fieldErrors ?? {}) : {};

  return (
    <PlatformCard
      description={
        aktif
          ? "Nama dan deskripsi tampil pada daftar paket dan pilihan tenant baru. Slug tidak dapat diubah."
          : "Paket diarsipkan dan tidak dapat diubah. Aktifkan kembali untuk mengelolanya."
      }
      title="Ubah identitas & status"
    >
      <div className="form-stack">
        <form action={ubahFormAction} className="form-stack">
          <input name="id" type="hidden" value={paket.id} />
          <div className="platform-form-grid">
            <label className="form-field">
              <span className="form-label">Nama paket</span>
              <input
                aria-invalid={fieldErrors.name ? true : undefined}
                autoComplete="off"
                className="form-input"
                defaultValue={paket.name}
                disabled={!aktif}
                maxLength={100}
                minLength={3}
                name="name"
                required
              />
              <GalatField pesan={fieldErrors.name?.[0]} />
            </label>
            <label className="form-field">
              <span className="form-label">Deskripsi</span>
              <textarea
                aria-invalid={fieldErrors.description ? true : undefined}
                className="form-input"
                defaultValue={paket.description ?? ""}
                disabled={!aktif}
                maxLength={1000}
                name="description"
                rows={2}
              />
              <GalatField pesan={fieldErrors.description?.[0]} />
            </label>
          </div>
          {ubahState.status === "error" ? (
            <p className="alert alert-error" role="alert">
              {ubahState.message}
            </p>
          ) : null}
          {ubahState.status === "success" ? (
            <p className="alert alert-info" role="status">
              {ubahState.message}
            </p>
          ) : null}
          <div className="platform-row-actions">
            <button
              className="button button-primary"
              disabled={ubahPending || !aktif}
              type="submit"
            >
              {ubahPending ? "Menyimpan…" : "Simpan identitas"}
            </button>
          </div>
        </form>

        <form action={statusFormAction} className="form-stack">
          <input name="id" type="hidden" value={paket.id} />
          <input name="status" type="hidden" value={aktif ? "archived" : "active"} />
          <label className="form-field">
            <span>
              <input
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                required
                type="checkbox"
              />{" "}
              {aktif
                ? "Saya memahami mengarsipkan paket menghentikan perubahan dan penerbitan versinya."
                : "Saya memahami mengaktifkan kembali paket membuka perubahan dan penerbitan versinya."}
            </span>
          </label>
          {statusState.status === "error" ? (
            <p className="alert alert-error" role="alert">
              {statusState.message}
            </p>
          ) : null}
          {statusState.status === "success" ? (
            <p className="alert alert-info" role="status">
              {statusState.message}
            </p>
          ) : null}
          <div className="platform-row-actions">
            <button
              className={aktif ? "button button-secondary" : "button button-primary"}
              disabled={statusPending || !confirmed}
              type="submit"
            >
              {statusPending ? "Memproses…" : aktif ? "Arsipkan paket" : "Aktifkan paket"}
            </button>
          </div>
        </form>
      </div>
    </PlatformCard>
  );
}
