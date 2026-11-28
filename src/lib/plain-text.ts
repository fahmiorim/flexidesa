/**
 * Teks polos dari HTML: buang script/style/tag, decode entitas umum,
 * rapatkan whitespace. Bila `max` diberikan, hasil dipotong sepanjang itu.
 * Satu-satunya pembersih teks untuk halaman publik & admin.
 */
export function plainText(value: string | null | undefined, max?: number): string {
  const teks = (value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return max === undefined ? teks : teks.slice(0, max);
}
