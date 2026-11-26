import { TIPE_PETA_DEFAULT, type TipePeta } from "@/features/info-desa/wilayah/domain/wilayah";
import { parseGeoJsonRings } from "@/features/pertanahan-gis/gis/domain/peta-cetak";

export interface TilePeta {
  url: string;
  atribusi: string;
  maxZoom: number;
}

/** Tile peta dasar yang tidak memerlukan API key. */
export const TILE_PETA: Record<TipePeta, TilePeta> = {
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    atribusi: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
  carto: {
    url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    atribusi: "© OpenStreetMap contributors © CARTO",
    maxZoom: 19,
  },
  "carto-dark": {
    url: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    atribusi: "© OpenStreetMap contributors © CARTO",
    maxZoom: 19,
  },
};

export interface KoordinatWilayah {
  lat: number;
  lng: number;
}

/** Baca teks `latitude, longitude` menjadi angka; `null` bila tidak sah. */
export function parseKoordinat(nilai: string): KoordinatWilayah | null {
  if (!nilai.trim()) return null;
  const bagian = nilai.split(",").map((item) => Number(item.trim()));
  const [lat, lng] = bagian;
  if (
    bagian.length !== 2 ||
    lat === undefined ||
    lng === undefined ||
    !bagian.every(Number.isFinite) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }
  return { lat, lng };
}

/** Tulis koordinat dengan enam desimal agar presisi titik stabil. */
export function formatKoordinat(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

const bulat = (nilai: number) => Math.round(nilai * 1e6) / 1e6;

/**
 * Ubah kumpulan ring (lintang/bujur) menjadi GeoJSON Polygon atau MultiPolygon.
 *
 * Ring dengan kurang dari tiga titik dibuang; ring terbuka ditutup otomatis.
 * Ring tanpa tiga titik tersisa menghasilkan string kosong.
 */
export function bentukGeoJsonDariRings(
  rings: ReadonlyArray<ReadonlyArray<KoordinatWilayah>>,
): string {
  const koordinat: number[][][] = [];

  for (const ring of rings) {
    const bersih = ring.filter(
      (titik) =>
        Number.isFinite(titik.lat) &&
        Number.isFinite(titik.lng) &&
        Math.abs(titik.lat) <= 90 &&
        Math.abs(titik.lng) <= 180,
    );
    if (bersih.length < 3) continue;

    const hasil = bersih.map((titik) => [bulat(titik.lng), bulat(titik.lat)]);
    const awal = hasil[0];
    const akhir = hasil[hasil.length - 1];
    if (!awal || !akhir) continue;
    if (awal[0] !== akhir[0] || awal[1] !== akhir[1]) hasil.push([...awal]);
    koordinat.push(hasil);
  }

  if (koordinat.length === 0) return "";
  return JSON.stringify(
    koordinat.length === 1
      ? { type: "Polygon", coordinates: koordinat }
      : { type: "MultiPolygon", coordinates: koordinat.map((ring) => [ring]) },
  );
}

/**
 * Normalisasi GeoJSON dari impor menjadi Polygon/MultiPolygon FlexiDesa.
 *
 * Menerima geometry tunggal, Feature, atau FeatureCollection (hasil GPX/SHP),
 * lalu menyatukan semua ring luar. String kosong atau tanpa polygon
 * menghasilkan `""`.
 */
/** Ring luar dari GeoJSON dalam bentuk koordinat Leaflet (lat/lng). */
export function ringsWilayah(path: string): KoordinatWilayah[][] {
  return parseGeoJsonRings(path).map((ring) =>
    ring.map((titik) => ({ lat: titik.lat, lng: titik.lon })),
  );
}

type GeoJsonLonggar = {
  type?: string;
  coordinates?: unknown;
  geometry?: GeoJsonLonggar | null;
  geometries?: unknown[];
  features?: unknown[];
};

function ringDariKoordinat(nilai: unknown): KoordinatWilayah[] | null {
  if (!Array.isArray(nilai) || nilai.length < 3) return null;
  const ring: KoordinatWilayah[] = [];
  for (const titik of nilai) {
    if (!Array.isArray(titik) || titik.length < 2) return null;
    const [lng, lat] = titik;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    ring.push({ lat, lng });
  }
  return ring;
}

function kumpulkanRings(node: GeoJsonLonggar | null | undefined, hasil: KoordinatWilayah[][]) {
  if (!node) return;
  if (node.type === "FeatureCollection" && Array.isArray(node.features)) {
    for (const fitur of node.features) kumpulkanRings(fitur as GeoJsonLonggar, hasil);
    return;
  }
  if (node.type === "Feature") {
    kumpulkanRings(node.geometry, hasil);
    return;
  }
  if (node.type === "GeometryCollection" && Array.isArray(node.geometries)) {
    for (const geometri of node.geometries) kumpulkanRings(geometri as GeoJsonLonggar, hasil);
    return;
  }
  if (node.type === "Polygon" || node.type === "MultiPolygon") {
    hasil.push(...ringsWilayah(JSON.stringify(node)));
    return;
  }
  if (node.type === "LineString") {
    const ring = ringDariKoordinat(node.coordinates);
    if (ring) hasil.push(ring);
    return;
  }
  if (node.type === "MultiLineString" && Array.isArray(node.coordinates)) {
    for (const garis of node.coordinates) {
      const ring = ringDariKoordinat(garis);
      if (ring) hasil.push(ring);
    }
  }
}

export function geometriDariGeoJson(nilai: string): string {
  if (!nilai.trim()) return "";
  let parsed: GeoJsonLonggar;
  try {
    parsed = JSON.parse(nilai) as GeoJsonLonggar;
  } catch {
    return "";
  }

  const rings: KoordinatWilayah[][] = [];
  kumpulkanRings(parsed, rings);
  return bentukGeoJsonDariRings(rings);
}

function escapeXml(nilai: string): string {
  return nilai
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Ekspor batas wilayah menjadi GPX sederhana (satu track per ring). */
export function geojsonKeGpx(path: string, nama: string): string {
  const rings = parseGeoJsonRings(path);
  if (rings.length === 0) return "";

  const tracks = rings
    .map((ring) => {
      const titik = ring
        .map((koordinat) => `      <trkpt lat="${koordinat.lat}" lon="${koordinat.lon}" />`)
        .join("\n");
      return `  <trk>\n    <name>${escapeXml(nama)}</name>\n    <trkseg>\n${titik}\n    </trkseg>\n  </trk>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FlexiDesa" xmlns="http://www.topografix.com/GPX/1/1">\n${tracks}</gpx>\n`;
}

/** Ekspor satu titik kantor menjadi GPX (waypoint). */
export function titikKeGpx(lat: number, lng: number, nama: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FlexiDesa" xmlns="http://www.topografix.com/GPX/1/1">\n  <wpt lat="${lat}" lon="${lng}">\n    <name>${escapeXml(nama)}</name>\n  </wpt>\n</gpx>\n`;
}

/** Tipe peta untuk tile; nilai kosong/lama memakai default. */
export function tileUntuk(nilai: string | null | undefined): TilePeta {
  return TILE_PETA[
    nilai === "osm" || nilai === "carto" || nilai === "carto-dark" ? nilai : TIPE_PETA_DEFAULT
  ];
}
