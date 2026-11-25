"use client";

import { useId, useRef, useState } from "react";

import type { TipePeta } from "@/features/wilayah/domain/wilayah";
import { PemilihTitikPeta } from "@/features/wilayah/presentation/pemilih-titik-peta";

/** Dialog pemilih titik kantor desa; hasilnya ditulis ke isian koordinat. */
export function PemilihKoordinatKantor({
  nilai,
  tipePeta,
  onTipePetaChange,
  onPilih,
}: {
  nilai: string;
  tipePeta: TipePeta;
  onTipePetaChange: (tipe: TipePeta) => void;
  /** Koordinat hasil pilihan; string kosong berarti titik dihapus. */
  onPilih: (koordinat: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [terbuka, setTerbuka] = useState(false);

  function tutup() {
    dialogRef.current?.close();
    setTerbuka(false);
  }

  return (
    <>
      <button
        className="button button-ghost"
        onClick={() => {
          setTerbuka(true);
          dialogRef.current?.showModal();
        }}
        type="button"
      >
        Pilih di Peta
      </button>

      <dialog
        aria-labelledby={`${id}-judul`}
        className="platform-dialog wilayah-peta-dialog"
        onClose={() => setTerbuka(false)}
        ref={dialogRef}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${id}-judul`}>Lokasi kantor desa</h2>
            <p>Ketik alamat, klik peta, atau geser penanda.</p>
          </div>
          <button
            aria-label="Tutup dialog"
            className="platform-dialog-close"
            onClick={tutup}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Dipasang hanya saat dialog terbuka agar titik awal selalu mengikuti isian terbaru. */}
        {terbuka ? (
          <PemilihTitikPeta
            aktif
            koordinatAwal={nilai}
            onTipePetaChange={onTipePetaChange}
            onTitikChange={(perubahan) => onPilih(perubahan.koordinat ?? "")}
            tipePeta={tipePeta}
          />
        ) : null}

        <div className="platform-dialog-actions">
          <button className="button button-primary" onClick={tutup} type="button">
            Selesai
          </button>
        </div>
      </dialog>
    </>
  );
}
