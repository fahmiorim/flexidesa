"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { GalatField } from "./dialog-bagian";

interface HasilBuatPaket {
  id: number;
  versionId: number;
}

type AksiBuatPaket = (
  state: ActionState<HasilBuatPaket>,
  formData: FormData,
) => Promise<ActionState<HasilBuatPaket>>;

export function PaketFormBaru({ aksi }: { aksi: AksiBuatPaket }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<HasilBuatPaket>(),
  );
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  useEffect(() => {
    if (state.status === "success") router.push(`/super-admin/paket/${state.data.id}`);
  }, [router, state]);

  return (
    <form action={formAction} className="platform-card">
      <div className="platform-card-head">
        <div>
          <h2>Identitas paket</h2>
          <p>Paket dibuat sebagai draf. Pilih modul yang tersedia setelah paket dibuat.</p>
        </div>
      </div>
      <div className="platform-card-body form-stack">
        <div className="platform-form-grid">
          <label className="form-field">
            <span className="form-label">Nama paket</span>
            <input
              aria-invalid={fieldErrors.name ? true : undefined}
              autoComplete="off"
              className="form-input"
              maxLength={100}
              name="name"
              required
            />
            <GalatField pesan={fieldErrors.name?.[0]} />
          </label>

          <label className="form-field">
            <span className="form-label">Slug</span>
            <input
              aria-describedby="paket-slug-help"
              aria-invalid={fieldErrors.slug ? true : undefined}
              autoComplete="off"
              className="form-input"
              maxLength={50}
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
            <span className="form-help" id="paket-slug-help">
              Huruf kecil, angka, dan tanda hubung; minimal 3 karakter.
            </span>
            <GalatField pesan={fieldErrors.slug?.[0]} />
          </label>
        </div>

        <label className="form-field">
          <span className="form-label">Deskripsi</span>
          <textarea
            aria-invalid={fieldErrors.description ? true : undefined}
            className="form-input"
            maxLength={1000}
            name="description"
            rows={4}
          />
          <span className="form-help">Opsional, maksimal 1.000 karakter.</span>
          <GalatField pesan={fieldErrors.description?.[0]} />
        </label>

        {state.status === "error" ? (
          <p className="alert alert-error" role="alert">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" ? (
          <p className="alert alert-info" role="status">
            {state.message}
          </p>
        ) : null}

        <div className="platform-row-actions">
          <button className="button button-primary" disabled={pending} type="submit">
            {pending ? "Membuat paket…" : "Buat paket draf"}
          </button>
        </div>
      </div>
    </form>
  );
}
