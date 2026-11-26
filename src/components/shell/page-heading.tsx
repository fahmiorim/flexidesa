"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Id slot heading yang disediakan `AdminTopbar`. */
export const PAGE_HEADING_SLOT_ID = "admin-topbar-heading";

const subscribe = () => () => {};
const ambilSlot = () => document.getElementById(PAGE_HEADING_SLOT_ID);

interface PageHeadingProps {
  /** Judul halaman yang dirender sebagai `<h1>`. */
  judul?: ReactNode;
  /** Deskripsi singkat di bawah judul. */
  deskripsi?: ReactNode;
  /** Teks kecil di atas judul (mis. eyebrow/kategori halaman). */
  atasJudul?: ReactNode;
  /**
   * Isi blok judul pengganti, untuk struktur bertingkat khusus (mis. wadah
   * berkelas ganda). Bila diisi, `atasJudul`/`judul`/`deskripsi` tidak dipakai.
   */
  isiJudul?: ReactNode;
  /** Elemen wadah heading; default `header`. */
  wadah?: "header" | "div";
  /** Kelas wadah heading; default `page-heading`. */
  kelas?: string;
  /** Aksi halaman (tombol/tautan/form) yang dirender di badan halaman. */
  aksi?: ReactNode;
}

/**
 * Menampilkan heading halaman di bilah atas admin.
 *
 * Judul dan deskripsi dirender ke slot bilah atas lewat portal, sedangkan
 * tombol/aksi halaman dirender di badan halaman (tepat di posisi
 * `PageHeading`, di bawah bilah atas) agar bilah atas tetap bersih.
 * Slot hanya ada di klien, jadi portal dibuat setelah hidrasi.
 */
export function PageHeading({
  judul,
  deskripsi,
  atasJudul,
  isiJudul,
  wadah,
  kelas,
  aksi,
}: PageHeadingProps) {
  const slot = useSyncExternalStore(subscribe, ambilSlot, () => null);
  const Wadah = wadah ?? "header";

  const heading = (
    <Wadah className={kelas ?? "page-heading"}>
      {isiJudul ?? (
        <div>
          {atasJudul}
          <h1>{judul}</h1>
          {deskripsi ? <p>{deskripsi}</p> : null}
        </div>
      )}
    </Wadah>
  );

  return (
    <>
      {slot ? createPortal(heading, slot) : null}
      {aksi ? <div className="page-actions page-heading-actions-body">{aksi}</div> : null}
    </>
  );
}
