"use client";

import { useId, useRef, type ReactNode } from "react";

import styles from "./stunting.module.css";

/**
 * Dialog panduan modul Stunting.
 *
 * OpenSID membuka panduan lewat modal Bootstrap (`data-toggle="modal"`); di
 * FlexiDesa dipakai `<dialog>` natif supaya fokus, tombol Esc, dan backdrop tetap
 * bekerja tanpa pustaka tambahan.
 */
export function DialogPanduan({
  label,
  judul,
  ringkas,
  children,
}: {
  label: string;
  judul: string;
  ringkas?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const judulId = useId();

  return (
    <>
      <button
        className="button button-secondary"
        onClick={() => ref.current?.showModal()}
        type="button"
      >
        {label}
      </button>

      <dialog
        aria-labelledby={judulId}
        className={`platform-dialog ${styles.panduanDialog}`}
        onClick={(event) => {
          if (event.target === ref.current) ref.current?.close();
        }}
        ref={ref}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={judulId}>{judul}</h2>
            {ringkas ? <p>{ringkas}</p> : null}
          </div>
          <button
            aria-label="Tutup panduan"
            className="platform-dialog-close"
            onClick={() => ref.current?.close()}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className={styles.panduanBody}>{children}</div>

        <div className="platform-dialog-actions">
          <button
            className="button button-secondary"
            onClick={() => ref.current?.close()}
            type="button"
          >
            Tutup
          </button>
        </div>
      </dialog>
    </>
  );
}
