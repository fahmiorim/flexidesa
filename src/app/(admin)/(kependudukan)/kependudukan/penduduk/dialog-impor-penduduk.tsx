"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { imporPendudukAction } from "@/features/kependudukan/penduduk/application/penduduk-import-use-cases";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState } from "@/lib/action-state";

function IsiDialogImpor({ onSelesai }: { onSelesai: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    imporPendudukAction,
    createIdleActionState<{ jumlah: number }>(),
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  if (state.status === "success") {
    return (
      <div className="platform-dialog-form">
        <p className="alert alert-info" role="status">
          {state.message}
        </p>
        <div className="platform-dialog-actions">
          <button className="button button-primary" onClick={onSelesai} type="button">
            Selesai
          </button>
        </div>
      </div>
    );
  }

  const daftarGalat =
    state.status === "error" && state.fieldErrors ? Object.entries(state.fieldErrors) : [];

  return (
    <form action={formAction} className="platform-dialog-form form-stack">
      <label className="form-field">
        <span className="form-label">Pilih berkas</span>
        <input accept=".xlsx,.csv,.txt" name="berkas" required type="file" />
        <small>Maksimal 5 MB dan 2.000 baris per berkas.</small>
      </label>

      <div className="penduduk-impor-contoh">
        <div>
          <strong>Belum punya berkas?</strong>
          <span>
            Unduh template berisi kolom ekspor OpenSID dan sheet Contoh yang bisa disalin.
          </span>
        </div>
        <Link className="button button-secondary" href="/kependudukan/penduduk/impor/template">
          Unduh contoh format
        </Link>
      </div>

      <PesanDialog state={state} />

      {daftarGalat.length > 0 ? (
        <div className="data-panel impor-penduduk-galat">
          <strong>Baris yang perlu diperbaiki</strong>
          <ul>
            {daftarGalat.map(([baris, pesan]) => (
              <li key={baris}>
                <strong>{baris}:</strong> {pesan.join(" ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="platform-dialog-actions">
        <button className="button button-secondary" onClick={onSelesai} type="button">
          Batal
        </button>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Mengimpor..." : "Impor Penduduk"}
        </button>
      </div>
    </form>
  );
}

/**
 * Impor penduduk dalam dialog agar pengguna tetap berada di daftar penduduk.
 * Isi dialog di-remount setiap kali ditutup agar status unggahan sebelumnya
 * tidak terbawa saat dialog dibuka lagi.
 */
export function DialogImporPenduduk() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [versi, setVersi] = useState(0);

  function tutup() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        className="button button-secondary"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Impor Berkas
      </button>

      <dialog
        aria-labelledby={`${id}-judul`}
        className="platform-dialog penduduk-impor-dialog"
        onClose={() => setVersi((nilai) => nilai + 1)}
        onClick={(event) => {
          if (event.target === dialogRef.current) tutup();
        }}
        ref={dialogRef}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${id}-judul`}>Impor Penduduk</h2>
            <p>Unggah Excel/CSV ekspor OpenSID. Satu baris salah membatalkan semua.</p>
          </div>
          <button
            aria-label="Tutup dialog"
            className="platform-dialog-close"
            onClick={tutup}
            type="button"
          >
            ✕
          </button>
        </div>

        <IsiDialogImpor key={versi} onSelesai={tutup} />
      </dialog>
    </>
  );
}
