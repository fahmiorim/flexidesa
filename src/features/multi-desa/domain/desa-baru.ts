import { z } from "zod";

/**
 * Normalisasi domain desa.
 *
 * Menerima input seperti `https://Desa-Sukamaju.id/` dan menyimpannya sebagai
 * `desa-sukamaju.id`; string kosong berarti desa belum dipetakan ke domain.
 * Normalisasi murni supaya dapat diuji tanpa database.
 */
export function normalisasiDomain(nilai: string): string | null {
  const bersih = nilai
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  return bersih.length === 0 ? null : bersih;
}

export const POLA_DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** String kosong/spasi dianggap tidak diisi, dipakai preprocess skema opsional. */
function opsionalTeks(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const bersih = value.trim();
  return bersih === "" ? undefined : bersih;
}

/** Batas kuota media: 1 MB s.d. 1 TB (nilai kosong = tanpa batas). */
export const KUOTA_MEDIA_MIN_MB = 1;
export const KUOTA_MEDIA_MAX_MB = 1024 * 1024;

/**
 * Kode wilayah administratif (Kemendagri).
 *
 * Picker mengirim kode bertitik (`11.01.01`), sedangkan kolom `villages`
 * menyimpan digit saja (2/4/6 digit). String kosong berarti tidak diisi.
 */
function kodeWilayah(panjang: 2 | 4 | 6) {
  return z
    .string()
    .trim()
    .transform((nilai) => nilai.replaceAll(".", ""))
    .refine((nilai) => nilai === "" || new RegExp(`^\\d{${panjang}}$`).test(nilai), {
      message: `Kode wilayah harus ${panjang} digit angka.`,
    })
    .transform((nilai) => (nilai === "" ? undefined : nilai))
    .optional();
}

/**
 * Skema form pembuatan desa.
 *
 * `code` mengikuti panjang kode desa/kemendagri (10 digit). Domain opsional,
 * tetapi bila diisi harus berupa hostname tanpa protokol/path. Domain kosong
 * diisi otomatis oleh provisioning dengan subdomain platform `<slug>.<base>`
 * agar setiap tenant selalu punya alamat.
 */
export const desaBaruSchema = z
  .object({
    name: z.string().trim().min(3, "Nama desa minimal 3 karakter.").max(100),
    // Picker wilayah mengirim kode bertitik (`11.01.01.2001`); kolom `villages.code`
    // menyimpan 10 digit tanpa pemisah. Normalisasi dulu agar memilih desa dari
    // picker tidak ditolak validasi.
    code: z
      .string()
      .trim()
      .transform((nilai) => nilai.replaceAll(".", ""))
      .refine((nilai) => /^\d{10}$/.test(nilai), "Kode desa harus 10 digit angka."),
    domain: z
      .string()
      .trim()
      .max(255, "Domain maksimal 255 karakter.")
      .transform(normalisasiDomain)
      .refine(
        (domain) => domain === null || POLA_DOMAIN.test(domain),
        "Format domain tidak valid (contoh: desa-sukamaju.id).",
      ),
    /** Kode BPS hasil picker; boleh kosong bila detail wilayah tidak tersedia. */
    kodeBps: z.preprocess(
      opsionalTeks,
      z
        .string()
        .trim()
        .regex(/^\d{10}$/, "Kode BPS harus 10 digit angka.")
        .optional(),
    ),
    /** Kode pos hasil picker; boleh kosong bila detail wilayah tidak tersedia. */
    kodePos: z.preprocess(
      opsionalTeks,
      z
        .string()
        .trim()
        .regex(/^\d{5}$/, "Kode pos harus 5 digit angka.")
        .optional(),
    ),
    district: z.string().trim().max(100).optional(),
    districtCode: kodeWilayah(6),
    regency: z.string().trim().max(100).optional(),
    regencyCode: kodeWilayah(4),
    province: z.string().trim().max(100).optional(),
    provinceCode: kodeWilayah(2),
    headName: z.string().trim().max(100).optional(),
    /**
     * Label subdomain pilihan operator. Kosong = dibentuk dari nama desa.
     * Hanya huruf kecil, angka, dan tanda hubung; dipakai pada
     * `<slug>.<DESA_BASE_DOMAIN>`.
     */
    slug: z.preprocess(
      opsionalTeks,
      z
        .string()
        .trim()
        .toLowerCase()
        .min(3, "Subdomain minimal 3 karakter.")
        .max(50, "Subdomain maksimal 50 karakter.")
        .regex(
          /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
          "Subdomain hanya huruf kecil, angka, dan tanda hubung.",
        )
        .optional(),
    ),
    /** Email resmi desa (berbeda dari email administrator). */
    email: z.preprocess(
      opsionalTeks,
      z
        .string()
        .trim()
        .toLowerCase()
        .max(100, "Email desa maksimal 100 karakter.")
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email desa tidak valid.")
        .optional(),
    ),
    phone: z.string().trim().max(30).optional(),
    officeAddress: z.string().trim().max(255).optional(),
    /** Slug template tema terbit dari katalog platform; kosong = tema bawaan fondasi. */
    themeSlug: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.string().trim().min(1).max(100).optional(),
    ),
    /** Versi paket terbit yang ditetapkan saat provisioning. */
    planVersionId: z.coerce
      .number()
      .int("Pilih versi paket yang terbit.")
      .positive("Pilih versi paket yang terbit."),
    adminName: z.string().trim().min(3, "Nama admin minimal 3 karakter.").max(255),
    adminUsername: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,50}$/, "Username 3–50 karakter: huruf, angka, titik, garis."),
    adminEmail: z
      .string()
      .trim()
      .toLowerCase()
      .max(255)
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format email tidak valid."),
    adminPassword: z.string().min(8, "Sandi minimal 8 karakter.").max(72),
    /** Konfirmasi sandi; hanya diperiksa bila form mengirimkannya. */
    adminPasswordConfirm: z.string().max(72).optional(),
    /** Kuota media desa baru (MB); kosong = tanpa batas. */
    kuotaMediaMb: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? null : value),
      z.coerce
        .number()
        .int("Kuota media harus bilangan bulat.")
        .min(KUOTA_MEDIA_MIN_MB, `Kuota media minimal ${KUOTA_MEDIA_MIN_MB} MB.`)
        .max(KUOTA_MEDIA_MAX_MB, `Kuota media maksimal ${KUOTA_MEDIA_MAX_MB} MB.`)
        .nullable(),
    ),
  })
  .superRefine((data, ctx) => {
    if (
      data.adminPasswordConfirm !== undefined &&
      data.adminPasswordConfirm !== data.adminPassword
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["adminPasswordConfirm"],
        message: "Konfirmasi sandi tidak sama dengan sandi awal.",
      });
    }
  });

export type DesaBaruInput = z.infer<typeof desaBaruSchema>;
