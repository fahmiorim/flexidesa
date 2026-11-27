"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { Button, type ButtonVariant } from "./button";
import { tutupDialog } from "./dialog-motion";

type DialogHapusStateProps = {
  aksi: (state: ActionState<null>, formData: FormData) => Promise<ActionState<null>>;
  id: string;
  judul: string;
  keterangan: ReactNode;
  label?: string;
};

type DialogHapusFormProps = {
  aksi: (formData: FormData) => void | Promise<void>;
  /** Nilai field `id`; boleh kosong bila identitas dikirim lewat `hidden`. */
  id?: string | number;
  judul: string;
  keterangan: ReactNode;
  label?: string;
  /** Label tombol konfirmasi; sebut objeknya, mis. "Hapus layanan". */
  labelAksi?: string;
  /** Field tersembunyi tambahan, mis. `jenis` atau `tahun`. */
  hidden?: Record<string, string | number>;
  varian?: ButtonVariant;
};

/**
 * Dialog konfirmasi untuk aksi hapus yang tidak dapat dibatalkan.
 *
 * `DialogHapus` dipakai bila Server Action mengembalikan `ActionState`
 * (galat validasi tampil di dialog). `DialogHapusForm` membungkus aksi
 * redirect biasa, sehingga form hapus lama tetap berjalan tanpa perubahan
 * kontrak. Keduanya memakai dialog, tombol, dan pola fokus yang sama.
 */
export function DialogHapus({
  aksi,
  id,
  judul,
  keterangan,
  label = "Hapus",
}: DialogHapusStateProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const dialogId = useId();
  const [state, formAction, pending] = useActionState(aksi, createIdleActionState<null>());

  useEffect(() => {
    if (state.status !== "success") return;
    tutupDialog(dialogRef.current);
    router.refresh();
  }, [state, router]);

  return (
    <KonfirmasiHapus
      dialogRef={dialogRef}
      dialogId={dialogId}
      judul={judul}
      keterangan={keterangan}
      label={label}
      labelAksi="Ya, hapus"
    >
      <form action={formAction} className="platform-dialog-form">
        <input name="id" type="hidden" value={id} />
        {state.status === "error" ? (
          <p className="alert alert-error" role="alert">
            {state.message}
          </p>
        ) : null}
        <TombolAksi
          labelAksi="Ya, hapus"
          onBatal={() => tutupDialog(dialogRef.current)}
          pending={pending}
        />
      </form>
    </KonfirmasiHapus>
  );
}

export function DialogHapusForm({
  aksi,
  id,
  judul,
  keterangan,
  label = "Hapus",
  labelAksi,
  hidden,
  varian = "danger-ghost",
}: DialogHapusFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const aksiLabel = labelAksi ?? label;

  return (
    <KonfirmasiHapus
      dialogRef={dialogRef}
      dialogId={dialogId}
      judul={judul}
      keterangan={keterangan}
      label={label}
      labelAksi={aksiLabel}
      varian={varian}
    >
      <form action={aksi} className="platform-dialog-form">
        {id === undefined ? null : <input name="id" type="hidden" value={id} />}
        {Object.entries(hidden ?? {}).map(([nama, nilai]) => (
          <input key={nama} name={nama} type="hidden" value={nilai} />
        ))}
        <TombolAksi labelAksi={aksiLabel} onBatal={() => tutupDialog(dialogRef.current)} />
      </form>
    </KonfirmasiHapus>
  );
}

function KonfirmasiHapus({
  dialogRef,
  dialogId,
  judul,
  keterangan,
  label,
  labelAksi,
  varian = "danger-ghost",
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  dialogId: string;
  judul: string;
  keterangan: ReactNode;
  label: string;
  labelAksi: string;
  varian?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <>
      <Button
        aria-label={labelAksi === label ? undefined : `${label}: ${judul}`}
        onClick={() => dialogRef.current?.showModal()}
        type="button"
        variant={varian}
      >
        {label}
      </Button>

      <dialog
        aria-labelledby={`${dialogId}-judul`}
        className="platform-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) tutupDialog(dialogRef.current);
        }}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${dialogId}-judul`}>{judul}</h2>
            <p>{keterangan}</p>
          </div>
          <button
            aria-label="Tutup dialog"
            className="platform-dialog-close"
            onClick={() => tutupDialog(dialogRef.current)}
            type="button"
          >
            ✕
          </button>
        </div>

        {children}
      </dialog>
    </>
  );
}

function TombolAksi({
  labelAksi,
  onBatal,
  pending,
}: {
  labelAksi: string;
  onBatal: () => void;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const loading = pending ?? status.pending;

  return (
    <div className="platform-dialog-actions">
      <Button onClick={onBatal} type="button" variant="secondary">
        Batal
      </Button>
      <Button loading={loading} type="submit" variant="danger">
        {labelAksi}
      </Button>
    </div>
  );
}
