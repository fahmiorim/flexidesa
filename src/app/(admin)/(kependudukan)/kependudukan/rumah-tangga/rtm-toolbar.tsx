import Link from "next/link";

import styles from "./rumah-tangga.module.css";

export function RtmToolbar({
  bolehTambah,
  exportHref,
}: {
  bolehTambah: boolean;
  exportHref: string;
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <Link className="button button-secondary" href="/kependudukan/rumah-tangga/laporan">
          Laporan RTM
        </Link>
        <Link className="button button-secondary" href={exportHref}>
          Ekspor CSV
        </Link>
        {bolehTambah ? (
          <Link className="button button-secondary" href="/kependudukan/rumah-tangga/impor">
            Impor RTM
          </Link>
        ) : null}
      </div>
      {bolehTambah ? (
        <Link className="button button-primary" href="/kependudukan/rumah-tangga/baru">
          + Tambah Rumah Tangga
        </Link>
      ) : null}
    </div>
  );
}
