import { describe, expect, it } from "vitest";

import {
  bentukGeoJsonDariRings,
  formatKoordinat,
  geojsonKeGpx,
  geometriDariGeoJson,
  parseKoordinat,
  TILE_PETA,
  titikKeGpx,
} from "@/features/info-desa/wilayah/domain/peta-wilayah";

const segitiga = [
  [
    { lat: 1, lng: 1 },
    { lat: 1, lng: 2 },
    { lat: 2, lng: 2 },
  ],
];

describe("TILE_PETA", () => {
  it("memakai URL dan atribusi tile yang disepakati", () => {
    expect(TILE_PETA.osm.url).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(TILE_PETA.osm.atribusi).toBe("© OpenStreetMap contributors");
    expect(TILE_PETA.carto.url).toContain("basemaps.cartocdn.com/light_all");
    expect(TILE_PETA.carto.atribusi).toContain("© CARTO");
    expect(TILE_PETA["carto-dark"].url).toContain("dark_all");
  });
});

describe("parseKoordinat", () => {
  it("membaca koordinat kantor dan menolak nilai tidak sah", () => {
    expect(parseKoordinat("-6.2, 106.816666")).toEqual({ lat: -6.2, lng: 106.816666 });
    expect(parseKoordinat("")).toBeNull();
    expect(parseKoordinat("91, 0")).toBeNull();
    expect(parseKoordinat("abc, def")).toBeNull();
    expect(parseKoordinat("1, 2, 3")).toBeNull();
  });

  it("menulis koordinat dengan enam desimal", () => {
    expect(formatKoordinat(-6.2, 106.816666)).toBe("-6.200000, 106.816666");
  });
});

describe("bentukGeoJsonDariRings", () => {
  it("menutup ring dan memilih Polygon untuk satu ring", () => {
    const hasil = JSON.parse(bentukGeoJsonDariRings(segitiga));
    expect(hasil.type).toBe("Polygon");
    expect(hasil.coordinates[0][0]).toEqual(hasil.coordinates[0][3]);
  });

  it("memilih MultiPolygon untuk beberapa ring", () => {
    const hasil = JSON.parse(
      bentukGeoJsonDariRings([
        [
          { lat: 1, lng: 1 },
          { lat: 1, lng: 2 },
          { lat: 2, lng: 1 },
          { lat: 1, lng: 1 },
        ],
        [
          { lat: 3, lng: 3 },
          { lat: 3, lng: 4 },
          { lat: 4, lng: 3 },
          { lat: 3, lng: 3 },
        ],
      ]),
    );
    expect(hasil.type).toBe("MultiPolygon");
    expect(hasil.coordinates).toHaveLength(2);
  });

  it("mengabaikan ring yang tidak cukup titik", () => {
    expect(bentukGeoJsonDariRings([])).toBe("");
    expect(
      bentukGeoJsonDariRings([
        [
          { lat: 1, lng: 1 },
          { lat: 2, lng: 2 },
        ],
      ]),
    ).toBe("");
  });
});

describe("geometriDariGeoJson", () => {
  it("mengambil polygon dari Feature dan FeatureCollection", () => {
    const poligon = {
      type: "Polygon",
      coordinates: [
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 1],
        ],
      ],
    };
    const feature = { type: "Feature", properties: {}, geometry: poligon };
    expect(JSON.parse(geometriDariGeoJson(JSON.stringify(poligon))).type).toBe("Polygon");
    expect(JSON.parse(geometriDariGeoJson(JSON.stringify(feature))).type).toBe("Polygon");
    expect(
      JSON.parse(
        geometriDariGeoJson(
          JSON.stringify({ type: "FeatureCollection", features: [feature, feature] }),
        ),
      ).type,
    ).toBe("MultiPolygon");
    expect(geometriDariGeoJson("bukan json")).toBe("");
  });

  it("mengubah LineString hasil GPX menjadi polygon", () => {
    const garis = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [1, 1],
              [2, 1],
              [2, 2],
              [1, 1],
            ],
          },
        },
      ],
    };
    expect(JSON.parse(geometriDariGeoJson(JSON.stringify(garis))).type).toBe("Polygon");
  });
});

describe("geojsonKeGpx", () => {
  it("menulis GPX dengan nama ter-escape dan satu trkpt per titik", () => {
    const gpx = geojsonKeGpx(bentukGeoJsonDariRings(segitiga), "Dusun <A> & B");
    expect(gpx).toContain("Dusun &lt;A&gt; &amp; B");
    expect(gpx.match(/<trkpt /g)).toHaveLength(4);
    expect(gpx).toContain('lat="2" lon="2"');
  });

  it("mengembalikan string kosong bila tidak ada polygon", () => {
    expect(geojsonKeGpx("", "X")).toBe("");
  });

  it("menulis waypoint GPX untuk titik kantor", () => {
    const gpx = titikKeGpx(-6.2, 106.8, "Kantor <Desa>");
    expect(gpx).toContain('<wpt lat="-6.2" lon="106.8">');
    expect(gpx).toContain("Kantor &lt;Desa&gt;");
  });
});
