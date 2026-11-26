/**
 * Logika murni form Identitas Desa (dapat diuji tanpa DOM/database).
 *
 * Dipakai komponen `identitas-desa-view.tsx` agar keputusan yang menentukan
 * perilaku (kapan Reset perlu dikonfirmasi, tab mana yang menjadi tujuan
 * tombol panah, pesan galat polygon, dan rentang dimensi logo) terpusat di
 * satu tempat yang sama dengan validasi server, bukan tersebar di handler UI.
 */

import {
  parseGeoJsonRings,
  validasiGeoJsonPolygon,
} from "@/features/pertanahan-gis/gis/domain/peta-cetak";

/**
 * True bila nilai form saat ini berbeda dari nilai tersimpan.
 *
 * Perbandingan dangkal atas seluruh kunci: `ProfilForm` hanya berisi string,
 * sehingga perubahan pada tab mana pun terdeteksi. Unggahan/hapusan media
 * tidak lewat form ini dan sengaja tidak dihitung sebagai perubahan tertunda.
 */
export function adaPerubahanBelumSimpan(
  tersimpan: Readonly<Record<string, string>>,
  kini: Readonly<Record<string, string>>,
): boolean {
  const kunci = new Set([...Object.keys(tersimpan), ...Object.keys(kini)]);
  for (const k of kunci) {
    if ((tersimpan[k] ?? "") !== (kini[k] ?? "")) return true;
  }
  return false;
}

/**
 * Totental indeks tab untuk navigasi keyboard (panah/Home/End).
 *
 * Panah membungkus di kedua ujung; Home/End langsung ke ujung; tombol lain
 * mempertahankan tab aktif. Seleksi mengikuti fokus (automatic activation)
 * agar `aria-selected` dan panel aktif tidak pernah tertinggal dari fokus.
 */
export function indeksTabTujuan(tombol: string, aktif: number, jumlah: number): number {
  if (jumlah <= 0) return 0;
  const dalamBatas = (n: number) => Math.min(jumlah - 1, Math.max(0, n));
  switch (tombol) {
    case "ArrowRight":
      return dalamBatas(aktif + 1) === aktif ? 0 : dalamBatas(aktif + 1);
    case "ArrowLeft":
      return dalamBatas(aktif - 1) === aktif ? jumlah - 1 : dalamBatas(aktif - 1);
    case "Home":
      return 0;
    case "End":
      return jumlah - 1;
    default:
      return dalamBatas(aktif);
  }
}

/**
 * Pesan galat untuk isian GeoJSON batas desa; `null` bila kosong atau sah.
 *
 * Memakai validator yang sama dengan server (`profilDesaSchema`) agar pesan
 * yang tampil sebelum simpan identik dengan yang ditolak server. Nilai yang
 * rusak tidak pernah diubah diam-diam: teks apa adanya tetap di form.
 */
export function pesanGalatBatasDesa(nilai: string): string | null {
  if (!nilai.trim()) return null;
  return validasiGeoJsonPolygon(nilai);
}

/** Jumlah titik pada polygon batas desa; 0 bila kosong atau tidak terbaca. */
export function jumlahTitikBatasDesa(nilai: string): number {
  return parseGeoJsonRings(nilai).reduce((total, ring) => total + ring.length, 0);
}

/** Rentang dimensi logo persegi warisan OpenSID (form `ukuran`). */
export const UKURAN_LOGO_MIN = 100;
export const UKURAN_LOGO_MAKS = 400;

export type HasilValidasiUkuranLogo =
  { ok: true; ukuran: number | null } | { ok: false; pesan: string };

/**
 * Validasi opsi dimensi logo (persegi) dari form unggah.
 *
 * Kosong berarti memakai dimensi bawaan (tidak ada transformasi). Nilai lain
 * wajib bilangan bulat 100–400. Dipakai di UI dan divalidasi ulang di server
 * lewat route media; tanpa migrasi karena ukuran hanya opsi transformasi
 * satu kali, bukan pengaturan persisten.
 */
export function validasiUkuranLogo(nilai: string | null | undefined): HasilValidasiUkuranLogo {
  const bersih = nilai?.trim() ?? "";
  if (bersih === "") return { ok: true, ukuran: null };
  if (!/^\d+$/.test(bersih)) {
    return { ok: false, pesan: "Dimensi logo harus bilangan bulat." };
  }
  const ukuran = Number(bersih);
  if (ukuran < UKURAN_LOGO_MIN || ukuran > UKURAN_LOGO_MAKS) {
    return {
      ok: false,
      pesan: `Dimensi logo harus antara ${UKURAN_LOGO_MIN} dan ${UKURAN_LOGO_MAKS} piksel.`,
    };
  }
  return { ok: true, ukuran };
}
