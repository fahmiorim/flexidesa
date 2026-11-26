"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export interface HasilImporTerdata {
  ditambahkan: number;
  dilewati: number;
  tidakDitemukan: string[];
}

/**
 * Form impor terdata suplemen.
 *
 * Paritas halaman `impor_data` OpenSID: unggah berkas, unduh contoh format, dan
 * ringkasan hasil impor (berhasil / dilewati / sasaran tidak ditemukan).
 */
export function FormImporTerdata({
  aksi,
  suplemenId,
  templateHref,
  kembaliHref,
}: {
  aksi: (
    state: ActionState<HasilImporTerdata>,
    formData: FormData,
  ) => Promise<ActionState<HasilImporTerdata>>;
  suplemenId: number;
  templateHref: string;
  kembaliHref: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<HasilImporTerdata>(),
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction} className="form-stack suplemen-form">
      <input name="suplemenId" type="hidden" value={suplemenId} />

      <label className="form-field">
        <span className="form-label">File Data Suplemen</span>
        <input accept=".xls,.xlsx,.xlsm,.csv,.txt" name="berkas" required type="file" />
        <small>
          Format .xlsx/.csv, maksimal 5 MB. Kolom pertama NIK (sasaran penduduk) atau No. KK
          (sasaran keluarga); kolom kedua Keterangan; kolom lain menjadi isian tambahan.
        </small>
      </label>

      <div className="suplemen-impor-contoh">
        <div>
          <strong>Belum punya berkas?</strong>
          <span>Unduh contoh format impor sesuai sasaran suplemen ini.</span>
        </div>
        <Link className="button button-secondary" href={templateHref}>
          Unduh Contoh Format
        </Link>
      </div>

      <PesanDialog state={state} />

      {state.status === "success" ? (
        <div className="data-panel suplemen-impor-hasil">
          <dl>
            <div>
              <dt>Total data berhasil</dt>
              <dd>{state.data.ditambahkan}</dd>
            </div>
            <div>
              <dt>Data dilewati</dt>
              <dd>{state.data.dilewati}</dd>
            </div>
            <div>
              <dt>Tidak ditemukan</dt>
              <dd>{state.data.tidakDitemukan.length}</dd>
            </div>
          </dl>
          {state.data.tidakDitemukan.length > 0 ? (
            <p>
              <strong>Sasaran tidak ditemukan:</strong>{" "}
              {state.data.tidakDitemukan.slice(0, 20).join(", ")}
              {state.data.tidakDitemukan.length > 20 ? ", …" : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="suplemen-form-actions">
        <Link className="button button-secondary" href={kembaliHref}>
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Mengimpor..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
