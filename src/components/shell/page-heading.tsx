"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/** Id slot heading yang disediakan `AdminTopbar`. */
export const PAGE_HEADING_SLOT_ID = "admin-topbar-heading";

const subscribe = () => () => {};
const ambilSlot = () => document.getElementById(PAGE_HEADING_SLOT_ID);

/** Apakah simpul ini (atau salah satu anaknya) memuat `<h1>` judul halaman. */
function mengandungH1(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  if (node.type === "h1") return true;
  const props = node.props as { children?: ReactNode };
  return Children.toArray(props.children).some((child) => mengandungH1(child));
}

/** Apakah simpul adalah tautan/tombol yang dipakai sebagai aksi halaman. */
function adalahAksi(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const type = node.type;
  return (
    type === "a" ||
    type === "button" ||
    type === "form" ||
    (typeof type === "object" && type !== null && "displayName" in type) ||
    (typeof type === "function" && type !== null)
  );
}

interface PisahanHeading {
  /** Wadah heading untuk portal (judul + ikon saja). */
  heading: ReactElement;
  /** Aksi halaman untuk dirender di badan halaman, di bawah bilah atas. */
  aksi: ReactNode[];
}

/**
 * Pisahkan wadah heading menjadi judul dan aksi.
 *
 * Struktur baku halaman: wadah heading berisi blok judul (memuat `<h1>`)
 * lalu blok aksi (div aksi, tautan "Kembali", atau form). Aksi tidak boleh
 * berada di bilah atas, jadi dipisah dan dirender di badan halaman.
 * Bila struktur tidak dikenali, seluruh heading dibiarkan utuh di portal.
 */
function pisahkanHeading(children: ReactNode): PisahanHeading | null {
  const luar = Children.toArray(children);
  if (luar.length !== 1 || !isValidElement(luar[0])) return null;

  const wadah = luar[0] as ReactElement<{ children?: ReactNode }>;
  const dalam = Children.toArray(wadah.props.children);
  const indeksJudul = dalam.findIndex((node) => mengandungH1(node));
  if (indeksJudul === -1) return null;

  const judul = dalam.slice(0, indeksJudul + 1);
  const aksi: ReactNode[] = [...dalam.slice(indeksJudul + 1)];

  // Tautan/tombol "Kembali" yang ditulis di dalam blok judul (sebelum `<h1>`)
  // ikut dipindah ke badan halaman agar bilah atas bebas tombol.
  const blokJudul = judul[judul.length - 1];
  if (isValidElement(blokJudul)) {
    const anakJudul = Children.toArray(
      (blokJudul as ReactElement<{ children?: ReactNode }>).props.children,
    );
    const indeksH1 = anakJudul.findIndex((node) => mengandungH1(node));
    if (indeksH1 > 0) {
      const kembali = anakJudul.slice(0, indeksH1).filter((node) => adalahAksi(node));
      if (kembali.length > 0) {
        aksi.unshift(...kembali);
        judul[judul.length - 1] = cloneElement(
          blokJudul as ReactElement<{ children?: ReactNode }>,
          undefined,
          anakJudul.filter((node) => !kembali.includes(node)),
        );
      }
    }
  }

  if (aksi.length === 0) return null;

  return {
    heading: cloneElement(wadah, undefined, judul),
    aksi,
  };
}

/**
 * Menampilkan heading halaman di bilah atas admin.
 *
 * Judul dan deskripsi dirender ke slot bilah atas lewat portal, sedangkan
 * tombol/aksi halaman dirender di badan halaman (tepat di posisi
 * `PageHeading`, di bawah bilah atas) agar bilah atas tetap bersih.
 * Slot hanya ada di klien, jadi portal dibuat setelah hidrasi.
 */
export function PageHeading({ children }: { children: ReactNode }) {
  const slot = useSyncExternalStore(subscribe, ambilSlot, () => null);
  const pisahan = pisahkanHeading(children);

  if (pisahan === null) {
    if (!slot) return null;
    return createPortal(children, slot);
  }

  return (
    <>
      {slot ? createPortal(pisahan.heading, slot) : null}
      <div className="page-actions page-heading-actions-body">{pisahan.aksi}</div>
    </>
  );
}
