import { z } from "zod";

import { validasiGeoJsonPolygon, validasiKoordinat } from "@/features/gis/domain/peta-cetak";
import { RESOURCES } from "@/features/rbac/domain/resources";

/** Slug resource RBAC untuk modul wilayah (harus sama dengan `modules.slug`). */
export const WILAYAH_RESOURCE = RESOURCES.wilayah;

/** Pilihan tipe peta dasar yang didukung (tanpa API key). */
export const TIPE_PETA = ["osm", "carto", "carto-dark"] as const;
export type TipePeta = (typeof TIPE_PETA)[number];
export const TIPE_PETA_DEFAULT: TipePeta = "carto";
export const ZOOM_PETA_DEFAULT = 15;
export const WARNA_AREA_DEFAULT = "#10b981";
export const WARNA_BORDER_DEFAULT = "#047857";

export const LABEL_TIPE_PETA: Record<TipePeta, string> = {
  osm: "OpenStreetMap",
  carto: "CARTO Terang",
  "carto-dark": "CARTO Gelap",
};

/**
 * Nilai `map_tipe` lama (mis. `HYBRID` OpenSID) atau tidak dikenal jatuh ke
 * peta default supaya data lama tetap dapat dibuka.
 */
export function normalisasiTipePeta(nilai: string | null | undefined): TipePeta {
  return TIPE_PETA.includes(nilai as TipePeta) ? (nilai as TipePeta) : TIPE_PETA_DEFAULT;
}

const nilaiAtauNull = (nilai: unknown) =>
  nilai === "" || nilai === null || nilai === undefined ? null : nilai;

const angkaAtauNull = (nilai: unknown) => {
  const kosong = nilaiAtauNull(nilai);
  if (kosong === null) return null;
  const angka = Number(kosong);
  return Number.isNaN(angka) ? kosong : angka;
};

const zoomPeta = z.preprocess(
  angkaAtauNull,
  z
    .number({ error: "Zoom peta harus berupa angka." })
    .int("Zoom peta harus bilangan bulat.")
    .min(1, "Zoom peta minimal 1.")
    .max(22, "Zoom peta maksimal 22.")
    .nullable(),
);

const warnaPeta = z.preprocess(
  nilaiAtauNull,
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format #RRGGBB.")
    .nullable(),
);

const kepalaResidentId = z
  .number({ error: "Kepala wilayah tidak valid." })
  .int("Kepala wilayah tidak valid.")
  .positive("Kepala wilayah tidak valid.")
  .nullable()
  .default(null);

const urutWilayah = z.coerce
  .number({ error: "Urutan harus berupa angka." })
  .int("Urutan harus bilangan bulat.")
  .min(0, "Minimal 0.")
  .max(9999, "Maksimal 9999.");

/** Skema validasi input wilayah baru (identitas saja; peta diatur terpisah). */
export const wilayahFormSchema = z.object({
  dusun: z.string().trim().min(1, "Nama dusun wajib diisi.").max(100, "Maksimal 100 karakter."),
  rw: z.string().trim().max(10, "Maksimal 10 karakter."),
  rt: z.string().trim().max(10, "Maksimal 10 karakter."),
  kepala: z.string().trim().max(100, "Maksimal 100 karakter.").default(""),
  /** Penduduk yang menjabat kepala wilayah; `null` bila bukan penduduk desa. */
  kepalaResidentId,
  urut: urutWilayah,
});

/**
 * Skema ubah wilayah: isian sama dengan form tambah.
 *
 * Dusun, RW, dan RT boleh diubah sekaligus agar operator dapat memperbaiki
 * penomoran tanpa menghapus dan membuat ulang baris. Rename induk merambat ke
 * turunannya (lihat `rencanaUbahWilayah`).
 */
export const ubahWilayahSchema = wilayahFormSchema;

/** Pengaturan titik kantor wilayah. */
export const petaKantorSchema = z.object({
  /** Titik kantor wilayah, mis. `-6.200000, 106.816666`. */
  koordinat: z
    .string()
    .trim()
    .max(60, "Maksimal 60 karakter.")
    .default("")
    .refine((nilai) => validasiKoordinat(nilai) === null, {
      message: "Koordinat harus berupa latitude (-90 s.d. 90), longitude (-180 s.d. 180).",
    }),
  zoom: zoomPeta,
  mapTipe: z.preprocess(
    (nilai) => normalisasiTipePeta(typeof nilai === "string" ? nilai : null),
    z.enum(TIPE_PETA),
  ),
});

/** Pengaturan batas wilayah (Polygon/MultiPolygon). */
export const batasWilayahSchema = z.object({
  path: z
    .string()
    .trim()
    .max(200_000, "GeoJSON terlalu besar.")
    .default("")
    .refine((nilai) => nilai === "" || validasiGeoJsonPolygon(nilai) === null, {
      message: "Batas wilayah harus berupa GeoJSON Polygon atau MultiPolygon tertutup yang valid.",
    }),
  zoom: zoomPeta,
  warna: warnaPeta,
  border: warnaPeta,
});

export type WilayahFormInput = z.infer<typeof wilayahFormSchema>;
export type UbahWilayahInput = z.infer<typeof ubahWilayahSchema>;
export type PetaKantorInput = z.infer<typeof petaKantorSchema>;
export type BatasWilayahInput = z.infer<typeof batasWilayahSchema>;

/** Bentuk data wilayah yang dikirim ke UI (tanpa kolom internal). */
export interface WilayahDTO {
  id: number;
  dusun: string;
  rw: string;
  rt: string;
  kepala: string;
  kepalaNik: string;
  kepalaResidentId: number | null;
  koordinat: string;
  path: string;
  zoom: number | null;
  mapTipe: TipePeta | null;
  warna: string | null;
  border: string | null;
  urut: number;
}

export interface WilayahPatch {
  id: number;
  dusun: string;
  rw: string;
  rt: string;
}

export interface JumlahWilayah {
  jumlahKk: number;
  lakiLaki: number;
  perempuan: number;
  total: number;
}

export interface WilayahDenganJumlah extends WilayahDTO, JumlahWilayah {
  /** Tingkat baris: `dusun`, `rw`, atau `rt`. */
  tingkat: "dusun" | "rw" | "rt";
}

/** Tingkat wilayah diturunkan dari kombinasi dusun/RW/RT yang terisi. */
export function tingkatWilayah(wilayah: Pick<WilayahDTO, "rw" | "rt">): "dusun" | "rw" | "rt" {
  if (!wilayah.rw && !wilayah.rt) return "dusun";
  if (wilayah.rw && !wilayah.rt) return "rw";
  return "rt";
}

export const LABEL_TINGKAT = {
  dusun: "Dusun",
  rw: "RW",
  rt: "RT",
} as const;

/**
 * Rencanakan perubahan satu baris wilayah beserta turunannya.
 *
 * Nilai dusun/RW/RT baris target dipakai apa adanya. Perubahan nama induk
 * dirambatkan ke turunannya agar struktur tetap utuh: rename dusun mengubah
 * dusun semua baris di dusun itu; rename RW juga mengubah RW pada RT di
 * bawahnya; perubahan baris RT hanya berlaku untuk baris itu.
 *
 * Hasil kosong dengan `bentrok: true` bila ada kombinasi dusun/RW/RT yang
 * menjadi ganda, sehingga pemanggil dapat membatalkan tanpa menulis apa pun.
 */
export function rencanaUbahWilayah(
  rows: readonly Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">[],
  targetId: number,
  nilai: Pick<WilayahDTO, "dusun" | "rw" | "rt">,
): { patches: WilayahPatch[]; bentrok: boolean } {
  const target = rows.find((row) => row.id === targetId);
  if (!target) return { patches: [], bentrok: false };

  const lama = { dusun: target.dusun, rw: target.rw, rt: target.rt };
  const baru = { dusun: nilai.dusun.trim(), rw: nilai.rw.trim(), rt: nilai.rt.trim() };
  if (!baru.dusun) return { patches: [], bentrok: false };

  const tingkat = tingkatWilayah(target);
  const patches: WilayahPatch[] = [];

  for (const row of rows) {
    let berikut: WilayahPatch;
    if (row.id === targetId) {
      berikut = { id: row.id, ...baru };
    } else if (tingkat === "rt" || row.dusun !== lama.dusun) {
      continue;
    } else if (tingkat === "rw" && row.rw !== lama.rw) {
      continue;
    } else if (tingkat === "dusun") {
      berikut = { id: row.id, dusun: baru.dusun, rw: row.rw, rt: row.rt };
    } else {
      berikut = { id: row.id, dusun: baru.dusun, rw: baru.rw, rt: row.rt };
    }
    if (berikut.dusun === row.dusun && berikut.rw === row.rw && berikut.rt === row.rt) {
      continue;
    }
    patches.push(berikut);
  }

  if (patches.length === 0) return { patches: [], bentrok: false };

  const kunci = (row: Pick<WilayahDTO, "dusun" | "rw" | "rt">) =>
    `${row.dusun}\u0000${row.rw}\u0000${row.rt}`;
  const hasil = new Set<string>();
  for (const patch of patches) {
    const nilaiBaru = kunci(patch);
    if (hasil.has(nilaiBaru)) return { patches: [], bentrok: true };
    hasil.add(nilaiBaru);
  }
  const diubah = new Set(patches.map((patch) => patch.id));
  for (const row of rows) {
    if (diubah.has(row.id)) continue;
    if (hasil.has(kunci(row))) return { patches: [], bentrok: true };
  }

  return { patches, bentrok: false };
}

/**
 * Baris turunan langsung dari satu baris wilayah.
 *
 * Struktur `regions` datar, sehingga turunan dikenali dari prefiks yang sama:
 * dusun → RW (dusun sama, RW terisi, RT kosong), RW → RT (dusun dan RW sama,
 * RT terisi). Baris RT yang berada langsung di bawah dusun (tanpa RW) juga
 * dianggap turunan dusun, sama seperti baris RW kosong pada acuan.
 */
export function wilayahTurunan(
  rows: readonly Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">[],
  induk: Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">,
): (Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt"> & { tingkat: "dusun" | "rw" | "rt" })[] {
  const tingkatInduk = tingkatWilayah(induk);
  return rows
    .filter((row) => {
      if (row.id === induk.id) return false;
      if (row.dusun !== induk.dusun) return false;
      // RW (rt kosong) dan RT yang langsung di bawah dusun (rw kosong). RT yang
      // punya RW hanya tampil di bawah RW-nya, bukan di bawah dusun.
      if (tingkatInduk === "dusun")
        return (Boolean(row.rw) && !row.rt) || (!row.rw && Boolean(row.rt));
      if (tingkatInduk === "rw") return row.rw === induk.rw && Boolean(row.rt);
      return false;
    })
    .map((row) => ({ ...row, tingkat: tingkatWilayah(row) }));
}

/** Seluruh baris di bawah satu wilayah (anak, cucu, dan seterusnya). */
export function wilayahDiBawah(
  rows: readonly Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">[],
  indukId: number,
): Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">[] {
  const induk = rows.find((row) => row.id === indukId);
  if (!induk) return [];
  const hasil: Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">[] = [];
  const antrean = [induk];
  const dilihat = new Set<number>([induk.id]);
  while (antrean.length) {
    const sekarang = antrean.shift();
    if (!sekarang) break;
    for (const anak of wilayahTurunan(rows, sekarang)) {
      if (dilihat.has(anak.id)) continue;
      dilihat.add(anak.id);
      hasil.push(anak);
      antrean.push(anak);
    }
  }
  return hasil;
}

function termasukWilayah(
  induk: Pick<WilayahDTO, "dusun" | "rw" | "rt">,
  calon: Pick<WilayahDTO, "dusun" | "rw" | "rt">,
): boolean {
  if (induk.dusun !== calon.dusun) return false;
  if (induk.rw && induk.rw !== calon.rw) return false;
  if (induk.rt && induk.rt !== calon.rt) return false;
  return true;
}

/**
 * Jumlahkan data penduduk/KK dari baris turunan untuk setiap baris wilayah.
 *
 * Satu penduduk hanya terhubung ke satu `region_id`, sehingga penjumlahan
 * subtree diperlukan agar baris dusun/RW menampilkan total yang sama dengan
 * rincian RT di bawahnya.
 */
export function hitungJumlahWilayah(
  rows: readonly Pick<WilayahDTO, "id" | "dusun" | "rw" | "rt">[],
  exact: ReadonlyMap<number, JumlahWilayah>,
): Map<number, JumlahWilayah> {
  const hasil = new Map<number, JumlahWilayah>();
  for (const induk of rows) {
    const jumlah = { jumlahKk: 0, lakiLaki: 0, perempuan: 0, total: 0 };
    for (const calon of rows) {
      if (!termasukWilayah(induk, calon)) continue;
      const nilai = exact.get(calon.id);
      if (!nilai) continue;
      jumlah.jumlahKk += nilai.jumlahKk;
      jumlah.lakiLaki += nilai.lakiLaki;
      jumlah.perempuan += nilai.perempuan;
      jumlah.total += nilai.total;
    }
    hasil.set(induk.id, jumlah);
  }
  return hasil;
}

/** Label ringkas wilayah, mis. "Dusun Sukamaju · RT 02 / RW 01". */
export function formatWilayahLabel(wilayah: Pick<WilayahDTO, "dusun" | "rw" | "rt">): string {
  const parts: string[] = [];

  if (wilayah.dusun) parts.push(`Dusun ${wilayah.dusun}`);
  if (wilayah.rt) parts.push(`RT ${wilayah.rt}`);
  if (wilayah.rw) parts.push(`RW ${wilayah.rw}`);

  return parts.length > 0 ? parts.join(" · ") : "Wilayah tanpa nama";
}
