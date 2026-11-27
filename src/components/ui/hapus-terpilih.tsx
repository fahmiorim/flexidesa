"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";

import { Button } from "./button";

/**
 * Tombol hapus massal dengan dialog konfirmasi aplikasi.
 *
 * Checkbox data berada di dalam tabel, sedangkan dialog berada di luar tabel
 * agar tidak ada form bersarang. Id terpilih dibaca saat dialog dikirim, lalu
 * diteruskan ke Server Action sebagai field `namaField` (default `idCb`).
 */
export function HapusTerpilih({
  aksi,
  judul,
  label = "Hapus terpilih",
  namaField = "idCb",
  hidden,
  keterangan,
}: {
  aksi: (formData: FormData) => void | Promise<void>;
  judul: string;
  label?: string;
  /** Nama field yang dibaca Server Action, mis. `idCb` atau `ids`. */
  namaField?: string;
  /** Field tersembunyi tambahan, mis. `suplemenId`. */
  hidden?: Record<string, string | number>;
  /** Penjelasan tambahan di dialog; baku menyebut hapus permanen. */
  keterangan?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const router = useRouter();
  const [jumlah, setJumlah] = useState(0);
  const [pending, mulai] = useTransition();

  function terpilih() {
    return Array.from(
      document.querySelectorAll<HTMLInputElement>(`input[name="${namaField}"]:checked`),
    ).map((input) => input.value);
  }

  function buka() {
    setJumlah(terpilih().length);
    dialogRef.current?.showModal();
  }

  function kirim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ids = terpilih();
    if (ids.length === 0) return;

    const formData = new FormData();
    for (const [nama, nilai] of Object.entries(hidden ?? {})) formData.set(nama, String(nilai));
    for (const id of ids) formData.append(namaField, id);

    mulai(async () => {
      try {
        await aksi(formData);
      } finally {
        dialogRef.current?.close();
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button onClick={buka} type="button" variant="danger">
        {label}
      </Button>

      <dialog
        aria-labelledby={`${dialogId}-judul`}
        className="platform-dialog"
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${dialogId}-judul`}>{judul}</h2>
            <p>
              {jumlah === 0
                ? "Pilih minimal satu data pada tabel sebelum menghapus."
                : (keterangan ??
                  `${jumlah} data yang dicentang akan dihapus permanen dan tidak dapat dibatalkan.`)}
            </p>
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

        <form className="platform-dialog-form" onSubmit={kirim}>
          <div className="platform-dialog-actions">
            <Button onClick={() => dialogRef.current?.close()} type="button" variant="secondary">
              Batal
            </Button>
            <Button disabled={jumlah === 0} loading={pending} type="submit" variant="danger">
              Hapus {jumlah > 0 ? `${jumlah} data` : "data"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
