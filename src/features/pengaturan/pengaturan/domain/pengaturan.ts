import { z } from "zod";

/** Pilihan format tanggal pada surat (parity `format_tanggal_surat` OpenSID). */
export const FORMAT_TANGGAL_SURAT = ["indonesia", "dmy", "iso"] as const;
export type FormatTanggalSurat = (typeof FORMAT_TANGGAL_SURAT)[number];

/**
 * Field penduduk luar desa yang boleh diminta pada formulir surat.
 *
 * Parity `form_penduduk_luar` OpenSID: desa memilih isian mana yang tampil.
 * `nama` dan `nik` selalu diminta seperti OpenSID.
 */
export const FIELD_PENDUDUK_LUAR = [
  "nik",
  "jenisKelamin",
  "tempatLahir",
  "tanggalLahir",
  "pekerjaan",
  "alamat",
  "keterangan",
] as const;
export type FieldPendudukLuar = (typeof FIELD_PENDUDUK_LUAR)[number];

/**
 * Pengaturan aplikasi terpusat.
 *
 * Kunci di database dipetakan ke field bertipe di sini. Nilai yang hilang,
 * rusak, atau di luar batas selalu jatuh ke bawaan domain — satu baris data
 * lama tidak boleh membuat aplikasi gagal.
 */
export const PETA_KUNCI = {
  komentarAktif: "web.komentar_aktif",
  beritaBeranda: "web.berita_beranda",
  pendaftaranWargaAktif: "mandiri.pendaftaran_warga",
  /** Mode penomoran surat (1–4); nilai efektif diselaraskan dengan villages.penomoran_surat. */
  penomoranSurat: "surat.penomoran_mode",
  // --- Pengaturan global surat (parity `surat_master/pengaturan` OpenSID) ---
  suratTinggiHeader: "surat.tinggi_header",
  suratTinggiFooter: "surat.tinggi_footer",
  suratTemplateHeader: "surat.template_header",
  suratTemplateFooter: "surat.template_footer",
  suratVerifikasiSekdes: "surat.verifikasi_sekdes",
  suratVerifikasiKades: "surat.verifikasi_kades",
  suratGantiDataKosong: "surat.ganti_data_kosong",
  suratFormatTanggal: "surat.format_tanggal",
  suratPanjangNomor: "surat.panjang_nomor",
  suratMarginKiri: "surat.margin_kiri",
  suratMarginAtas: "surat.margin_atas",
  suratMarginKanan: "surat.margin_kanan",
  suratMarginBawah: "surat.margin_bawah",
  suratPendudukLuarField: "surat.penduduk_luar_field",
  /** Logo kop surat (jalur media tenant); kosong = logo identitas desa. */
  suratLogo: "surat.logo",
  /** Garis ganda di bawah kop seperti kop resmi OpenSID. */
  suratGarisGanda: "surat.garis_ganda",
  /** Lebar logo kop dalam persen lebar isi (OpenSID: 10%). */
  suratLogoLebar: "surat.logo_lebar",
  /** Posisi logo kop: kiri atau tengah. */
  suratLogoPosisi: "surat.logo_posisi",
} as const;

export type KunciPengaturan = keyof typeof PETA_KUNCI;

/** Posisi logo pada kop surat. */
export const POSISI_LOGO_SURAT = ["kiri", "tengah"] as const;
export type PosisiLogoSurat = (typeof POSISI_LOGO_SURAT)[number];

const SKEMA_FIELD = {
  komentarAktif: z.boolean(),
  beritaBeranda: z.number().int().min(1).max(12),
  pendaftaranWargaAktif: z.boolean(),
  penomoranSurat: z.number().int().min(1).max(4),
  suratTinggiHeader: z.number().min(0).max(100),
  suratTinggiFooter: z.number().min(0).max(100),
  suratTemplateHeader: z.string().max(4000),
  suratTemplateFooter: z.string().max(4000),
  suratVerifikasiSekdes: z.boolean(),
  suratVerifikasiKades: z.boolean(),
  suratGantiDataKosong: z.string().max(20),
  suratFormatTanggal: z.enum(FORMAT_TANGGAL_SURAT),
  suratPanjangNomor: z.number().int().min(0).max(10),
  suratMarginKiri: z.number().min(0).max(10),
  suratMarginAtas: z.number().min(0).max(10),
  suratMarginKanan: z.number().min(0).max(10),
  suratMarginBawah: z.number().min(0).max(10),
  suratPendudukLuarField: z.array(z.enum(FIELD_PENDUDUK_LUAR)),
  suratLogo: z.string().max(300),
  suratGarisGanda: z.boolean(),
  suratLogoLebar: z.number().min(5).max(30),
  suratLogoPosisi: z.enum(POSISI_LOGO_SURAT),
} satisfies Record<KunciPengaturan, z.ZodTypeAny>;

export const pengaturanSchema = z.object({
  /** Tampilkan & terima komentar pada halaman kontak publik. */
  komentarAktif: z.boolean().default(true),
  /** Jumlah berita yang ditampilkan pada beranda publik. */
  beritaBeranda: z.coerce
    .number()
    .int("Jumlah berita harus bilangan bulat.")
    .min(1, "Jumlah berita minimal 1.")
    .max(12, "Jumlah berita maksimal 12.")
    .default(5),
  /** Izinkan pengajuan akun warga dari halaman publik. */
  pendaftaranWargaAktif: z.boolean().default(true),
  /** Mode penomoran surat: 1=manual, 2=otomatis per tahun, 3=otomatis per bulan, 4=otomatis per jenis. */
  penomoranSurat: z.coerce.number().int().min(1).max(4).default(2),
  // --- Pengaturan global surat -----------------------------------------
  /** Tinggi area header surat (cm); 0 = tanpa header. */
  suratTinggiHeader: z.coerce.number().min(0).max(100).default(3.3),
  suratTinggiFooter: z.coerce.number().min(0).max(100).default(2),
  /** Template teks header/footer; kosong = memakai identitas desa otomatis. */
  suratTemplateHeader: z.string().max(4000).default(""),
  suratTemplateFooter: z.string().max(4000).default(""),
  /** Verifikasi berjenjang untuk surat baru (parity `verifikasi_sekdes/kades`). */
  suratVerifikasiSekdes: z.boolean().default(true),
  suratVerifikasiKades: z.boolean().default(true),
  /** Teks pengganti kode isian yang kosong (parity `ganti_data_kosong`). */
  suratGantiDataKosong: z.string().max(20).default("-"),
  /** Format tanggal pada kode isian surat. */
  suratFormatTanggal: z.enum(FORMAT_TANGGAL_SURAT).default("indonesia"),
  /** Panjang nomor urut dengan nol di depan; 0 = tanpa padding. */
  suratPanjangNomor: z.coerce.number().int().min(0).max(10).default(0),
  /** Margin kertas global (cm) saat jenis surat memakai margin global. */
  suratMarginKiri: z.coerce.number().min(0).max(10).default(3),
  suratMarginAtas: z.coerce.number().min(0).max(10).default(2),
  suratMarginKanan: z.coerce.number().min(0).max(10).default(2),
  suratMarginBawah: z.coerce.number().min(0).max(10).default(2.5),
  /** Isian penduduk luar yang ditampilkan pada formulir surat. */
  suratPendudukLuarField: z.array(z.enum(FIELD_PENDUDUK_LUAR)).default([...FIELD_PENDUDUK_LUAR]),
  /** Logo kop surat; kosong berarti memakai logo identitas desa. */
  suratLogo: z.string().max(300).default(""),
  /** Garis ganda di bawah kop (bawaan OpenSID). */
  suratGarisGanda: z.boolean().default(true),
  /** Lebar logo kop dalam persen lebar isi; 5–30 seperti pilihan OpenSID. */
  suratLogoLebar: z.coerce.number().min(5).max(30).default(10),
  /** Posisi logo kop. */
  suratLogoPosisi: z.enum(POSISI_LOGO_SURAT).default("kiri"),
});

export type Pengaturan = z.infer<typeof pengaturanSchema>;

export const PENGATURAN_DEFAULT: Pengaturan = pengaturanSchema.parse({});

/** Cari field dari kunci database; `null` bila kunci tidak dikenal. */
function fieldDariKunci(kunci: string): KunciPengaturan | null {
  for (const [field, nilai] of Object.entries(PETA_KUNCI)) {
    if (nilai === kunci) return field as KunciPengaturan;
  }
  return null;
}

/** Susun pengaturan efektif dari baris database (bawaan + override valid). */
export function parsePengaturan(
  baris: ReadonlyArray<{ kunci: string; nilai: string | null }>,
): Pengaturan {
  const hasil: Pengaturan = { ...PENGATURAN_DEFAULT };

  for (const { kunci, nilai } of baris) {
    const field = fieldDariKunci(kunci);
    if (!field || nilai === null) continue;

    let mentah: unknown;
    try {
      mentah = JSON.parse(nilai);
    } catch {
      continue;
    }

    const parsed = SKEMA_FIELD[field].safeParse(mentah);
    if (parsed.success) {
      Object.assign(hasil, { [field]: parsed.data });
    }
  }

  return hasil;
}

/** Ubah pengaturan tervalidasi menjadi baris siap simpan (JSON per kunci). */
export function serialisasiPengaturan(
  pengaturan: Pengaturan,
): Array<{ kunci: string; nilai: string }> {
  return (Object.keys(PETA_KUNCI) as KunciPengaturan[]).map((field) => ({
    kunci: PETA_KUNCI[field],
    nilai: JSON.stringify(pengaturan[field]),
  }));
}

/**
 * Baca checkbox `FormData`: hanya nilai `"on"`/`"true"`/`"1"` dianggap aktif.
 */
export function checkboxAktif(nilai: FormDataEntryValue | null): boolean {
  if (typeof nilai !== "string") return false;
  return ["on", "true", "1"].includes(nilai.toLowerCase());
}
