/** Data perangkat yang diperlukan untuk identitas kepala desa. */
type PerangkatKepalaDesa = {
  nama: string;
  gelarDepan: string | null;
  gelarBelakang: string | null;
  nip: string | null;
};

/** Nama lengkap kepala desa dari data perangkat, termasuk gelar. */
export function namaLengkapKepalaDesa(perangkat: PerangkatKepalaDesa): string {
  return [perangkat.gelarDepan, perangkat.nama, perangkat.gelarBelakang]
    .map((bagian) => (bagian ?? "").trim())
    .filter((bagian) => bagian !== "")
    .join(" ")
    .replace(/\s+/g, " ");
}
