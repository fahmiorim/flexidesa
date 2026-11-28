import { StatCard } from "@/components/ui/stat-card";
import type { StatusIndikator } from "@/features/kependudukan/kesehatan/domain/kesehatan";

import styles from "./stunting.module.css";

export const angka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
export const persen = (nilai: number) => `${angka.format(nilai)}%`;

/**
 * Judul kolom indikator pada rekapitulasi.
 */
export const LABEL_INDIKATOR_IBU: Record<string, string> = {
  periksa_kehamilan: "Periksa Kehamilan",
  pil_fe: "Pil Fe",
  pemeriksaan_nifas: "Periksa Nifas",
  konseling_gizi: "Konseling Gizi",
  kunjungan_rumah: "Kunjungan Rumah",
  akses_air_bersih: "Air Bersih",
  kepemilikan_jamban: "Jamban",
  jaminan_kesehatan: "Jaminan Kesehatan",
};

export const LABEL_INDIKATOR_ANAK: Record<string, string> = {
  imunisasi: "Imunisasi",
  pengukuran_berat_badan: "Berat Badan",
  pengukuran_tinggi_badan: "Tinggi Badan",
  konseling_gizi: "Konseling Gizi",
  kunjungan_rumah: "Kunjungan Rumah",
  air_bersih: "Air Bersih",
  jamban_sehat: "Jamban",
  akta_lahir: "Akta Lahir",
  jaminan_kesehatan: "Jaminan Kesehatan",
  pengasuhan_paud: "Pengasuhan (PAUD)",
};

/** Badge status indikator. `TS` (tidak seharusnya) ditulis `-`. */
export function Penanda({ status }: { status: StatusIndikator }) {
  const kelas =
    status === "Y" ? styles.badgeHijau : status === "T" ? styles.badgeMerah : styles.badgeNetral;
  return <span className={`${styles.badge} ${kelas}`}>{status === "TS" ? "-" : status}</span>;
}

export function BadgeAngka({ nilai, hijau }: { nilai: number; hijau?: boolean }) {
  return (
    <span className={`${styles.badge} ${hijau ? styles.badgeHijau : styles.badgeNetral}`}>
      {angka.format(nilai)}
    </span>
  );
}

/** Batang capaian persen; ambang warna 80% dan 60%. */
export function BatangPersen({ nilai }: { nilai: number }) {
  const kelas =
    nilai >= 80 ? styles.batangHijau : nilai >= 60 ? styles.batangKuning : styles.batangMerah;
  return (
    <div className={styles.batang}>
      <span className={kelas} style={{ width: `${Math.min(100, Math.max(0, nilai))}%` }}>
        <small>{persen(nilai)}</small>
      </span>
    </div>
  );
}

export function Kpi({
  label,
  nilai,
  kecil,
  utama,
}: {
  label: string;
  nilai: string;
  kecil?: string;
  utama?: boolean;
}) {
  return <StatCard label={label} note={kecil} utama={utama} value={nilai} />;
}
