"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";

import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

type Props = {
  aksi: (state: ActionState<null>, formData: FormData) => Promise<ActionState<null>>;
  judul: string;
  deskripsi?: string;
  label: string;
  labelSimpan: string;
  children: ReactNode;
  varian?: "primary" | "secondary" | "ghost";
  /** Kelas tombol pemicu bila halaman memakai CSS module sendiri. */
  kelasTombol?: string;
  /** Buka dialog otomatis, dipakai saat halaman dimuat dengan parameter ubah. */
  bukaAwal?: boolean;
  /** URL tujuan setelah dialog ditutup agar parameter ubah hilang dari alamat. */
  tutupHref?: string;
};

/**
 * Dialog form pemerintahan desa.
 *
 * Dipakai agar menambah/mengubah data tidak berpindah halaman. Form memakai
 * Server Action bergaya `ActionState` sehingga galat validasi tampil di dialog
 * dan dialog baru ditutup setelah penyimpanan berhasil.
 */
export function FormDialog({
  aksi,
  judul,
  deskripsi,
  label,
  labelSimpan,
  children,
  varian = "primary",
  kelasTombol,
  bukaAwal = false,
  tutupHref,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const id = useId();
  const [state, formAction, pending] = useActionState(aksi, createIdleActionState<null>());

  useEffect(() => {
    if (bukaAwal) dialogRef.current?.showModal();
  }, [bukaAwal]);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    dialogRef.current?.close();
    if (!tutupHref) router.refresh();
  }, [state, router, tutupHref]);

  return (
    <>
      <button
        className={kelasTombol ?? `button button-${varian}`}
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {label}
      </button>

      <dialog
        aria-labelledby={`${id}-judul`}
        className="platform-dialog pemerintahan-dialog"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        onClose={() => {
          if (tutupHref) router.replace(tutupHref);
        }}
        ref={dialogRef}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${id}-judul`}>{judul}</h2>
            {deskripsi ? <p>{deskripsi}</p> : null}
          </div>
          <button
            aria-label="Tutup dialog"
            className="platform-dialog-close"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="platform-dialog-form pemerintahan-form" ref={formRef}>
          {children}
          <PesanDialog state={state} />
          <div className="platform-dialog-actions">
            <button
              className="button button-secondary"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Batal
            </button>
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? "Menyimpan..." : labelSimpan}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
