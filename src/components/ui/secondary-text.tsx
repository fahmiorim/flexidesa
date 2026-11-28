import type { ReactNode } from "react";

/**
 * Baris teks sekunder di bawah nilai utama (keterangan kecil, slug, kode).
 * Satu-satunya cara menampilkan teks sekunder di halaman admin; gayanya
 * berasal dari `.ui-secondary`, bukan kelas halaman.
 */
export function SecondaryText({ children }: { children: ReactNode }) {
  return <span className="ui-secondary">{children}</span>;
}
