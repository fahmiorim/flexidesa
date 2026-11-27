# Rencana implementasi tema situs publik ala OpenSID

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti sistem token-only dengan paket tema berkode yang mengatur layout, halaman publik, widget, aset, dan opsi konfigurasi.

**Architecture:** Kode tema disimpan dan direview di repository, lalu dimasukkan ke registry statis saat build. Super Admin mengelola tema yang sudah tersedia; Admin Desa hanya memilih tema terbit dan mengatur opsi yang diizinkan. Tidak ada unggah ZIP atau eksekusi kode tema saat runtime.

**Tech Stack:** Next.js 16.4.6 App Router, React 19.3, TypeScript, Zod 4, Drizzle ORM, MySQL.

**Spec:** Prinsip paritas OpenSID di `AGENTS.md` dan sumber lokal `D:\laragon\www\opensid\storage\app\themes`.

**Status:** Rencana target. Implementasi token saat ini adalah baseline migrasi, bukan desain akhir.

**Untuk:** Agent yang mengimplementasikan paket tema dan alur pemilihan tenant.

## Global Constraints

1. Tema berupa source code yang direview di repository. Jangan menerima atau mengeksekusi ZIP tema runtime.
2. Registry statis menjadi allowlist slug dan versi. Jangan membentuk import path dari input database atau klien.
3. Super Admin hanya mengelola tema/versi yang sudah ada di registry; Admin Desa hanya memilih tema terbit dan mengubah opsi yang diizinkan.
4. Data publik tetap dimuat melalui use case yang ada. Komponen tema menerima data sebagai props dan tidak query database.
5. Opsi dan aset tenant tervalidasi server-side, disimpan dalam ruang tenant, dan kompatibel saat tema diperbarui.
6. Jangan menjalankan migrasi terhadap data produksi tanpa permintaan eksplisit.

## Review Focus

1. Slug/versi lama yang sudah aktif harus punya paket kompatibilitas atau migrasi eksplisit.
2. Opsi tenant yang tidak ada pada schema versi baru harus dipetakan, dipertahankan, atau diberi default yang disetujui.
3. Aset untuk opsi bertipe unggah harus dibatasi jenis, ukuran, dan path tenant.
4. Semua route situs publik harus bekerja dengan setiap tema yang diterbitkan, termasuk empty, error, dan data panjang.
5. Publikasi/rollback versi tidak boleh mengaktifkan kode yang tidak ada di build registry.

## 1. Tujuan

Ganti pendekatan token `layout` + warna dengan tema folder-based yang menyediakan susunan tampilan dan opsi seperti OpenSID. AppDes memakai komponen React/Next.js, bukan menyalin Blade. Tema baru masuk lewat perubahan source code dan deployment; UI tidak membuat atau mengunggah source tema.

Prinsip:

1. Inventarisasikan seluruh field, opsi, validasi, aksi, widget, dan route OpenSID sebelum memetakan ke AppDes.
2. Pertahankan data per desa dari database. Tentukan tenant dari host/sesi server, bukan payload klien.
3. Super Admin menyediakan dan menerbitkan paket dari registry; Admin Desa tidak dapat membuat atau mengunggah tema.
4. Perubahan bertahap, backward-compatible, dan diverifikasi per permukaan publik.

## 2. Keadaan Appdes saat ini (hasil audit)

### 2.1 Domain & katalog

| Lapisan | Berkas | Isi |
|---|---|---|
| Schema token | `src/features/multi-desa/domain/template-website.ts` | `tokenTemplateSchema`: warna (6), `fontHeading`, `radius`, `style` terang/gelap, `layout` klasik/modern/ringkas, teks `judulHero`/`subHero`/`taglineFooter` |
| Katalog DB | `src/features/multi-desa/infrastructure/template-website-repository.ts` | `websiteTemplates` + `websiteTemplateVersions` (snapshot token per versi) |
| Use case | `src/features/multi-desa/application/template-website-use-cases.ts` | CRUD katalog, status, distribusi versi, ganti desa — semua `requireSuperAdmin` + audit |
| Admin UI | `src/app/(admin)/super-admin/template/*`, `presentation/form-template.tsx`, `aksi-template.tsx` | Form token, pratinjau, daftar/penggunaan, “Ganti template desa” |
| Tenant UI | `src/features/pengaturan/pengaturan/presentation/pengaturan-desa-client.tsx` | Tab Tampilan Website → pilih template terbit → Terapkan |
| Penskalaan tema desa | tabel `theme` (`village_id`, `slug`, `nama`, `versi`, `aktif`, `opsi` JSON) | `opsi.templateTokens` = token aktif per desa |

Data bawaan (migrasi): `esensi` (format lama tanpa `layout`/teks → dibaca aman, jatuhnya klasik).

### 2.2 Render situs publik

| Komponen | Peran |
|---|---|
| `muatTemaPublik(villageId)` (`website-admin.ts`) | Baca `theme` aktif → token terparse (warna, font, radius, style, layout, 3 teks) |
| `PublicSiteHeader` / `PublicSiteFooter` (`public-site-layout.tsx`) | `<style>` CSS vars + `data-varian`/`data-gelap`; menu dari `menu_publik`, brand dari token teks/tanpa token |
| `HeroBeranda` (`bagian-hero.tsx`) | `data-varian` + prop `varian`/`judulHero`/`subHero` |
| Beranda `page.tsx` | `URUTAN_BAGIAN` per varian (6 bagian tetap tampil, hanya urutan berbeda) |
| `PublicShell` (`public-shell.tsx`) | Dipakai dokumen + pengaduan (5 halaman); sekarang async memuat tema via `villageId` |
| `GalleryShell` (`galeri/gallery-shell.tsx`) | Dipakai detail galeri; async memuat tema via `villageId` |

Cakupan situs publik saat ini berjumlah 35 route-file: 26 mengimpor `PublicSiteHeader` (bersama footer), 5 memakai `PublicShell`, 1 memakai `GalleryShell`, dan 3 alias (`/profil/sejarah`, `/profil/visi-misi`, `/data/statistik`) yang mengimpor komponen halaman utama, bukan re-export `export *`. Hitungan ini mengecualikan 7 route layanan mandiri warga dan halaman keamanan akun. Angka 22 di audit sebelumnya sudah usang.
`PublicSiteHeader`, `PublicSiteFooter`, dan halaman beranda memanggil loader tema masing-masing; rencana baru harus memuat tema sekali per render route lalu meneruskannya ke shell.

### 2.3 Celah terhadap target

1. **Hanya 3 susunan:** `klasik/modern/ringkas` mengubah header, hero, dan urutan 6 bagian beranda; daftar, galeri, statistik, dan form masih memakai komposisi bersama.
2. **Belum ada paket tema berkode:** `src/themes/` dan `TemaRenderer` belum ada. `src/db/schema/theme.ts` sudah menyebut registry yang belum tersedia; selaraskan komentar dan implementasi saat paket dibangun.
3. **Opsi tema terbatas:** token saat ini mengatur 6 warna, font judul, radius, mode terang/gelap, 3 susunan, dan 3 teks. Opsi OpenSID seperti widget, jumlah per halaman, serta gambar fallback belum dipetakan seluruhnya.
4. **Admin katalog masih token-based:** Super Admin dapat membuat metadata/token tema; target baru hanya menerima slug/versi dari registry kode. Admin Desa tidak boleh membuat atau mengunggah paket.
5. **Tidak ada unggah paket tema saat ini:** ini kondisi baseline, bukan target. Source tema baru ditambahkan lewat perubahan kode dan build aplikasi.

---

## 3. Rujukan OpenSID dan perbedaan implementasi

| Aspek | OpenSID lokal | Lokasi sumber |
|---|---|---|
| Paket tema | Folder `esensi` dan `natra` berisi `composer.json`, `config.json`, Blade, partial, widget, dan aset | `storage/app/themes/` |
| Opsi Natra | 7 key: warna dasar, statistik footer, jam, pintasan masuk, foto fallback, jumlah halaman pembangunan, jumlah halaman pengaduan | `storage/app/themes/natra/config.json` |
| Opsi Esensi | 2 key jumlah item per halaman; keduanya juga ada di Natra | `storage/app/themes/esensi/config.json` |
| Jenis field pada paket bawaan | `color-picker`, `select`, `input-number`, `unggah`; konfigurasi juga membawa label, keterangan, nilai awal, group, readonly, options, dan attributes | `config.json` kedua tema |
| Pindai dan aktivasi | `theme_scan()` memindai folder tema, lalu `theme_active()` mendaftarkan namespace view aktif | `donjo-app/helpers/theme_helper.php` |
| Unggah paket | Admin menerima ZIP, mengekstrak ke `desa/themes/`, memeriksa `resources/views/template.blade.php`, lalu memindai tema | `donjo-app/controllers/Theme.php`, route `donjo-app/Routes/Web/admin.php` |
| Katalog resmi | Marketplace tema ditarik melalui API layanan | `Theme@index` |

Konsep OpenSID yang dipertahankan:

1. Satu tema memiliki folder kode, layout, partial, widget, aset, dan konfigurasi sendiri.
2. Definisi konfigurasi membuat form opsi dengan label, nilai awal, pilihan, batas, group, dan keterangan.
3. Setiap desa memakai satu tema aktif dan menyimpan opsi tema miliknya sendiri.
4. Super Admin menyediakan tema yang sudah dikodekan dan diterbitkan; Admin Desa hanya memilih tema terbit.
5. Template boleh mengatur susunan semua halaman publik, bukan hanya warna dan urutan beranda.

**Perbedaan yang disengaja:** OpenSID dapat mengekstrak dan memuat Blade dari folder runtime. AppDes tidak menerima ZIP source tema. Paket AppDes masuk melalui repository, review kode, registry statis, dan deployment. Ini mempertahankan pengelolaan tema oleh Super Admin tanpa mengeksekusi kode unggahan.

Field bertipe `unggah`, seperti foto fallback, adalah opsi media dan bukan unggah paket kode. Jika dipertahankan untuk paritas, validasi jenis/ukuran file, simpan dalam ruang tenant, dan bersihkan aset lama saat diganti.

---

## 4. Rancangan target AppDes

### 4.1 Sumber tema dan batas peran

Kode tema menjadi bagian dari repository dan image build AppDes. Tidak ada endpoint unggah ZIP, ekstraksi folder, atau eksekusi kode yang diunggah. Super Admin menyediakan tema dengan menerbitkan versi yang sudah masuk registry; Admin Desa hanya memilih tema terbit dan mengatur opsi yang diizinkan oleh tema tersebut.

| Aktor | Tanggung jawab | Yang tidak boleh dilakukan |
|---|---|---|
| Developer/agent | Membuat atau memperbarui paket tema di repository, menambah registry, tes, dan migrasi opsi | Mengubah data produksi tanpa persetujuan |
| CI/deployment | Memeriksa manifest, schema, registry, typecheck, test, build, lalu menyertakan paket dalam aplikasi | Mengaktifkan slug yang tidak ada di registry build |
| Super Admin | Melihat pratinjau paket tersedia, mengatur status terbit/arsip, memilih tenant, dan mendistribusikan versi yang tersedia | Mengunggah source ZIP atau membuat slug paket yang tidak dikodekan |
| Admin Desa | Memilih tema terbit, melihat pratinjau, dan mengisi opsi per desa yang dibuka oleh schema tema | Membuat, mengubah source, menerbitkan, atau mengunggah paket tema |

### 4.2 Struktur paket dan kontrak komponen

Simpan tema dan versinya sebagai kode terpisah. Registry hanya mengimpor berkas yang ditulis eksplisit dalam source.

```text
src/themes/
  types.ts
  registry.ts
  esensi/1.0.0/
    manifest.json
    config.json
    layout.tsx
    pages/
    widgets/
    theme.module.css
    assets/
  natra/1.0.0/
    manifest.json
    config.json
    layout.tsx
    pages/
    widgets/
    theme.module.css
    assets/
```

`manifest.json` memuat `slug`, `version`, versi kompatibilitas, daftar surface, dan path pratinjau. Nama, kategori, deskripsi, tag, serta status publikasi berada di `website_templates` dan dikelola Super Admin. `config.json` memuat schema opsi dan default yang tetap berasal dari kode paket. CSS module mengatur style; aset paket hanya dimuat dari direktori tema yang dikompilasi.

`src/themes/types.ts` menetapkan kontrak `ThemeDefinition`: manifest, schema opsi Zod, default opsi, komponen layout, dan komponen halaman bertipe. `ThemeLayoutProps` menerima identitas desa, lokasi, menu aktif, opsi tervalidasi, serta `children`. Setiap komponen halaman menerima data yang sudah dimuat route/use case, bukan akses database.

`src/themes/registry.ts` memetakan pasangan slug/versi ke import statis, misalnya `esensi@1.0.0` dan `natra@1.0.0`. `ThemeRenderer` menerima slug/versi hasil pembacaan server, mencocokkannya dengan registry, memvalidasi opsi, lalu memilih komponen halaman. Jangan membangun `import()` dari slug database. Ikuti [panduan dynamic import Next.js](https://nextjs.org/docs/app/guides/lazy-loading) dan wajib buktikan registry dengan `npm run build`.

### 4.3 Surface publik dan aliran data

Setiap paket tema harus memenuhi seluruh keluarga halaman situs publik. Cakupan saat ini berjumlah 35 route, termasuk tiga alias. Portal layanan mandiri warga dan keamanan akun pengguna berada di luar cakupan tema situs publik.

| Surface | Route yang harus memakai registry tema |
|---|---|
| Beranda | `/` |
| Profil | `/profil`, `/sejarah`, `/visi-misi`, `/wilayah`, `/pemerintahan`, `/perangkat/[id]`, `/desa/status-des`, `/profil/sejarah`, `/profil/visi-misi` |
| Konten | `/informasi`, `/halaman/[slug]`, `/berita`, `/berita/[slug]`, `/pengumuman`, `/pengumuman/[slug]`, `/agenda`, `/agenda/[id]`, `/dokumen` |
| Data publik | `/statistik`, `/data/statistik`, `/pembangunan`, `/pembangunan/[slug]`, `/potensi`, `/transparansi/apbdes`, `/transparansi/laporan-keuangan` |
| Media | `/galeri`, `/galeri/[slug]` |
| Layanan | `/layanan`, `/layanan/surat`, `/pengaduan`, `/pengaduan/baru`, `/pengaduan/berhasil`, `/pengaduan/lacak`, `/kontak` |

Route tetap menangani tenant dari host, izin bila ada, dan pengambilan data melalui use case yang sekarang. Route meneruskan data bertipe ke `ThemeDefinition.pages`; tema hanya mengatur presentasi. Satukan pemuatan tema menjadi satu pembacaan per render route, lalu teruskan hasilnya ke layout/header/footer. `PublicSiteHeader` dan `PublicSiteFooter` saat ini memanggil loader sendiri, sementara beranda juga memuat tema langsung.

Setiap `ThemeDefinition.pages` menyediakan renderer untuk semua surface wajib. Jika satu surface benar-benar sama untuk semua tema, gunakan komponen bersama yang tercatat pada matriks. CI menolak paket yang tidak punya implementasi untuk surface wajib. Jangan mengganti field atau aksi halaman demi menyesuaikan tampilan tema.

### 4.4 Schema opsi dan paritas OpenSID

Buat schema opsi generik di `src/themes/types.ts` atau modul domain tema. Setiap opsi memiliki `key`, `label`, `description`, `type`, `default`, `group`, `readonly`, `options`, dan `attributes` bila relevan. CI memvalidasi semua `config.json`; server memvalidasi nilai saat disimpan dan saat dibaca. UI Super Admin/Tenant merender field hanya dari jenis kontrol yang diizinkan.

Jenis kontrol awal mengikuti konfigurasi tema OpenSID yang tersedia: `color-picker`, `select`, `input-number`, dan `unggah`. Tambahkan jenis lain hanya setelah inventaris tema OpenSID yang akan dipadankan membuktikan kebutuhannya. `unggah` berarti aset opsi, bukan source paket; validasi MIME/ukuran, ikat path ke tenant, dan hapus aset lama dengan aman.

Pemetaan minimum dari konfigurasi OpenSID lokal:

| Key OpenSID | Default/kendala acuan | Kontrak AppDes |
|---|---|---|
| `warna_dasar` | Natra: `#e64946`, `color-picker` | Opsi warna utama; validasi hex 6 digit dan map ke token tema yang ditetapkan |
| `statistik_desa` | Natra: `1`/`0`, `select` | Tampilkan/sembunyikan widget statistik footer |
| `jam` | Natra: `1`/`0`, `select` | Tampilkan/sembunyikan widget jam |
| `pintasan_masuk` | Natra: `1`/`0`, `select` | Tampilkan/sembunyikan tautan masuk yang tersedia bagi warga/admin |
| `foto_tidak_tersedia` | Natra: `unggah`, nilai awal kosong | Aset fallback gambar; simpan sebagai media tervalidasi, bukan data biner di JSON |
| `jumlah_pembangunan_perhalaman` | `10`, min `1`, max `50`, step `1` | Batas halaman daftar pembangunan publik |
| `jumlah_pengaduan_perhalaman` | `10`, min `1`, max `50`, step `1` | Batas halaman daftar/pelacakan pengaduan publik |

Esensi mendefinisikan dua key jumlah per halaman yang sama. Gabungan konfigurasi Esensi dan Natra saat ini memiliki tujuh key unik; jangan menyebutnya enam tanpa menjelaskan field yang dikecualikan. Pertahankan `keterangan`, `options`, `attributes`, `readonly`, `link`, dan `group` dari konfigurasi OpenSID bila memengaruhi UI atau perilaku.

Simpan opsi tenant pada `theme.opsi.templateOptions`, terpisah dari `templateTokens` lama dan `branding`. Perubahan schema opsi harus punya fungsi migrasi versi: pertahankan nilai yang masih valid, map key lama, gunakan default terdokumentasi untuk key baru, dan tampilkan peringatan untuk nilai yang tidak dapat dipetakan.

### 4.5 Registry, katalog, peran, dan versi

`src/themes/registry.ts` menjadi sumber kebenaran untuk slug, versi kode, surface, schema opsi, dan default paket. `website_templates` menyimpan status publikasi, metadata katalog, serta snapshot token/default yang disinkronkan dari registry; CI dan use case memastikan setiap entri terbit cocok dengan slug/versi registry. Super Admin boleh mengubah status dan metadata katalog yang diizinkan, bukan source, schema, atau default paket.

`website_template_versions` menyimpan changelog dan snapshot token/default opsi, bukan source code. Bila kolom `tokens` saat ini tidak cukup untuk snapshot konfigurasi, tambahkan kolom lewat migrasi Drizzle. Kode tetap di registry; `theme.slug` dan `theme.versi` memilih paket per desa. `distribusikanVersiTemplate` hanya mengirim versi yang sudah dibundel. Pertahankan versi lama di repository sampai tidak ada tenant yang memakainya.

Flow yang harus terlihat di UI:

1. Developer menambah paket dan registry melalui perubahan kode, lalu CI memvalidasi.
2. Deployment menyertakan versi paket yang lolos pemeriksaan.
3. Super Admin mempratinjau, menerbitkan/mengarsipkan, dan mendistribusikan slug/versi registry.
4. Admin Desa memilih tema terbit dan mengatur opsi tenant yang diperbolehkan.
5. Situs publik membaca satu tema aktif tenant dan merender surface dengan data desa.

### 4.6 Migrasi komponen dan slug lama

1. Jadikan `esensi@1.0.0` paket kompatibilitas yang mempertahankan tampilan token saat ini, lalu pindahkan konten dari `PublicSiteHeader`, `PublicSiteFooter`, `HeroBeranda`, `PublicShell`, dan `GalleryShell` tanpa mengubah field/data.
2. Port `natra` sebagai paket kedua dengan susunan halaman yang benar-benar berbeda, bukan hanya CSS warna.
3. Sebelum rollout, inventarisasi semua slug/versi katalog dan baris `theme` aktif. `esensi` lama tanpa `layout`/teks dipetakan ke default `klasik` dan default teks lama.
4. `samudra-modern` sudah dibuat sebagai template token terbit oleh `scripts/platform/tambah-template-samudra.mjs`. Sediakan paket kompatibilitas/alias berkode atau migrasikan tenant pemakainya ke paket pengganti dengan opsi setara. Jangan membiarkan fallback diam-diam mengubah tampilan tenant.
5. Jalankan migrasi opsi pada database uji, verifikasi jumlah tenant dan nilai sebelum/sesudah, siapkan rollback, lalu minta persetujuan sebelum menyentuh produksi.

### 4.7 Super Admin dan Admin Desa

| Kemampuan | Super Admin | Admin Desa |
|---|---:|---:|
| Melihat/pratinjau paket yang ada di registry | Ya | Tema terbit yang tersedia untuk desa |
| Membuat folder/source/config tema | Tidak melalui UI; perubahan melalui repository dan deployment | Tidak |
| Mengunggah ZIP tema | Tidak | Tidak |
| Mengubah status terbit/arsip dan metadata katalog | Ya, hanya untuk slug/versi registry | Tidak |
| Memilih tema aktif untuk satu desa | Ya, termasuk distribusi versi | Ya, hanya dari daftar tema terbit yang diizinkan |
| Mengubah opsi tema per desa | Tidak melalui UI; default tersimpan pada source package | Ya, hanya field yang dinyatakan editable |

UI lama `/super-admin/template/baru` tidak boleh membuat slug bebas yang tidak ada di registry. Ganti menjadi tindakan katalog untuk paket terdaftar atau hapus aksi create bebas. UI tenant mempertahankan pilihan tema, tetapi tidak menampilkan aksi membuat/menerbitkan paket.

---

## 5. Batasan implementasi

1. Source tema hanya boleh berasal dari kode yang direview dan masuk ke build registry. Tidak ada ZIP theme upload, filesystem scan runtime, `eval`, atau import dari path database.
2. Registry statis memvalidasi setiap pasangan `slug@version`. Slug/versi yang tidak terdaftar tidak boleh dipakai untuk memilih modul.
3. Super Admin hanya dapat menerbitkan, mengarsipkan, mempratinjau, dan mendistribusikan tema/versi yang sudah dibundel. Admin Desa hanya memilih tema terbit dan mengatur opsi tenant yang diizinkan.
4. Tenant tetap ditentukan oleh host/sesi server. Opsi, data publik, dan aset harus terikat ke `village_id`; komponen tema tidak menerima `villageId` untuk memilih tenant sendiri.
5. Field konfigurasi bertipe `unggah` adalah unggahan media terpisah, bukan source code. Validasi tipe/ukuran, penyimpanan tenant, otorisasi, dan pembersihan file lama wajib diuji.
6. Setiap tema wajib mempertahankan field, isi, fungsi, dan state route publik yang tercantum di matriks paritas. Layout boleh berbeda, data/aksi tidak boleh hilang.
7. Versi yang sedang dipakai tenant harus tetap ada dalam registry sampai tenant berpindah atau migrasi disetujui. Jangan mengganti tema lama dengan fallback klasik secara diam-diam.
8. Opsi disimpan dalam JSON `theme.opsi`; perubahan bentuk opsi tetap memerlukan migrasi data teruji walau tidak menambah kolom.
9. Jangan menjalankan migrasi produksi atau mengubah tema tenant aktif tanpa persetujuan eksplisit dan rencana rollback.

---

## 6. Langkah implementasi

### Task 1: Inventaris paritas dan slug aktif

**Berkas:** `docs/Dokumentasi-Implementasi-Template-ala-OpenSID.md`; OpenSID `storage/app/themes/esensi/config.json` dan `natra/config.json`; `src/db/schema/theme.ts`; `src/db/schema/website-templates.ts`.

- [ ] Catat semua key/config OpenSID, jenis kontrol, nilai default, options, attributes, group, readonly, file upload, serta halaman/widget yang menggunakannya.
- [ ] Buat pemetaan OpenSID → AppDes untuk label, type, schema Zod, nilai tenant, komponen publik, izin, dan test.
- [ ] Inventaris slug/versi dari katalog dan tema aktif tenant pada database non-produksi; jangan query atau migrasi produksi tanpa persetujuan.
- [ ] Putuskan pemetaan `samudra-modern` sebelum kode renderer membatasi slug ke registry.

**Hasil dan cek:** setiap field punya pemilik dan test; setiap slug aktif punya paket kompatibilitas atau instruksi migrasi.

### Task 2: Definisikan kontrak tema dan registry statis

**Berkas:** buat `src/themes/types.ts`, `src/themes/registry.ts`, dan `src/themes/registry.test.ts`; ubah `src/features/multi-desa/domain/template-website.ts` bila schema input katalog perlu dipersempit.

- [ ] Definisikan `ThemeManifest`, `ThemeOptionDefinition`, `ThemeDefinition`, `ThemeLayoutProps`, dan prop data per page surface.
- [ ] Daftarkan setiap tema/versi lewat static imports, bukan string path dari database.
- [ ] Validasi manifest, schema opsi, keunikan `slug@version`, dan semua surface wajib saat test/build.
- [ ] Tolak katalog dengan slug/versi yang tidak ada di registry; registry menentukan kode yang dapat dijalankan.

**Hasil dan cek:** test registry menolak slug/versi asing, duplikat, schema config invalid, dan surface wajib yang hilang.

### Task 3: Port `esensi` sebagai paket kompatibilitas

**Berkas:** buat `src/themes/esensi/1.0.0/`; adaptasi `src/app/public-site-layout.tsx`, `src/app/public-shell.tsx`, `src/app/galeri/gallery-shell.tsx`, dan `src/app/page.tsx`.

- [ ] Pindahkan struktur header/footer/hero/beranda sekarang tanpa mengganti data atau menghilangkan bagian.
- [ ] Map token lama ke `config.json`; nilai tanpa `layout`/teks tetap menghasilkan tampilan klasik yang sama.
- [ ] Pertahankan semua menu, field, aksi publik, status kosong, error, dan perilaku aksesibilitas.

**Hasil dan cek:** `src/app/public-site-layout.test.ts`, `src/app/public-shell.test.ts`, `src/app/galeri/gallery-shell.test.ts`, dan test renderer baru membuktikan tema Esensi memakai opsi desa serta menjaga output lama.

### Task 4: Port `natra` sebagai tema kedua

**Berkas:** buat `src/themes/natra/1.0.0/`; schema/pemetaan opsi pada `src/themes/natra/1.0.0/config.json`.

- [ ] Implementasikan layout/header/footer, hero, page surface, widgets, dan CSS dengan struktur yang benar-benar berbeda dari Esensi.
- [ ] Implementasikan tujuh key opsi Natra yang tercatat di bagian 4.4, termasuk page size dan gambar fallback.
- [ ] Jangan menghilangkan atau mengganti fungsi hanya karena paket Natra belum memiliki komponen padanan; gunakan surface bersama atau tandai pengecualian yang disetujui.

**Hasil dan cek:** test tiap key opsi memeriksa validasi/default dan perubahan UI/data; test rendering membuktikan Natra berbeda struktur dari Esensi.

### Task 5: Arahkan semua route situs publik ke kontrak tema

**Berkas:** `src/app/public-site-layout.tsx`, `src/app/public-shell.tsx`, `src/app/galeri/gallery-shell.tsx`, `src/app/page.tsx`, serta route publik lain yang saat ini memuat `PublicSiteHeader/Footer`.

- [ ] Tambahkan `ThemeRenderer` server-side yang memilih `registry[slug][version]` dan menerima page key serta data bertipe.
- [ ] Pertahankan data fetching di route/use case. Tema hanya merender props, tidak membaca database atau menentukan tenant.
- [ ] Satukan loader tema per request dan teruskan hasilnya ke header, footer, layout, dan page component.
- [ ] Pastikan 35 route situs publik, termasuk alias `/data/statistik`, `/profil/sejarah`, dan `/profil/visi-misi`, masuk ke shell/page map. Portal warga dan keamanan akun tetap di luar cakupan tema.

**Hasil dan cek:** test route map memastikan seluruh surface wajib punya renderer; tidak ada route publik yang diam-diam memakai shell berbeda.

### Task 6: Terapkan batas peran katalog

**Berkas:** `src/app/(admin)/super-admin/template/*`, `src/features/multi-desa/presentation/form-template.tsx`, `src/features/multi-desa/presentation/aksi-template.tsx`, `src/features/multi-desa/application/template-website-use-cases.ts`, `src/features/pengaturan/pengaturan/presentation/pengaturan-desa-client.tsx`, dan `src/app/(admin)/(pengaturan)/pengaturan/desa/page.tsx`.

- [ ] Ganti pembuatan slug bebas dengan daftar paket/versi registry.
- [ ] Batasi Super Admin pada pratinjau, terbit/arsip, metadata yang diizinkan, pilihan tenant, dan distribusi versi registry.
- [ ] Batasi Admin Desa pada pemilihan tema terbit dan pengisian opsi tenant yang editable.
- [ ] Hapus kontrol unggah/pindai source paket; pertahankan unggah media hanya untuk field opsi yang secara eksplisit memerlukannya.
- [ ] Uji permission, tenant isolation, slug asing, tema draft, dan distribusi versi.

**Hasil dan cek:** test use case menolak slug/versi tanpa paket, tenant tidak dapat mengubah katalog, dan Super Admin tidak dapat mengaktifkan kode yang belum dibuild.

### Task 7: Migrasikan katalog, opsi, dan tema tenant

**Berkas:** `src/features/multi-desa/infrastructure/template-website-repository.ts`, `src/features/multi-desa/application/template-website-use-cases.ts`, `src/db/schema/theme.ts`, migrasi Drizzle bila kontrak database berubah, dan skrip backfill terarah.

- [ ] Sinkronkan metadata paket dari registry ke katalog tanpa menghapus riwayat versi.
- [ ] Migrasikan `templateTokens` lama ke schema opsi baru, pertahankan `branding`, serta catat nilai default yang diterapkan.
- [ ] Map `esensi` dan `samudra-modern` secara eksplisit; jangan hapus versi lama selama masih ada tenant aktif.
- [ ] Uji idempotensi, tenant tanpa tema, nilai opsi invalid, rollback distribusi, dan tidak adanya kehilangan opsi.

**Hasil dan cek:** laporan dry-run mencatat jumlah tenant dan perubahan sebelum/sesudah; backup serta rollback tersedia sebelum persetujuan produksi.

### Task 8: Verifikasi dan rilis

- [ ] Jalankan `npm run typecheck`, lint terarah, `npx prettier --check` pada file berubah, test tema, dan `npm run build`.
- [ ] Jalankan browser smoke test untuk semua page family pada Esensi dan Natra: desktop, 320 px, terang/gelap, opsi aktif/nonaktif, empty/error, dan navigasi tenant.
- [ ] Verifikasi `prefers-reduced-motion`, focus dialog, dan aset tema tidak bocor antar tenant.
- [ ] Terbitkan paket registry hanya setelah build, test, dan pratinjau lulus; simpan versi lama selama masih dipakai.

**Kriteria selesai:** seluruh surface publik dirender melalui registry; tiap field OpenSID yang disepakati memiliki pemetaan/test; role Super Admin/Admin Desa sesuai tabel; tidak ada upload/eksekusi source ZIP; semua slug aktif dapat dirender atau sudah dimigrasikan dengan rollback.

---

## 7. Matriks paritas OpenSID → AppDes

| OpenSID | AppDes kini | Target implementasi |
|---|---|---|
| Folder tema berisi Blade, partial, widget, aset | Token warna/layout; belum ada `src/themes` | Paket folder versi di `src/themes/<slug>/<version>/`, masuk registry statis |
| `template.blade.php` dan `layouts/*.blade.php` | Header/footer dan shell bersama | `layout.tsx` per tema dengan props tenant/menu yang sama |
| `partials/`, `widgets/`, halaman fitur | Banyak markup masih komponen bersama | `pages/` dan `widgets/` per tema menerima data bertipe dari use case |
| CSS/JS tema | CSS module dan token global | CSS module per tema; interaksi ditulis sebagai komponen React yang direview, bukan JS unggahan |
| `config.json` dan form dinamis | Token tetap di katalog | Config manifest tervalidasi Zod, form opsi dinamis, opsi tenant di `theme.opsi.templateOptions` |
| Unggah ZIP, pindai folder, aktifkan | Tidak ada upload paket | Perubahan code melalui repo/build; Super Admin menerbitkan paket registry, Admin Desa memilih |
| Satu tema aktif per desa | Sudah ada melalui baris `theme` dan transaksi aplikasi | Pertahankan satu tema `slug@version` aktif per tenant dan uji konkurensi/migrasi |
| Data setiap desa | Use case/data tetap per tenant | Tetap dimuat oleh route/use case dan diteruskan sebagai props ke tema |

Paritas field konfigurasi harus dinilai dari pemetaan pada bagian 4.4, bukan hanya dari keberadaan `config.json`.

---

## 8. Catatan audit dan keputusan yang dikunci

1. `src/themes/` dan `TemaRenderer` belum ada pada checkout yang diaudit. `src/db/schema/theme.ts` masih merujuk `src/themes/registry.ts`; buat file tersebut atau perbarui komentar bersamaan dengan implementasi.
2. `samudra-modern` adalah slug katalog terbit yang dibuat oleh `scripts/platform/tambah-template-samudra.mjs`. Inventaris tenant aktif sebelum mengarsipkan atau memetakan slug ini.
3. Konfigurasi lokal Natra berisi tujuh key unik; Esensi mengulang dua key jumlah per halaman. Pemetaan awal di bagian 4.4 harus diperluas jika inventaris OpenSID lain menemukan field tambahan.
4. Route count saat ini 26 file mengimpor header/footer, 5 memakai `PublicShell`, 1 memakai `GalleryShell`, dan 3 alias (`/profil/sejarah`, `/profil/visi-misi`, `/data/statistik`) yang mengimpor komponen halaman utama. Tujuh halaman layanan mandiri warga dan keamanan akun tidak termasuk situs publik bertema.
5. Test header saat ini memeriksa varian, tetapi test `PublicShell` dan `GalleryShell` belum memberi `villageId`; tambahkan test untuk cabang yang memuat tema.
6. Tema Super Admin di UI saat ini berupa katalog token, bukan paket kode. Migrasi UI harus membatasi katalog ke registry dan menghapus pembuatan slug bebas.
7. Upload paket ZIP sengaja tidak menjadi target karena tema ditulis dan direview di kode. Upload media untuk opsi `unggah` tetap berbeda, dibatasi izin dan penyimpanan tenant.
