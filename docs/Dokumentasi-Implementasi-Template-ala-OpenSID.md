# Rencana implementasi tema situs publik ala OpenSID

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti sistem token-only dengan paket tema berkode yang mengatur layout, halaman publik, widget, aset, dan opsi konfigurasi.

**Architecture:** Kode tema disimpan dan direview di repository, lalu dimasukkan ke registry statis saat build. Super Admin mengelola tema yang sudah tersedia; Admin Desa hanya memilih tema terbit dan mengatur opsi yang diizinkan. Tidak ada unggah ZIP atau eksekusi kode tema saat runtime.

**Tech Stack:** Next.js 16.4.6 App Router, React 19.3, TypeScript, Zod 4, Drizzle ORM, MySQL.

**Spec:** Prinsip paritas OpenSID di `AGENTS.md` dan sumber lokal `D:\laragon\www\opensid\storage\app\themes`.

**Status (27 November 2026):** Registry, shell paket, form/API opsi tenant, helper migrasi, dan peta adapter 35 route tersedia. `npm run check` lulus (307 file/2.507 test); `NODE_ENV=production npm run build` lulus (250/250 halaman). Masih ada gap komposisi page per tema dan route, uji browser, migrasi tulis/rollback, serta konfigurasi deployment/DNS/TLS. Lihat bagian 6 dan 8.

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

1. **Masih ada 3 susunan token:** `klasik/modern/ringkas` mengubah header, hero, dan urutan beranda; sebagian besar isi halaman masih memakai komponen bersama.
2. **Kontrak tema tersedia, tetapi komposisi halaman per surface belum utuh:** page function saat ini hanya membungkus children bersama.
3. **Cakupan tema per route masih parsial:** peta mencatat 35 route, tetapi hanya 7 route instance memakai layout/page paket; route lain terutama memakai header/footer bersama.
4. **Form opsi tenant dan API simpan/unggah tersedia; consumer utama sudah terhubung:** toggle jam Natra, warna/pintasan di shell bersama, pagination page-size, dan validasi path media per tenant kini ada; uji browser serta migrasi tulis belum dilakukan.
5. **Slug registry dibatasi:** Super Admin tidak dapat mendaftarkan slug kode asing, tetapi katalog token masih dikelola melalui form.

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

**Berkas:** OpenSID `storage/app/themes/esensi/config.json` dan `natra/config.json`; `src/themes/*/config.json`; `src/db/schema/theme.ts`; `src/db/schema/website-templates.ts`.

- [x] Inventaris dua konfigurasi bawaan: Natra memiliki tujuh key, Esensi memakai kembali dua key page-size.
- [x] Catat type, default, options, attributes, group, readonly, serta tujuan field pada matriks bagian 4.4.
- [x] Tambahkan alias kode `samudra-modern@1.0.0` ke `natra@1.0.0` di registry.
- [x] Inventaris slug/versi aktif tiap tenant memakai database nonproduksi (dry-run `scripts/platform/backfill-opsi-tema.mjs`).

**Status:** dry-run pada database dev menemukan 2 tenant aktif, keduanya `esensi@1.0.0`; tidak ada baris `samudra-modern` aktif. Tidak ada penulisan data.

### Task 2: Registry statis dan kontrak tema

**Berkas:** `src/themes/types.ts`, `src/themes/registry.ts`, `src/themes/registry.test.ts`, `src/features/multi-desa/application/template-website-use-cases.ts`.

- [x] Buat manifest/config parser, static registry, alias legacy, dan guard slug katalog.
- [x] Tambahkan komponen per page surface (`pages`) dan widget (`widgets`) ke `ThemeDefinition`.
- [x] `validasiRegistry()`/`registry.test.ts` memastikan setiap surface memiliki fungsi; ini membuktikan struktur, bukan perilaku halaman yang berbeda.
- [ ] Implementasikan dan uji komposisi per surface yang terlihat pengguna; page function saat ini hanya membungkus children bersama.
- [x] Use case Super Admin menolak pembuatan katalog untuk slug yang tidak ada di registry.

**Status:** registry dan kontrak page/widget bertipe tersedia; komposisi halaman paket yang berbeda masih belum lengkap.

### Task 3: Paket Esensi

**Berkas:** `src/themes/esensi/1.0.0/`, `src/app/page.tsx`, `src/app/public-site-layout.tsx`, `src/app/public-shell.tsx`, `src/app/galeri/gallery-shell.tsx`.

- [x] Paket memiliki manifest, config, CSS module, dan `layout.tsx`.
- [x] Paket menyediakan fungsi page untuk setiap surface, tetapi saat ini semuanya membungkus `children` bersama, bukan menyusun halaman khusus per route.
- [x] Header/footer/hero tetap komponen bersama bertema token karena paritas field dan aksi harus dipertahankan; pemetaannya dicatat pada peta route publik.
- [ ] Bukti visual paritas semua route, empty/error state, dan aksesibilitas di browser (belum dijalankan).

**Status:** Esensi memakai konten bersama dengan shell kompatibilitas; komposisi halaman khusus paket dan bukti browser masih terbuka.

### Task 4: Paket Natra

**Berkas:** `src/themes/natra/1.0.0/`, `src/themes/types.ts`, `src/app/public-site-layout.tsx`.

- [x] Paket memiliki manifest, config tujuh key, CSS module, dan layout sidebar.
- [x] Consumer runtime ditemukan untuk warna/pintasan di `PublicSiteHeader`/`PublicShell`/`GalleryShell`, statistik/jam di footer atau layout Natra, fallback foto di `/galeri` dan `/pembangunan`, serta kedua opsi page-size.
- [x] `jam=0` menyembunyikan jam sidebar Natra: `NatraLayout` memeriksa `opsi.jam` sebelum memanggil `widgets.jam`.
- [x] Pagination untuk kedua opsi `jumlah_*_perhalaman`: `/pembangunan` (`?tahun=&page=`) dan `/pengaduan` (`?page=`) menampilkan batas per halaman + navigasi Sebelumnya/Berikutnya, sehingga data di luar halaman pertama tetap terjangkau.
- [ ] Uji menu aktif, responsive, fallback aset, dan alur publik pada tema Natra di browser.

**Status:** consumer opsi dan pagination tersedia di source; verifikasi browser dan data nyata belum dilakukan.

### Task 5: Integrasi registry ke route publik

**Berkas:** `src/themes/renderer.tsx`, `src/app/page.tsx`, `src/app/public-shell.tsx`, `src/app/galeri/gallery-shell.tsx`, route publik lainnya.

- [x] `TemaRenderer` server-side memilih slug/versi dari registry statis.
- [x] Renderer membungkus beranda, `PublicShell`, dan `GalleryShell`.
- [x] Petakan 35 route ke adapter yang disetujui (renderer, shell, header/footer bersama, atau alias). Peta adapter tidak berarti seluruh route memakai renderer paket.
- [x] Tambahkan `surface` + `ThemePageProps` bertipe; renderer memilih `definisi.pages[surface]` di dalam layout paket.
- [x] Satukan pemuatan tema satu kali per route dengan `cache()` React pada `muatTemaPublik`.
- [x] Tambahkan test peta route untuk impor adapter/alias; test tidak memverifikasi hasil render atau layout paket di setiap route.

**Status:** inventaris adapter tersedia; hanya sebagian route instance memakai renderer paket langsung. Shell bersama `PublicShell`/`GalleryShell` kini ikut menerapkan `warna_dasar` dan `pintasan_masuk` dari opsi tenant (`public-shell.test.ts`, `gallery-shell.test.ts`); uji browser belum dilakukan.

### Task 6: Batas katalog Super Admin dan pilihan tenant

**Berkas:** `src/app/(admin)/super-admin/template/*`, `src/features/multi-desa/presentation/form-template.tsx`, `src/features/multi-desa/application/template-website-use-cases.ts`, `src/features/pengaturan/pengaturan/presentation/pengaturan-desa-client.tsx`.

- [x] Slug katalog tanpa paket registry ditolak.
- [x] Admin Desa dapat memilih dan menerapkan template terbit.
- [x] Batasi form Super Admin pada metadata/status registry: form katalog baru memilih paket `slug@version` dari registry (bukan isian bebas), dan use case menolak pasangan di luar registry. Token katalog ditetapkan sebagai **default katalog**, opsi tema per desa menjadi override.
- [x] Sediakan form opsi tenant dari `config.json` (`pengaturan-desa-bagian-tema-opsi.tsx`, section `opsi-tema` di `/api/pengaturan-desa`, serta unggah/hapus aset lewat `/api/pengaturan-desa/opsi-tema/media`).
- [x] Validasi path media opsi terhadap `villageId` sebelum mengganti/menghapusnya: simpan opsi menolak path di luar `<villageId>/`, dan ganti/hapus aset mengabaikan path tenant lain (`pengaturan-desa-opsi-tema.test.ts`).
- [x] Tidak ada unggah ZIP source tema; upload media untuk field `unggah` terpisah.

**Status:** form opsi, upload, dan pembatasan path media per tenant selesai; kebijakan katalog selesai.

### Task 7: Migrasi opsi dan data tema tenant

**Berkas:** `src/features/multi-desa/infrastructure/template-website-repository.ts`, `src/features/multi-desa/application/template-website-use-cases.ts`, `src/themes/types.ts`, `src/db/schema/theme.ts`, migrasi/backfill bila diperlukan.

- [x] Alias runtime `samudra-modern@1.0.0` → `natra@1.0.0` tersedia.
- [x] Inventaris slug/versi aktif tenant dari database dev (dry-run `backfill-opsi-tema.mjs`): 2 tenant aktif, keduanya `esensi@1.0.0`; tanpa penulisan.
- [x] Hubungkan `migrasiOpsiVersi` ke alur simpan opsi, penerapan template, dan distribusi versi (`src/themes/migrasi.ts` → use case + repository).
- [x] Alur ganti/distribusi Super Admin mempertahankan nilai yang tidak dikenal (`{...opsiLama, ...migrasi.opsi}`) dan mencatat jumlah opsi tak terpetakan pada audit, sehingga tidak ada penghapusan diam-diam.
- [x] Penghapusan berkas opsi media dibatasi ke ruang tenant (`pathMediaTenant`), sehingga path dari data lama tidak dapat menghapus berkas desa lain.
- [x] Dry-run `templateTokens`/`templateOptions` dijalankan dua kali dengan hasil identik (idempoten, tidak menulis). Uji opsi invalid dan tenant tanpa tema tercakup unit test (`src/themes/migrasi.test.ts`).
- [ ] Uji tulis nyata dan rollback pada database nonproduksi belum dijalankan (menunggu persetujuan).

**Status:** migrasi, preservasi opsi tak dikenal, pembatasan path media, dan dry-run terbukti; hanya uji tulis/rollback yang belum dijalankan.

### Task 8: Verifikasi dan rilis

- [x] `npm run typecheck` lulus tanpa diagnostic TypeScript.
- [x] `npm run lint` lulus.
- [x] `npm run check` lulus penuh: typecheck, ESLint, Prettier, dan 307 file test / 2.507 test.
- [x] `NODE_ENV=production npm run build` exit 0; 250/250 halaman diprerender. `.env` lokal menetapkan `NODE_ENV=development`, jadi build release harus memakai environment production.
- [ ] Uji browser/aksesibilitas dan migrasi tulis/rollback tenant belum diverifikasi.
- [ ] Jangan upload sebelum gap paritas ditutup, test/format/build lulus, dan target server serta prosedur rollback dikonfirmasi.

**Kriteria selesai:** registry menghubungkan semua surface, opsi yang disepakati memiliki consumer runtime, data tenant lama aman, formatting/test/build lulus, dan browser smoke tercatat.

---

## 7. Matriks paritas dan status source

| OpenSID | Implementasi yang ditemukan | Status terhadap target |
|---|---|---|
| Folder tema, Blade, layout, partial, widget, aset | Dua paket memiliki manifest, config, layout, CSS, `pages.tsx`, dan `widgets.tsx` | Parsial; komponen page masih membungkus children bersama, belum memberi komposisi per surface |
| `template.blade.php` dan layout page | Peta 35 route: 1 renderer langsung, 6 shell, 25 header, 3 alias | Parsial; hanya 7 route instance memakai layout/page paket, sisanya memakai header/footer bersama |
| `config.json` dan form dinamis | Parser, form opsi tenant, endpoint simpan/unggah, widget, serta consumer semua tujuh opsi | Setara fungsi; uji browser belum dilakukan |
| Scan/unggah ZIP/aktifkan | Tidak ada upload source; slug dibatasi registry | Sesuai keputusan produk; source paket datang melalui repository/build |
| Satu tema aktif per desa | Row `theme` dan transaksi tenant tersedia | Dry-run database dev mencatat 2 tenant aktif `esensi@1.0.0` tanpa penulisan; migrasi tulis/rollback belum dijalankan |
| Data per desa dari database | Use case publik tetap menjadi sumber data | Batas tenant dipertahankan; banyak route masih memakai markup/layout bersama, bukan renderer paket |

## 8. Status implementasi dan bukti verifikasi

1. Registry dan paket Esensi/Natra memiliki `layout`, `pages.tsx`, `widgets.tsx`, config, CSS, dan manifest; page function saat ini membungkus children bersama.
2. `ThemeDefinition` mewajibkan `layout`, `pages`, dan `widgets`; registry test memeriksa keberadaan fungsi, bukan perilaku/komposisi visual setiap page.
3. Peta route mencatat 35 entri: 1 renderer langsung, 6 shell, 25 header bersama, dan 3 alias. Hanya 7 route instance memakai `TemaRenderer`; test memeriksa adapter/impor, bukan output render semua route.
4. Form opsi dan API simpan/unggah tersedia. `jam=0` menyembunyikan jam sidebar Natra; page-size menggunakan pagination `?page=`; shell bersama menerapkan warna/pintasan; fallback foto dipakai di `/pembangunan`; path media dibatasi ke tenant.
5. `migrasiOpsiVersi` dipakai saat menyimpan opsi dan menerapkan template. Alur Super Admin ganti/distribusi mempertahankan key lama di luar schema tujuan dan mencatat jumlah opsi tak terpetakan pada audit. Dry-run dev mencatat 2 tenant `esensi@1.0.0` tanpa penulisan; uji tulis/rollback belum dilakukan.
6. Verifikasi terbaru: `npm run check` exit 0 (307 file/2.507 test); `NODE_ENV=production npm run build` exit 0 (250/250 halaman). Browser smoke visual, DNS/TLS, dan target deployment/rollback belum diverifikasi.
7. Allowlist proxy publik (`src/lib/public-paths.ts`) diperluas untuk halaman yang sebelumnya dialihkan ke `/masuk-admin`: `/informasi`, `/halaman`, `/agenda`, `/pengumuman`, `/transparansi`, `/perangkat`, `/pengaduan`, serta pola `/pembangunan/[slug]` dengan pengecualian `/pembangunan/buku`.

## 9. Rujukan kode

1. Registry/types: `src/themes/{registry,renderer,types}.ts`; paket `src/themes/esensi/1.0.0/` dan `src/themes/natra/1.0.0/`.
2. Route/render: `src/app/page.tsx`, `src/app/public-site-layout.tsx`, `src/app/public-shell.tsx`, `src/app/galeri/gallery-shell.tsx`.
3. Tenant/catalog: `src/features/multi-desa/application/template-website-use-cases.ts`, `src/features/multi-desa/infrastructure/template-website-repository.ts`, `src/features/pengaturan/pengaturan/presentation/pengaturan-desa-client.tsx`.
4. Test: `src/themes/registry.test.ts`, `src/features/multi-desa/domain/template-website.test.ts`, `src/features/multi-desa/application/template-website-use-cases.test.ts`, `src/app/public-site-layout.test.ts`, `src/app/public-shell.test.ts`, `src/app/galeri/gallery-shell.test.ts`.

## 10. Batas verifikasi

Source, test terarah, typecheck, ESLint, Prettier, production build (salinan terisolasi), dan dry-run inventaris tenant telah diperiksa. Belum diverifikasi: browser smoke (tampilan Esensi vs Natra, reduced-motion, fokus keyboard, isolasi aset), eksekusi tulis migrasi opsi/backfill pada database nonproduksi beserta rollback, serta rilis paket.
