// Cadangan fitur: teruji, belum dipakai produksi. Pertahankan bersama test-nya;
// hapus berkas + test-nya bila diputuskan tidak dipakai.
/** Menu navigasi situs publik. */

/** Setiap desa memiliki baris `menu_publik`. Form ini disinkronkan dengan
 * baris tersebut. Untuk instalasi baru bila belum ada menu, dipakai
 * `PUBLIC_NAV` bawaan.
 */

/** Baris menu yang aman dikirim ke komponen klien. */
export interface MenuRow {
  id: number;
  nama: string;
  link: string;
  linkTipe: string;
  parentId: number | null;
  urut: number;
  aktif: boolean;
}

/** Skema form menu publik. */

/**
 * Periksa apakah `parentId` boleh dipakai.
 *
 * Menu publik hanya mendukung satu tingkat induk. Menolak induk yang tidak ada,
 * menu itu sendiri, dan induk yang sudah punya induk lain (mencegah siklus).
 */
export function cekParentMenu(
  rows: Pick<MenuRow, "id" | "parentId">[],
  parentId: number | null | undefined,
  id?: number,
): string | null {
  if (parentId == null) return null;
  if (id !== undefined && parentId === id) {
    return "Menu tidak boleh menjadi induk dirinya sendiri.";
  }

  const induk = rows.find((row) => row.id === parentId);
  if (!induk) return "Menu induk tidak ditemukan.";
  if (induk.parentId !== null) return "Menu induk harus menu tingkat pertama.";

  return null;
}
