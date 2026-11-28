"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function nomorHalaman(aktif: number, total: number): (number | "elipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const nomor = [...new Set([1, total, aktif - 1, aktif, aktif + 1])]
    .filter((item) => item >= 1 && item <= total)
    .sort((a, b) => a - b);
  const hasil: (number | "elipsis")[] = [];
  for (const item of nomor) {
    const sebelumnya = hasil[hasil.length - 1];
    if (typeof sebelumnya === "number" && item - sebelumnya > 1) hasil.push("elipsis");
    hasil.push(item);
  }
  return hasil;
}

/**
 * Pagination bersama.
 *
 * Dua mode: tautan (`hrefForPage`, untuk form GET server-side) atau klik
 * (`onPageChange`, untuk konsol client-side). Halaman tidak boleh menulis
 * kontrol pagination sendiri.
 */
export function Pagination({
  page,
  pageCount,
  hrefForPage,
  onPageChange,
  summary,
  pageSize,
  label = "Navigasi halaman",
}: {
  page: number;
  pageCount: number;
  hrefForPage?: (page: number) => string;
  onPageChange?: (page: number) => void;
  summary?: ReactNode;
  pageSize?: ReactNode;
  label?: string;
}) {
  if (pageCount <= 1 && !pageSize) return null;
  const halamanAktif = Math.min(Math.max(page, 1), Math.max(pageCount, 1));

  const kontrol = (target: number, isi: ReactNode, ariaLabel: string, nonaktif: boolean) => {
    const className = `ui-page-button${target === halamanAktif ? " is-active" : ""}`;
    if (hrefForPage) {
      if (nonaktif) {
        return (
          <span aria-disabled="true" className={className} key={ariaLabel}>
            {isi}
          </span>
        );
      }
      return (
        <Link
          aria-current={target === halamanAktif ? "page" : undefined}
          aria-label={ariaLabel}
          className={className}
          href={hrefForPage(target)}
          key={ariaLabel}
        >
          {isi}
        </Link>
      );
    }
    return (
      <button
        aria-current={target === halamanAktif ? "page" : undefined}
        aria-label={ariaLabel}
        className={className}
        disabled={nonaktif}
        key={ariaLabel}
        onClick={() => onPageChange?.(target)}
        type="button"
      >
        {isi}
      </button>
    );
  };

  return (
    <div className="ui-pagination">
      <div className="ui-pagination-summary">{summary}</div>
      <nav aria-label={label} className="ui-pagination-pages">
        {kontrol(halamanAktif - 1, "‹", "Halaman sebelumnya", halamanAktif <= 1)}
        {nomorHalaman(halamanAktif, pageCount).map((item, index) =>
          item === "elipsis" ? (
            <span aria-hidden="true" className="ui-pagination-ellipsis" key={`elipsis-${index}`}>
              …
            </span>
          ) : (
            kontrol(item, item, `Halaman ${item}`, false)
          ),
        )}
        {kontrol(halamanAktif + 1, "›", "Halaman berikutnya", halamanAktif >= pageCount)}
      </nav>
      {pageSize}
    </div>
  );
}
