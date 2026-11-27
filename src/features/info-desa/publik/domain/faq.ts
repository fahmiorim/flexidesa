import { z } from "zod";

/**
 * FAQ publik per desa, disimpan sebagai JSON pada `pengaturanDesa` dengan kunci
 * `pengaturan.faq_kontak` dan `pengaturan.faq_layanan_surat`.
 *
 * Nilai bawaan di bawah adalah salinan konten yang selama ini tertanam di
 * komponen publik, sehingga desa yang belum pernah mengisi FAQ di admin tetap
 * menampilkan pertanyaan yang sama seperti sebelumnya.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_KONTAK_DEFAULT: readonly FaqItem[] = [
  {
    q: "Bagaimana cara menyampaikan pengaduan?",
    a: "Hubungi pemerintah desa melalui nomor telepon atau WhatsApp resmi yang tercantum pada halaman ini. Sertakan informasi yang jelas agar petugas dapat memahami laporan Anda.",
  },
  {
    q: "Berapa lama pengaduan ditindaklanjuti?",
    a: "Waktu tindak lanjut dapat berbeda sesuai jenis laporan dan kebutuhan pemeriksaan. Silakan konfirmasi perkembangan melalui saluran kontak resmi desa.",
  },
  {
    q: "Apakah pengaduan bisa dilakukan tanpa identitas?",
    a: "Kebijakan penerimaan laporan tanpa identitas belum dicantumkan pada informasi resmi desa. Tanyakan ketentuannya langsung kepada petugas.",
  },
  {
    q: "Bagaimana cara melihat pengaduan yang sudah ditangani?",
    a: "Buka bagian Pengaduan Publik untuk melihat pengaduan yang telah disetujui pemerintah desa untuk ditampilkan.",
  },
  {
    q: "Jenis pengaduan apa saja yang dapat disampaikan?",
    a: "Anda dapat menyampaikan pertanyaan, saran, atau laporan mengenai pelayanan dan kondisi lingkungan desa melalui kontak resmi.",
  },
];

export const FAQ_SURAT_DEFAULT: readonly FaqItem[] = [
  {
    q: "Bagaimana cara mengajukan surat secara online?",
    a: "Masuk atau buat akun Area Warga, pilih layanan surat yang dibutuhkan, lalu ikuti formulir dan instruksi yang tersedia.",
  },
  {
    q: "Apakah saya harus memiliki akun warga?",
    a: "Ya. Pengajuan surat dilakukan melalui Area Warga agar data pemohon dan status permohonan dapat dikelola dengan aman.",
  },
  {
    q: "Bagaimana mengetahui status pengajuan?",
    a: "Masuk ke akun Area Warga dan periksa bagian permohonan atau layanan surat untuk melihat informasi status yang tersedia.",
  },
  {
    q: "Apa yang harus dilakukan jika permohonan perlu diperbaiki?",
    a: "Periksa catatan dari petugas pada akun Anda. Lengkapi atau perbaiki data sesuai arahan, kemudian ikuti kembali proses pengajuan.",
  },
  {
    q: "Bagaimana jika saya membutuhkan bantuan?",
    a: "Hubungi pemerintah desa melalui halaman Kontak untuk memperoleh bantuan mengenai layanan surat.",
  },
];

export const faqSchema = z.array(
  z.object({
    q: z.string().trim().min(5).max(200),
    a: z.string().trim().min(5).max(2000),
  }),
);

/**
 * Baca nilai FAQ tersimpan; kembali ke bawaan bila belum pernah diisi atau
 * tidak valid. Array kosong yang sudah disimpan berarti FAQ disembunyikan.
 */
export function parseFaq(nilai: unknown, bawaan: readonly FaqItem[]): FaqItem[] {
  const parsed = faqSchema.safeParse(nilai);
  if (parsed.success) return parsed.data;
  return [...bawaan];
}
