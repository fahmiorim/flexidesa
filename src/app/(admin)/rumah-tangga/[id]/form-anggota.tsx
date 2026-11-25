"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { simpanAnggotaAction } from "@/app/(admin)/rumah-tangga/actions";
import { RTM_LEVEL_ANGGOTA, RTM_LEVEL_KEPALA } from "@/features/rumah-tangga/domain/rumah-tangga";
import { createIdleActionState } from "@/lib/action-state";
import type { LabelOption } from "@/lib/forms";

export function FormAnggotaRumahTangga({
  rtmId,
  penduduk,
}: {
  rtmId: number;
  penduduk: LabelOption[];
}) {
  const router = useRouter();
  const aksi = simpanAnggotaAction.bind(null, rtmId);
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ jumlah: number }>(),
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="form-stack">
      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Penduduk</span>
          <select className="form-input" defaultValue="" name="residentId" required>
            <option value="">Pilih penduduk…</option>
            {penduduk.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="form-help">
            Penduduk yang sudah menjadi anggota RTM lain akan dipindahkan ke RTM ini.
          </span>
        </label>
        <label className="form-field">
          <span className="form-label">Tingkat hubungan</span>
          <select className="form-input" defaultValue={RTM_LEVEL_ANGGOTA} name="level">
            <option value={RTM_LEVEL_KEPALA}>Kepala Rumah Tangga</option>
            <option value={RTM_LEVEL_ANGGOTA}>Anggota</option>
          </select>
          <span className="form-help">Menetapkan kepala baru otomatis menurunkan kepala lama.</span>
        </label>
      </div>
      <div className="penduduk-heading-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Tambahkan Anggota"}
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
    </form>
  );
}
