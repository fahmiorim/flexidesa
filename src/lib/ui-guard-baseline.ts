/**
 * Baseline guard UI admin.
 *
 * Angka adalah pelanggaran lama yang belum dimigrasi. Jangan menaikkan angka;
 * setelah sebuah berkas dimigrasi, hapus entri atau turunkan angkanya.
 *
 * Tabel mentah di halaman non-cetak sudah nol dan dijaga test terpisah;
 * angka tabel di sini hanya tersisa untuk halaman cetak.
 */
export const BASELINE_UI_ADMIN: Record<string, { tombol: number; tabel: number }> = {
  "src/app/(admin)/(administrasi-desa)/bumindes/buku-administrasi/[id]/cetak/page.tsx": {
    tombol: 0,
    tabel: 1,
  },
  "src/app/(admin)/(beranda)/beranda/statistik-penduduk.tsx": { tombol: 1, tabel: 0 },
  "src/app/(admin)/(info-desa)/profil-desa/berita/editor-berita.tsx": { tombol: 1, tabel: 0 },
  "src/app/(admin)/(info-desa)/profil-desa/berita/kelola-kategori-dialog.tsx": {
    tombol: 2,
    tabel: 0,
  },
  "src/app/(admin)/(info-desa)/profil-desa/lembaga-desa/cetak/page.tsx": { tombol: 0, tabel: 1 },
  "src/app/(admin)/(info-desa)/profil-desa/pemerintah-desa/cetak/page.tsx": { tombol: 0, tabel: 1 },
  "src/app/(admin)/(kependudukan)/kependudukan/kelompok-rentan/cetak/page.tsx": {
    tombol: 0,
    tabel: 1,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/kelompok/[id]/cetak/page.tsx": {
    tombol: 0,
    tabel: 2,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/kelompok/cetak/page.tsx": { tombol: 0, tabel: 1 },
  "src/app/(admin)/(kependudukan)/kependudukan/kelompok/kelola-kategori-kelompok.tsx": {
    tombol: 2,
    tabel: 0,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/keluarga/toolbar-aksi.tsx": { tombol: 3, tabel: 0 },
  "src/app/(admin)/(kependudukan)/kependudukan/mutasi-penduduk/cetak/page.tsx": {
    tombol: 0,
    tabel: 1,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/penduduk/dialog-impor-penduduk.tsx": {
    tombol: 1,
    tabel: 0,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/[id]/cetak/page.tsx": {
    tombol: 0,
    tabel: 1,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/rumah-tangga/[id]/cetak/page.tsx": {
    tombol: 0,
    tabel: 2,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/statistik/cetak/page.tsx": { tombol: 0, tabel: 1 },
  "src/app/(admin)/(kependudukan)/kependudukan/statistik/grafik-kependudukan.tsx": {
    tombol: 2,
    tabel: 0,
  },
  "src/app/(admin)/(kependudukan)/kependudukan/stunting/dialog-panduan.tsx": {
    tombol: 1,
    tabel: 0,
  },
  "src/app/(admin)/(pelayanan-persuratan)/layanan-surat/persuratan/jenis-surat/jenis-surat-form.tsx":
    { tombol: 2, tabel: 0 },
  "src/app/(admin)/(pelayanan-persuratan)/layanan-surat/persuratan/jenis-surat/pengaturan/pengaturan-surat-form.tsx":
    { tombol: 1, tabel: 0 },
  "src/app/(admin)/(pengaturan)/pengaturan/grup-akses/dialog-role.tsx": { tombol: 2, tabel: 0 },
  "src/app/(admin)/(pengaturan)/pengaturan/grup-akses/dialog-salin-role.tsx": {
    tombol: 1,
    tabel: 0,
  },
  "src/app/(admin)/(pengaturan)/pengaturan/pengguna/dialog-pengguna.tsx": { tombol: 2, tabel: 0 },
  "src/app/(admin)/(pengaturan)/pengaturan/pengguna/pengguna-console.tsx": { tombol: 3, tabel: 0 },
  "src/app/(admin)/(info-desa)/profil-desa/wilayah-administratif/cetak/page.tsx": {
    tombol: 0,
    tabel: 1,
  },
};
