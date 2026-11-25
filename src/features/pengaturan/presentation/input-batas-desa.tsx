"use client";

import { useId, useState } from "react";

import { parseGeoJsonRings } from "@/features/gis/domain/peta-cetak";
import {
  jumlahTitikBatasDesa,
  pesanGalatBatasDesa,
} from "@/features/pengaturan/domain/identitas-form";

import styles from "./pengaturan-desa.module.css";

const LEBAR = 360;
const TINGGI = 200;
const PADDING = 12;

/**
 * Pratinjau polygon batas desa tanpa library peta baru.
 *
 * Bentuk digambar sebagai SVG dari ring GeoJSON yang sama dengan yang dibaca
 * server (`parseGeoJsonRings`), jadi pratinjau tidak pernah menampilkan bentuk
 * yang berbeda dari yang akan tersimpan. Tidak ada normalisasi: teks GeoJSON
 * asli tetap di textarea dan hanya dibaca untuk digambar.
 */
function PratinjauPolygon({ geojson }: { geojson: string }) {
  const rings = parseGeoJsonRings(geojson);
  const titik = rings.flat();
  if (titik.length < 3) return null;

  const minLat = Math.min(...titik.map((t) => t.lat));
  const maxLat = Math.max(...titik.map((t) => t.lat));
  const minLon = Math.min(...titik.map((t) => t.lon));
  const maxLon = Math.max(...titik.map((t) => t.lon));
  const spanLon = Math.max(1e-9, maxLon - minLon);
  const spanLat = Math.max(1e-9, maxLat - minLat);
  const skala = Math.min((LEBAR - PADDING * 2) / spanLon, (TINGGI - PADDING * 2) / spanLat);

  return (
    <svg
      className={styles.polygonPreview}
      viewBox={`0 0 ${LEBAR} ${TINGGI}`}
      role="img"
      aria-label={`Pratinjau polygon batas desa, ${titik.length} titik`}
    >
      {rings.map((ring, index) => (
        <polygon
          key={index}
          // Sumbu Y SVG bertambah ke bawah; bujur (lon) → X, lintang (lat) dibalik.
          points={ring
            .map(
              (t) => `${(t.lon - minLon) * skala + PADDING},${(maxLat - t.lat) * skala + PADDING}`,
            )
            .join(" ")}
          fill="#8b22ef22"
          stroke="#6b21d6"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

/**
 * Isian GeoJSON batas desa dengan validasi inline dan pratinjau.
 *
 * Nilai yang tidak valid tidak pernah ditimpa/dinormalkan: pesan galat tampil
 * di bawah isian, dan tombol simpan berada di luar komponen ini sehingga
 * validasi akhir tetap dijalankan ulang oleh server.
 */
export function InputBatasDesa({
  nilai,
  onChange,
  label = "GeoJSON Polygon Batas Desa",
}: {
  nilai: string;
  onChange: (nilai: string) => void;
  /** Label isian; mempertahankan sebutan desa dari pemanggil. */
  label?: string;
}) {
  const id = useId();
  const [galatImpor, setGalatImpor] = useState<string | null>(null);
  const galat = galatImpor ?? pesanGalatBatasDesa(nilai);
  const jumlahTitik = jumlahTitikBatasDesa(nilai);

  async function imporBerkas(file: File | undefined) {
    if (!file) return;
    setGalatImpor(null);
    try {
      const teks = await file.text();
      // Terima berkas GeoJSON mentah maupun Feature/FeatureCollection:
      // ambil geometri pertama yang berbentuk Polygon sesuai kontrak batasDesa.
      let geojson: unknown = JSON.parse(teks);
      const longgar = geojson as {
        type?: string;
        features?: Array<{ geometry?: unknown }>;
      };
      if (longgar?.type === "FeatureCollection" && Array.isArray(longgar.features)) {
        geojson = longgar.features.find((f) => f?.geometry)?.geometry ?? longgar;
      } else if (longgar?.type === "Feature") {
        geojson = (longgar as { geometry?: unknown }).geometry ?? longgar;
      }
      const teksGeometri = JSON.stringify(geojson);
      const pesan = pesanGalatBatasDesa(teksGeometri);
      if (pesan) {
        setGalatImpor(pesan);
        return;
      }
      onChange(teksGeometri);
    } catch {
      setGalatImpor("Berkas bukan JSON GeoJSON yang dapat dibaca.");
    }
  }

  return (
    <div className={styles.field}>
      <label htmlFor={`${id}-geojson`}>{label}</label>
      <textarea
        id={`${id}-geojson`}
        rows={7}
        value={nilai}
        aria-invalid={galat ? true : undefined}
        aria-describedby={`${id}-bantuan`}
        onChange={(e) => {
          setGalatImpor(null);
          onChange(e.target.value);
        }}
        placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat],[lng,lat],[lng,lat]]]}'
      />
      <p className={styles.fieldHint} id={`${id}-bantuan`}>
        Tempel GeoJSON Polygon atau impor berkas .geojson. Tanpa editor peta interaktif, bentuk
        dapat diperbaiki lewat titik di teks (atau impor ulang) — semua titik asli tetap terlihat
        dan tidak dihapus otomatis.
      </p>
      <label className={styles.uploadButton}>
        Impor berkas .geojson
        <input
          accept=".geojson,.json,application/geo+json,application/json"
          type="file"
          onChange={(e) => {
            void imporBerkas(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {nilai.trim() && !galat ? (
        <>
          <PratinjauPolygon geojson={nilai} />
          <p className={styles.fieldHint}>{jumlahTitik} titik terdeteksi pada polygon.</p>
        </>
      ) : null}
      {galat ? (
        <p className={styles.error} role="alert">
          {galat}
        </p>
      ) : null}
    </div>
  );
}
