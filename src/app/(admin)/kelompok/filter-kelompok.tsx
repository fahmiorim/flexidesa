"use client";

import Link from "next/link";

import type { KelompokFilter } from "@/features/kelompok/domain/kelompok";
import type { LabelOption } from "@/lib/forms";

import styles from "./kelompok.module.css";

/**
 * Filter daftar kelompok (paritas OpenSID index): Status dan Kategori,
 * ditambah pencarian teks. Semua filter digabung (AND) saat disubmit.
 */
export function FilterKelompok({
  filter,
  kategori,
  resetHref,
}: {
  filter: KelompokFilter;
  kategori: LabelOption[];
  resetHref: string;
}) {
  const hasFilter = filter.search !== "" || filter.status !== null || filter.categoryId !== null;

  return (
    <form className={styles.filterPanel} method="get">
      <input
        aria-label="Cari kode, nama, atau ketua kelompok"
        className={styles.filterSearch}
        defaultValue={filter.search}
        name="q"
        placeholder="Cari kode, nama, atau ketua…"
        type="search"
      />
      <select aria-label="Status" defaultValue={filter.status ?? "semua"} name="status">
        <option value="aktif">Aktif</option>
        <option value="tidak-aktif">Tidak Aktif</option>
        <option value="semua">Semua status</option>
      </select>
      <select aria-label="Kategori" defaultValue={filter.categoryId ?? ""} name="kategori">
        <option value="">Semua kategori</option>
        {kategori.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <button className="button button-primary" type="submit">
        Terapkan
      </button>
      {hasFilter ? (
        <Link className="button button-secondary" href={resetHref}>
          Reset
        </Link>
      ) : null}
    </form>
  );
}
