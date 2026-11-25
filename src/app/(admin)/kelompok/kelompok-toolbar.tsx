import Link from "next/link";

import { ConfirmSubmit } from "@/components/ui/confirm-submit";

import styles from "./kelompok.module.css";

/**
 * Grup tombol daftar kelompok (paritas baris tombol OpenSID):
 * Kelola (Tambah, Hapus), Laporan (Cetak, Unduh), Lainnya (Kategori, Bersihkan).
 *
 * Komponen ini berada di dalam form hapus massal, sehingga tombol Hapus
 * mengirim checkbox baris yang dicentang.
 */
export function KelompokToolbar({
  bolehTambah,
  bolehHapus,
  cetakHref,
  unduhHref,
}: {
  bolehTambah: boolean;
  bolehHapus: boolean;
  cetakHref: string;
  unduhHref: string;
}) {
  return (
    <div className={styles.buttonGroups}>
      <div className={styles.buttonGroup} role="group" aria-label="Kelola kelompok">
        <span className={styles.buttonGroupLabel}>Kelola</span>
        {bolehTambah ? (
          <Link className="button button-primary" href="/kelompok/baru">
            + Tambah
          </Link>
        ) : null}
        {bolehHapus ? (
          <ConfirmSubmit
            className="button button-danger"
            message="Hapus kelompok yang dicentang? Kelompok yang masih memiliki anggota akan dilewati."
          >
            Hapus Terpilih
          </ConfirmSubmit>
        ) : null}
      </div>

      <div className={styles.buttonGroup} role="group" aria-label="Laporan kelompok">
        <span className={styles.buttonGroupLabel}>Laporan</span>
        <Link className="button button-secondary" href={cetakHref} target="_blank">
          Cetak
        </Link>
        <Link className="button button-secondary" href={unduhHref}>
          Unduh
        </Link>
      </div>

      <div className={styles.buttonGroup} role="group" aria-label="Lainnya">
        <Link className="button button-secondary" href="/kelompok/kategori">
          Kategori
        </Link>
        <Link
          className="button button-secondary"
          href="/kelompok"
          title="Kembalikan filter ke bawaan (Status: Aktif)"
        >
          Bersihkan
        </Link>
      </div>
    </div>
  );
}
