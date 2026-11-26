"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import type { FeatureGroup, Map as LeafletMap } from "leaflet";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import {
  bentukGeoJsonDariRings,
  geojsonKeGpx,
  geometriDariGeoJson,
  ringsWilayah,
  TILE_PETA,
  type KoordinatWilayah,
} from "@/features/info-desa/wilayah/domain/peta-wilayah";
import {
  normalisasiTipePeta,
  WARNA_AREA_DEFAULT,
  WARNA_BORDER_DEFAULT,
  ZOOM_PETA_DEFAULT,
  type WilayahDTO,
} from "@/features/info-desa/wilayah/domain/wilayah";
import { simpanBatasWilayahAction } from "@/features/info-desa/wilayah/presentation/actions";
import { createIdleActionState } from "@/lib/action-state";

type PetaGeoman = LeafletMap & {
  pm: { addControls: (opsi: Record<string, boolean | string>) => void };
};

type LapisanBerGeometri = { toGeoJSON: () => unknown };

const LABEL = (row: WilayahDTO) =>
  [
    row.dusun ? `Dusun ${row.dusun}` : "",
    row.rw ? `RW ${row.rw}` : "",
    row.rt ? `RT ${row.rt}` : "",
  ]
    .filter(Boolean)
    .join(" · ") || "Wilayah";

function unduh(isi: Blob, nama: string) {
  const url = URL.createObjectURL(isi);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = nama;
  tautan.click();
  URL.revokeObjectURL(url);
}

/** Dialog gambar/edit batas wilayah beserta impor dan ekspor berkas GIS. */
export function EditorBatas({ row }: { row: WilayahDTO }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const kontainerRef = useRef<HTMLDivElement>(null);
  const petaRef = useRef<LeafletMap | null>(null);
  const grupRef = useRef<FeatureGroup | null>(null);
  const router = useRouter();
  const id = useId();
  const [terbuka, setTerbuka] = useState(false);
  const [path, setPath] = useState(row.path);
  const [warna, setWarna] = useState(row.warna ?? WARNA_AREA_DEFAULT);
  const [border, setBorder] = useState(row.border ?? WARNA_BORDER_DEFAULT);
  const [zoom, setZoom] = useState(row.zoom ?? ZOOM_PETA_DEFAULT);
  const [galat, setGalat] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    simpanBatasWilayahAction,
    createIdleActionState<null>(),
  );

  useEffect(() => {
    if (!terbuka || !kontainerRef.current) return;
    let dibuang = false;

    (async () => {
      const L = await import("leaflet");
      await import("@geoman-io/leaflet-geoman-free");
      if (dibuang || !kontainerRef.current) return;

      const tile = TILE_PETA[normalisasiTipePeta(row.mapTipe)];
      const peta = L.map(kontainerRef.current, { center: [-2.5, 118], zoom: 5 }) as PetaGeoman;
      L.tileLayer(tile.url, { attribution: tile.atribusi, maxZoom: tile.maxZoom }).addTo(peta);
      const grup = L.featureGroup().addTo(peta);
      grupRef.current = grup;
      petaRef.current = peta;

      const sinkron = () => {
        const rings: KoordinatWilayah[][] = [];
        grup.eachLayer((lapisan) => {
          const geometri = (lapisan as unknown as LapisanBerGeometri).toGeoJSON();
          rings.push(...ringsWilayah(JSON.stringify(geometri)));
        });
        setPath(bentukGeoJsonDariRings(rings));
      };

      function gambarUlang(geo: string) {
        grup.clearLayers();
        if (!geo) return;
        try {
          const lapisan = L.geoJSON(JSON.parse(geo) as GeoJSON.GeoJsonObject, {
            style: { color: border, fillColor: warna, fillOpacity: 0.2, weight: 2 },
          });
          lapisan.eachLayer((item) => grup.addLayer(item));
          const batas = lapisan.getBounds();
          if (batas.isValid()) peta.fitBounds(batas, { padding: [24, 24] });
        } catch {
          setGalat("Geometri tersimpan tidak dapat dibaca.");
        }
      }

      if (row.path) gambarUlang(row.path);

      peta.pm.addControls({
        position: "topleft",
        drawPolygon: true,
        drawMarker: false,
        drawCircle: false,
        drawCircleMarker: false,
        drawPolyline: false,
        drawRectangle: false,
        drawText: false,
        editMode: true,
        dragMode: false,
        cutPolygon: false,
        removalMode: true,
        rotateMode: false,
      });

      peta.on("pm:create", (event) => {
        const lapisan = (event as unknown as { layer: LapisanBerGeometri }).layer;
        grup.addLayer(lapisan as never);
        sinkron();
      });
      peta.on("pm:update", sinkron);
      peta.on("pm:remove", (event) => {
        const lapisan = (event as unknown as { layer: unknown }).layer;
        grup.removeLayer(lapisan as never);
        sinkron();
      });
      peta.on("zoomend", () => setZoom(peta.getZoom()));

      (peta as unknown as { muatUlang: (geo: string) => void }).muatUlang = gambarUlang;
      (peta as unknown as { sinkronBatas: () => void }).sinkronBatas = sinkron;
      window.setTimeout(() => {
        if (petaRef.current === peta) peta.invalidateSize();
      }, 50);
    })();

    return () => {
      dibuang = true;
      petaRef.current?.remove();
      petaRef.current = null;
      grupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terbuka]);

  useEffect(() => {
    if (state.status !== "success") return;
    dialogRef.current?.close();
    router.refresh();
  }, [state, router]);

  useEffect(() => {
    grupRef.current?.setStyle({ color: border, fillColor: warna, fillOpacity: 0.2, weight: 2 });
  }, [warna, border]);

  function tutup() {
    dialogRef.current?.close();
    setTerbuka(false);
    setGalat(null);
  }

  function gambarUlang(geo: string) {
    const peta = petaRef.current as (LeafletMap & { muatUlang?: (nilai: string) => void }) | null;
    peta?.muatUlang?.(geo);
  }

  function sinkron() {
    const peta = petaRef.current as (LeafletMap & { sinkronBatas?: () => void }) | null;
    peta?.sinkronBatas?.();
  }

  async function imporBerkas(file: File | undefined) {
    if (!file) return;
    setGalat(null);
    const ekstensi = file.name.split(".").pop()?.toLowerCase();
    try {
      let geojson: unknown;
      if (ekstensi === "gpx") {
        const { gpx } = await import("@tmcw/togeojson");
        geojson = gpx(new DOMParser().parseFromString(await file.text(), "application/xml"));
      } else if (ekstensi === "shp" || ekstensi === "zip") {
        const shp = (await import("shpjs")).default;
        const hasil = await shp(await file.arrayBuffer());
        geojson = Array.isArray(hasil) ? hasil[0] : hasil;
      } else {
        setGalat("Format berkas harus GPX, SHP, atau ZIP berisi SHP.");
        return;
      }

      const geo = geometriDariGeoJson(JSON.stringify(geojson));
      if (!geo) {
        setGalat("Berkas tidak berisi polygon yang dapat dipakai sebagai batas.");
        return;
      }
      setPath(geo);
      gambarUlang(geo);
    } catch {
      setGalat("Berkas gagal dibaca. Pastikan formatnya benar.");
    }
  }

  function kosongkan() {
    setPath("");
    kelompokKosong();
    setGalat(null);
  }

  function kelompokKosong() {
    grupRef.current?.clearLayers();
  }

  function eksporGpx() {
    if (!path) {
      setGalat("Belum ada batas untuk diekspor.");
      return;
    }
    unduh(
      new Blob([geojsonKeGpx(path, LABEL(row))], { type: "application/gpx+xml" }),
      `batas-${row.id}.gpx`,
    );
  }

  async function eksporShp() {
    if (!path) {
      setGalat("Belum ada batas untuk diekspor.");
      return;
    }
    try {
      const { zip } = await import("@mapbox/shp-write");
      const geometri = JSON.parse(path) as GeoJSON.Geometry;
      const koleksi: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: geometri }],
      };
      const hasil = await zip<"blob">(koleksi, {
        folder: "wilayah",
        filename: `batas-${row.id}`,
        compression: "DEFLATE",
        outputType: "blob",
      });
      unduh(hasil, `batas-${row.id}.zip`);
    } catch {
      setGalat("Ekspor SHP gagal.");
    }
  }

  async function eksporPng() {
    if (!kontainerRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(kontainerRef.current);
      const tautan = document.createElement("a");
      tautan.href = dataUrl;
      tautan.download = `batas-${row.id}.png`;
      tautan.click();
    } catch {
      setGalat("Ekspor gambar gagal karena tile peta dibatasi; gunakan Cetak.");
    }
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
        Batas
      </button>

      <dialog
        aria-labelledby={`${id}-judul`}
        className="platform-dialog wilayah-peta-dialog"
        onClose={() => setTerbuka(false)}
        ref={dialogRef}
      >
        <div className="platform-dialog-head">
          <div>
            <h2 id={`${id}-judul`}>Batas Dusun/RW/RT — {LABEL(row)}</h2>
            <p>Gambar polygon, sunting sudutnya, lalu simpan.</p>
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

        <div className="wilayah-peta-toolbar">
          <label>
            Warna area
            <input onChange={(event) => setWarna(event.target.value)} type="color" value={warna} />
          </label>
          <label>
            Warna garis
            <input
              onChange={(event) => setBorder(event.target.value)}
              type="color"
              value={border}
            />
          </label>
          <button
            className="button button-ghost"
            disabled={!path}
            onClick={eksporGpx}
            type="button"
          >
            GPX
          </button>
          <button
            className="button button-ghost"
            disabled={!path}
            onClick={eksporShp}
            type="button"
          >
            SHP
          </button>
          <button
            className="button button-ghost"
            disabled={!path}
            onClick={eksporPng}
            type="button"
          >
            PNG
          </button>
          <button
            className="button button-ghost"
            disabled={!path}
            onClick={kosongkan}
            type="button"
          >
            Kosongkan
          </button>
        </div>

        <div className="wilayah-peta-toolbar">
          <label>
            Impor GPX/SHP
            <input
              accept=".gpx,.shp,.zip"
              onChange={(event) => {
                void imporBerkas(event.target.files?.[0]);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          <button className="button button-ghost" disabled={!path} onClick={sinkron} type="button">
            Perbarui geometri
          </button>
        </div>

        {galat ? (
          <p className="alert alert-error" role="alert">
            {galat}
          </p>
        ) : null}

        <div className="wilayah-peta-kanvas" ref={kontainerRef} />

        <form action={formAction} className="platform-dialog-form">
          <input name="id" type="hidden" value={row.id} />
          <input name="path" type="hidden" value={path} />
          <input name="zoom" type="hidden" value={zoom} />
          <input name="warna" type="hidden" value={warna} />
          <input name="border" type="hidden" value={border} />

          <p className="modul-hint">
            {path
              ? `Batas tersimpan: ${path.length.toLocaleString("id-ID")} karakter`
              : "Belum ada batas."}
          </p>

          {state.status === "error" ? (
            <p className="alert alert-error" role="alert">
              {state.message}
            </p>
          ) : null}

          <div className="platform-dialog-actions">
            <button className="button button-secondary" onClick={tutup} type="button">
              Batal
            </button>
            <button className="button button-primary" disabled={pending} type="submit">
              {pending ? "Menyimpan…" : "Simpan Batas Dusun/RW/RT"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
