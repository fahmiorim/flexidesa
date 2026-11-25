"use client";

import Link from "next/link";

import { PAGE_HEADING_SLOT_ID } from "@/components/shell/page-heading";

/**
 * Bilah atas konsol platform: judul halaman dan tautan audit.
 *
 * Judul, deskripsi, dan aksi halaman ditulis di `PlatformPageHeader` lalu
 * dipindahkan ke bilah ini lewat `PageHeading`, sama seperti konsol desa.
 */
export function PlatformTopbarHead() {
  return (
    <>
      <div className="platform-topbar-heading" id={PAGE_HEADING_SLOT_ID} />

      <div className="platform-topbar-tools">
        <Link
          aria-label="Buka audit trail"
          className="platform-topbar-icon"
          href="/super-admin/audit"
          title="Audit trail"
        >
          <svg
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            viewBox="0 0 24 24"
          >
            <path d="M6 9.4a6 6 0 0 1 12 0c0 4.2 1.6 5.4 1.6 5.4H4.4S6 13.6 6 9.4Z" />
            <path d="M10.2 18a2 2 0 0 0 3.6 0" />
          </svg>
        </Link>
      </div>
    </>
  );
}
