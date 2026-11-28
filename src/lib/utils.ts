/**
 * Slug URL dari teks bebas: huruf kecil, aksen ditransliterasi
 * (é → e), setiap run karakter non-alfanumerik jadi satu strip,
 * strip di ujung dibuang. Satu-satunya pembangun slug di codebase.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
