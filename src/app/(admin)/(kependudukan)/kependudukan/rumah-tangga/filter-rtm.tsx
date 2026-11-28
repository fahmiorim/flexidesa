"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  RTM_SEX_FILTERS,
  RTM_SEX_LABELS,
  RTM_STATUS_FILTERS,
  RTM_STATUS_LABELS,
  type RtmFilter,
} from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";

import styles from "./rumah-tangga.module.css";

/**
 * Form filter daftar RTM: hanya Status, Jenis Kelamin, dan
 * Dusun, ditambah pencarian teks. Semua filter digabung (AND) saat disubmit.
 */
export function FilterRtm({
  filter,
  dusun,
  resetHref,
}: {
  filter: RtmFilter;
  dusun: string[];
  resetHref: string;
}) {
  const hasFilter =
    filter.search !== "" || filter.status !== null || filter.sex !== null || filter.dusun !== "";

  return (
    <form className={styles.filterPanel} method="get">
      <input
        aria-label="Cari nomor RTM, kepala, NIK, alamat, atau BDT"
        className={styles.filterSearch}
        defaultValue={filter.search}
        name="q"
        placeholder="Cari nomor RTM, kepala, NIK, alamat, BDT…"
        type="search"
      />
      <select aria-label="Status RTM" defaultValue={filter.status ?? ""} name="status">
        <option value="">Semua status</option>
        {RTM_STATUS_FILTERS.map((status) => (
          <option key={status} value={status}>
            {RTM_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <select aria-label="Jenis kelamin kepala" defaultValue={filter.sex ?? ""} name="sex">
        <option value="">Semua jenis kelamin</option>
        {RTM_SEX_FILTERS.map((sex) => (
          <option key={sex} value={sex}>
            {RTM_SEX_LABELS[sex]}
          </option>
        ))}
      </select>
      <select aria-label="Dusun" defaultValue={filter.dusun} name="dusun">
        <option value="">Semua dusun</option>
        {dusun.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <Button variant="primary" type="submit">
        Terapkan
      </Button>
      {hasFilter ? (
        <ButtonLink variant="secondary" href={resetHref}>
          Reset
        </ButtonLink>
      ) : null}
    </form>
  );
}
