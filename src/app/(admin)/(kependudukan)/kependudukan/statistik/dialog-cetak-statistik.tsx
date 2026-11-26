"use client";

import { useState } from "react";

import type { PejabatPenandatanganStatistik } from "@/features/kependudukan/statistik/domain/statistik-kependudukan";

import styles from "./statistik-kependudukan.module.css";

/**
 * Dialog penandatanganan sebelum cetak/PDF.
 *
 * Mengikuti alur OpenSID: operator memilih pejabat dan mengisi nomor laporan
 * sebelum dokumen dihasilkan. Halaman cetak dibuka di tab baru agar halaman
 * admin tetap terbuka.
 */
export function DialogCetakStatistik({
  pejabat,
  cetakHref,
  pdfHref,
}: {
  pejabat: readonly PejabatPenandatanganStatistik[];
  cetakHref: string;
  pdfHref: string;
}) {
  const bawaan =
    pejabat.find((item) => item.jenisJabatan === "kades") ??
    pejabat.find((item) => item.jenisJabatan === "sekdes") ??
    pejabat[0];
  const [mode, setMode] = useState<"cetak" | "pdf" | null>(null);
  const [ttdId, setTtdId] = useState(bawaan ? String(bawaan.id) : "");
  const [nomor, setNomor] = useState("");
  const [galat, setGalat] = useState("");

  const buka = (jenis: "cetak" | "pdf") => {
    setGalat("");
    setMode(jenis);
  };

  const kirim = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const signer = pejabat.find((item) => String(item.id) === ttdId);
    if (!signer) {
      setGalat("Pilih pejabat penanda tangan terlebih dahulu.");
      return;
    }
    const nomorBersih = nomor.trim();
    if (!nomorBersih) {
      setGalat("Nomor laporan wajib diisi.");
      return;
    }

    const query = new URLSearchParams({ ttd: String(signer.id), nomor: nomorBersih });
    const dasar = mode === "pdf" ? pdfHref : `${cetakHref}&auto=1`;
    const url = `${dasar}${dasar.includes("?") ? "&" : "?"}${query.toString()}`;
    setMode(null);

    if (mode === "pdf") {
      // Unduhan PDF memakai anchor sementara: memicu unduhan tanpa navigasi
      // halaman, sehingga state dialog dan halaman statistik tetap utuh.
      const tautan = document.createElement("a");
      tautan.href = url;
      tautan.rel = "noopener";
      document.body.append(tautan);
      tautan.click();
      tautan.remove();
    } else window.open(url, "_blank", "noopener");
  };

  return (
    <>
      <div className={styles.tableActions}>
        <button className="button button-secondary" type="button" onClick={() => buka("cetak")}>
          Cetak
        </button>
        <button className="button button-primary" type="button" onClick={() => buka("pdf")}>
          Unduh PDF
        </button>
      </div>

      {mode ? (
        <div
          className={styles.dialogOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMode(null);
          }}
          role="presentation"
        >
          <div
            aria-labelledby="judul-dialog-ttd"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <h2 id="judul-dialog-ttd">Penandatanganan Laporan</h2>
            <p>Laporan statistik akan dicetak dengan nama dan nomor yang dipilih.</p>
            <form onSubmit={kirim}>
              <label>
                Laporan ditandatangani
                <select value={ttdId} onChange={(event) => setTtdId(event.target.value)}>
                  {pejabat.length === 0 ? <option value="">Belum ada pejabat aktif</option> : null}
                  {pejabat.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                      {item.jabatan ? ` (${item.jabatan})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nomor laporan
                <input
                  maxLength={100}
                  onChange={(event) => setNomor(event.target.value)}
                  placeholder="Contoh: 470/12/2026"
                  value={nomor}
                />
              </label>
              {galat ? (
                <p className={styles.dialogError} role="alert">
                  {galat}
                </p>
              ) : null}
              <div className={styles.dialogActions}>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setMode(null)}
                >
                  Batal
                </button>
                <button className="button button-primary" type="submit">
                  {mode === "pdf" ? "Unduh PDF" : "Cetak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
