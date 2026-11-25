"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Pembagi form panjang menjadi beberapa langkah yang ditampilkan satu per satu.
 *
 * Setiap anak adalah satu kelompok (fieldset) dengan judul dari prop
 * `judulLangkah`. Hanya langkah aktif yang ditampilkan; langkah lain tetap
 * terpasang di DOM sehingga nilainya ikut terkirim saat formulir disimpan.
 * Tombol Lanjut memeriksa field wajib langkah aktif sebelum berpindah.
 */
export function FormLangkah({
  judulLangkah,
  children,
}: {
  judulLangkah: readonly string[];
  children: ReactNode;
}) {
  const langkah = Children.toArray(children);
  const jumlah = langkah.length;
  const [aktif, setAktif] = useState(0);
  const wadahRef = useRef<HTMLDivElement>(null);

  // Kembali ke langkah pertama setelah formulir di-reset (mis. setelah simpan berhasil).
  useEffect(() => {
    const form = wadahRef.current?.closest("form");
    if (!form) return;
    const padaReset = () => setAktif(0);
    form.addEventListener("reset", padaReset);
    return () => form.removeEventListener("reset", padaReset);
  }, []);

  function lanjut() {
    const form = wadahRef.current?.closest("form");
    const kelompok = wadahRef.current?.querySelector(`[data-langkah="${aktif}"]`);
    if (kelompok && form) {
      const wajib = kelompok.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[required]");
      for (const field of wajib) {
        if (!field.value.trim()) {
          field.reportValidity();
          return;
        }
      }
    }
    setAktif((index) => Math.min(index + 1, jumlah - 1));
  }

  return (
    <div className="pemerintahan-langkah" ref={wadahRef}>
      <div
        className="pemerintahan-langkah-indikator"
        aria-label={`Langkah ${aktif + 1} dari ${jumlah}`}
      >
        <span>
          Langkah {aktif + 1} dari {jumlah}
        </span>
        <strong>{judulLangkah[aktif]}</strong>
      </div>
      <ol className="pemerintahan-langkah-daftar">
        {judulLangkah.map((judul, index) => (
          <li
            aria-current={index === aktif ? "step" : undefined}
            className={index === aktif ? "is-active" : index < aktif ? "is-done" : undefined}
            key={judul}
          >
            {judul}
          </li>
        ))}
      </ol>
      {langkah.map((anak, index) => (
        <div data-langkah={index} hidden={index !== aktif} key={index}>
          {anak}
        </div>
      ))}
      <div className="pemerintahan-langkah-navigasi">
        <button
          className="button button-secondary"
          disabled={aktif === 0}
          onClick={() => setAktif((index) => Math.max(index - 1, 0))}
          type="button"
        >
          Kembali
        </button>
        <button
          className="button button-ghost"
          disabled={aktif === jumlah - 1}
          onClick={lanjut}
          type="button"
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}
