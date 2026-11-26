import type { DivIcon } from "leaflet";
import type * as Leaflet from "leaflet";

// Ikon bawaan Leaflet memakai berkas gambar relatif yang tidak ikut ter-resolve
// oleh bundler Next, sehingga pinnya rusak. Penanda digambar sendiri sebagai SVG.
const SVG_PENANDA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="26" height="34" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.9 12 20 12 20s12-11.1 12-20C24 5.4 18.6 0 12 0Z" fill="#6d28d9"/><circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>`;

export function ikonPenanda(L: typeof Leaflet): DivIcon {
  return L.divIcon({
    className: "penanda-peta",
    html: SVG_PENANDA,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
  });
}
