import type { profilDesaPublik } from "@/features/info-desa/publik/application/konten-publik";
import type { AreaDTO, PolygonDTO } from "@/features/pertanahan-gis/gis/domain/gis";
import {
  parseGeoJsonRings,
  type KoordinatPeta,
} from "@/features/pertanahan-gis/gis/domain/peta-cetak";

export type ProfilWilayah = Awaited<ReturnType<typeof profilDesaPublik>>;

export type AreaShape = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  rings: KoordinatPeta[][];
};

export const palette = ["#12bf56", "#f4b900", "#1689f5", "#a832ed"];

export function mediaUrl(value: string | null | undefined, villageId: number): string | null {
  if (!value) return null;
  const parts = value.split(/[\\/]/).filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === ".." || part.includes("..")))
    return null;
  const path = parts[0] === String(villageId) ? parts : [String(villageId), ...parts];
  return `/api/publik/media/${path.map(encodeURIComponent).join("/")}`;
}

export function buildAreaShapes(
  areas: AreaDTO[],
  polygons: PolygonDTO[],
  batasDesa: string | null,
): AreaShape[] {
  const colors = new Map(polygons.map((polygon) => [polygon.id, polygon.color]));
  const batas = parseGeoJsonRings(batasDesa);
  const shapes = areas
    .map((area) => ({
      id: area.id,
      name: area.nama,
      description: area.desk,
      color: /^#[0-9a-fA-F]{6}$/.test(colors.get(area.refPolygon ?? -1) ?? "")
        ? colors.get(area.refPolygon ?? -1)!
        : "#7c3aed",
      rings: parseGeoJsonRings(area.path),
    }))
    .filter((area) => area.rings.length > 0);
  // Batas desa dari Identitas Desa digambar lebih dulu agar area dusun tetap
  // terlihat di atasnya.
  return batas.length
    ? [{ id: -1, name: "Batas Desa", description: null, color: "#12bf56", rings: batas }, ...shapes]
    : shapes;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}
