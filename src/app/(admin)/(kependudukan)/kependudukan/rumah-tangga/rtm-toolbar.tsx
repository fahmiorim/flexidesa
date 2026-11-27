import { ButtonLink } from "@/components/ui/button-link";

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
        <ButtonLink variant="secondary" href="/kependudukan/rumah-tangga/laporan">
          Laporan RTM
        </ButtonLink>
        <ButtonLink variant="secondary" href={exportHref}>
          Ekspor CSV
        </ButtonLink>
        {bolehTambah ? (
          <ButtonLink variant="secondary" href="/kependudukan/rumah-tangga/impor">
            Impor RTM
          </ButtonLink>
        ) : null}
      </div>
      {bolehTambah ? (
        <ButtonLink variant="primary" href="/kependudukan/rumah-tangga/baru">
          + Tambah Rumah Tangga
        </ButtonLink>
      ) : null}
    </div>
  );
}
