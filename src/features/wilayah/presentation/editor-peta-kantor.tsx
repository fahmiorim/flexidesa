"use client";

import "leaflet/dist/leaflet.css";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { parseKoordinat, titikKeGpx } from "@/features/wilayah/domain/peta-wilayah";
import {
  normalisasiTipePeta,
  ZOOM_PETA_DEFAULT,
  type TipePeta,
  type WilayahDTO,
} from "@/features/wilayah/domain/wilayah";
import { simpanPetaKantorAction } from "@/features/wilayah/presentation/actions";
import { PemilihTitikPeta } from "@/features/wilayah/presentation/pemilih-titik-peta";
import { createIdleActionState } from "@/lib/action-state";

const LABEL = (row: WilayahDTO) =>
  [
    row.dusun ? `Dusun ${row.dusun}` : "",
    row.rw ? `RW ${row.rw}` : "",
    row.rt ? `RT ${row.rt}` : "",
  ]
    .filter(Boolean)
    .join(" · ") || "Wilayah";

/** Dialog penempatan titik kantor wilayah beserta zoom dan tipe peta. */
export function EditorPetaKantor({ row }: { row: WilayahDTO }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const id = useId();
  const [terbuka, setTerbuka] = useState(false);
  const [mapTipe, setMapTipe] = useState<TipePeta>(normalisasiTipePeta(row.mapTipe));
  const [koordinat, setKoordinat] = useState(row.koordinat ?? "");
  const [zoom, setZoom] = useState(row.zoom ?? ZOOM_PETA_DEFAULT);
  const [state, formAction, pending] = useActionState(
    simpanPetaKantorAction,
    createIdleActionState<null>(),
  );

  useEffect(() => {
    if (state.status !== "success") return;
    dialogRef.current?.close();
    router.refresh();
  }, [state, router]);

  function tutup() {
    dialogRef.current?.close();
    setTerbuka(false);
  }

  function unduhGpx() {
    const titik = parseKoordinat(koordinat);
    if (!titik) return;
    const isi = titikKeGpx(titik.lat, titik.lng, LABEL(row));
    const url = URL.createObjectURL(new Blob([isi], { type: "application/gpx+xml" }));
    const tautan = document.createElement("a");
    tautan.href = url;
    tautan.download = `kantor-wilayah-${row.id}.gpx`;
    tautan.click();
    URL.revokeObjectURL(url);
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
        Peta Kantor
      </button>

      <dialog
        aria-labelledby={`${id}-judul`}
        className="platform-dialog wilayah-peta-dialog"
        onClose={() => setTerbuka(false)}
        ref={dialogRef}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${id}-judul`}>Peta kantor — {LABEL(row)}</h2>
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
            koordinatAwal={koordinat}
            onTipePetaChange={setMapTipe}
            onTitikChange={(perubahan) => {
              setKoordinat(perubahan.koordinat ?? "");
              setZoom(perubahan.zoom);
            }}
            tipePeta={mapTipe}
            zoomAwal={zoom}
          />
        ) : null}

        <form action={formAction} className="platform-dialog-form">
          <input name="id" type="hidden" value={row.id} />
          <input name="koordinat" type="hidden" value={koordinat} />
          <input name="zoom" type="hidden" value={zoom} />
          <input name="mapTipe" type="hidden" value={mapTipe} />

          {state.status === "error" ? (
            <p className="alert alert-error" role="alert">
              {state.message}
            </p>
          ) : null}

          <div className="platform-dialog-actions">
            <button
              className="button button-ghost"
              disabled={!koordinat}
              onClick={unduhGpx}
              type="button"
            >
              Ekspor GPX
            </button>
            <button className="button button-secondary" onClick={tutup} type="button">
              Batal
            </button>
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? "Menyimpan…" : "Simpan Peta Kantor"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
