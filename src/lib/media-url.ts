/**
 * URL media publik tenant.
 *
 * Satu-satunya pembangun URL `/api/publik/media/…` untuk halaman publik.
 * Nilai `value` adalah path media yang tersimpan (relatif, tanpa awalan
 * villageId diperbolehkan); hasil selalu terikat ke `villageId` tenant agar
 * media antar-desa tidak tercampur. Path yang kosong, atau mengandung
 * segmen `.`/`..`, ditolak → `null`.
 */
export function mediaUrl(value: string | null | undefined, villageId: number): string | null {
  if (!value) return null;
  const parts = value.split(/[\\/]/).filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === ".." || part.includes(".."))) {
    return null;
  }
  const safe = parts[0] === String(villageId) ? parts : [String(villageId), ...parts];
  return `/api/publik/media/${safe.map(encodeURIComponent).join("/")}`;
}
