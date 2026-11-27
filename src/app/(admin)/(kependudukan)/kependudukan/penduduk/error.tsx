"use client";

import { Button } from "@/components/ui/button";

/**
 * Batas error modul penduduk.
 *
 * Pesan asli tidak ditampilkan karena dapat memuat detail internal; pengguna
 * mendapat langkah pemulihan yang jelas dan bisa mencoba memuat ulang.
 */
export default function PendudukError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="modul-page">
      <section className="platform-card penduduk-error-card">
        <span className="eyebrow">Data Penduduk</span>
        <h1>Data penduduk tidak dapat dimuat</h1>
        <p>Terjadi kesalahan saat mengambil data.</p>
        <Button variant="primary" onClick={reset} type="button">
          Coba lagi
        </Button>
      </section>
    </div>
  );
}
