/**
 * Bangun URL media publik untuk berkas milik desa (logo, foto, dokumen).
 *
 * Jalur disimpan relatif di basis data dan wajib berada di dalam folder tenant
 * (`villageId`). Segmen yang mencoba keluar folder (`..`) ditolak agar URL yang
 * dirender tidak dapat menunjuk berkas tenant lain.
 */
export function urlMediaDesa(nilai: string | null | undefined, villageId: number): string | null {
  const bersih = nilai?.trim();
  if (!bersih) return null;

  const segmen = bersih.split(/[\\/]/).filter(Boolean);
  if (
    !segmen.length ||
    segmen.some((bagian) => bagian === "." || bagian === ".." || bagian.includes(".."))
  )
    return null;

  const jalur = segmen[0] === String(villageId) ? segmen : [String(villageId), ...segmen];
  return `/api/publik/media/${jalur.map(encodeURIComponent).join("/")}`;
}
