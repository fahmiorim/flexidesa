# Audit dan rencana implementasi Super Admin FlexiDesa

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pertahankan fondasi Super Admin, rapikan navigasi, selesaikan integrasi tema berkode, dan tambahkan operasi lintas tenant yang disetujui.

**Architecture:** Gunakan route, use case, repository, schema, dan audit yang sudah tersedia. Tambahkan UI hanya untuk gap yang dibuktikan. Billing, support, analitik, multi-role, dan pekerjaan terjadwal tetap menjadi gerbang keputusan produk.

**Tech Stack:** Next.js 16.4.6 App Router, React 19.3, TypeScript, Drizzle ORM, MySQL, Vitest.

**Spec:** `AGENTS.md`, dokumen [tema situs publik ala OpenSID](Dokumentasi-Implementasi-Template-ala-OpenSID.md), dan source di `src/app/(admin)/super-admin/`.

**Status:** Audit statis dan rencana implementasi. Audit awal bertanggal 26 November 2026; rencana diperbarui 27 November 2026. Browser dan operasi produksi belum diverifikasi.

**Branch audit:** `main` sesuai catatan audit awal. Verifikasi commit sebelum menjalankan task.

## Global constraints

1. Pertahankan tenant, domain, paket/fitur, template, pengguna platform, audit, dan pengaturan yang sudah ada. Jangan membangun katalog duplikat.
2. Setiap halaman Super Admin memakai `pastikanSuperAdmin`; setiap mutasi memakai use case yang memanggil `requireSuperAdmin`.
3. Validasi akses lintas tenant di server dan catat operasi sensitif.
4. Pertahankan satu role `super-admin` sampai pemilik produk menyetujui role platform tambahan.
5. Tema source masuk melalui repository dan registry build. Super Admin menerbitkan paket terdaftar; Admin Desa hanya memilih tema terbit.
6. Jangan memperluas scope ke billing, support, analitik, provider console penuh, atau backup terjadwal tanpa keputusan produk tertulis.
7. Jangan menjalankan migrasi atau restore produksi tanpa persetujuan, backup, verifikasi, dan rencana rollback.

## Review focus

1. Pengguna tanpa role Super Admin tidak dapat membaca atau mengubah route, Server Action, maupun API platform.
2. Pemisahan Tenant dan Domain tidak memutus URL lama, breadcrumb, atau indikator menu aktif.
3. Tema tenant selalu menunjuk slug/versi yang ada di registry build.
4. Restore database menjelaskan bahwa seluruh desa terdampak dan meminta konfirmasi sebelum dijalankan.
5. Fitur tanpa pemilik, sumber data, dan acceptance criteria tidak masuk rilis.

## 1. Ringkasan audit

Konsol sudah memiliki dashboard, provisioning tenant, domain, paket/versi, katalog template token, pengguna platform, audit trail, dan pengaturan. Rencana ini mempertahankan fondasi tersebut.

**Ada di aplikasi atau tingkat tenant:** API key, plugin, notifikasi/provider, serta API backup/restore database. **Belum ditemukan sebagai konsol platform:** health provider lintas tenant, jadwal backup, ticketing, analitik lintas tenant, billing lengkap, dan UI pengelolaan role platform.

Dokumen ini memisahkan kondisi source dari target produk. “Belum ditemukan” bukan bukti fitur tidak ada di layanan eksternal; item tersebut perlu bukti sebelum dibangun.

## 2. Ruang lingkup dan metode

Audit statis mencakup `src/app/(admin)/super-admin/`, navigasi platform, sidebar, use case/domain/repository multi-desa, schema database, sebagian API/infrastruktur, serta Blueprint Fungsional AppDes. Audit tidak menjalankan browser, migrasi database, restore, atau uji operasional.

Status “ada” berarti implementasi ditemukan pada source. Status tersebut tidak menjamin semua alur runtime sudah lolos uji. Setiap task di bagian 7 menyebut tes yang harus dijalankan sebelum implementasi dianggap selesai.

## 3. Inventaris implementasi yang dipertahankan

| Area | Route/source utama | Kondisi saat ini |
|---|---|---|
| Dashboard | `/super-admin` | Ringkasan tenant, domain, pengguna, audit, retensi, dan perhatian operasional |
| Tenant | `/super-admin/tenant`, `/super-admin/tenant/tambah` | Daftar, provisioning, status, lifecycle, kuota, reset akses, dan ekspor |
| Domain | `/super-admin/domain`, `/super-admin/domain/tambah`, `/super-admin/domain/[domainId]` | Domain utama/alias, DNS, SSL, cache pemeriksaan, dan detail |
| Paket | `/super-admin/paket`, `/super-admin/paket/baru`, `/super-admin/paket/[paketId]`, `/super-admin/paket/tenant` | Katalog, versi, fitur modul, publikasi, penetapan, dan distribusi |
| Template | `/super-admin/template/*` | Katalog token, metadata, status, snapshot versi, penggunaan, distribusi, fondasi tenant |
| Pengguna platform | `/super-admin/pengguna` | Buat/nonaktifkan akun, reset sandi, cabut sesi; role saat ini `super-admin` |
| Audit | `/super-admin/audit`, `/super-admin/audit/ekspor` | Daftar dan ekspor audit platform |
| Pengaturan | `/super-admin/pengaturan` | Environment, email/TTE, proxy, domain dasar, dan retensi; nilai sensitif sebagian besar baca-saja |
| Backup database | `/api/database/backup`, `/api/database/restore` | API/use case global, Super Admin only, audit event; UI Super Admin belum ditemukan |
| API key/plugin/notifikasi | Schema dan fitur tingkat tenant | Ada pada aplikasi/tenant; belum ditemukan konsol provider lintas tenant |

### 3.1 Tenant dan domain

Use case/repository mendukung provisioning, aktif/nonaktif, domain, kuota media, reset akses admin, ekspor, retensi, dan purge. Pemeriksaan DNS/SSL memakai domain terdaftar, menyimpan cache, dan mendukung pemeriksaan tunggal maupun massal.

Menu platform saat ini memberi label Tenant ke href `/super-admin/domain` dan menyertakan `/super-admin/tenant` sebagai route tambahan. Route tidak hilang, tetapi label dan tujuan induk membingungkan.

### 3.2 Paket, pengguna, audit, dan pengaturan

Paket mencakup versi, daftar slug fitur, langganan tenant, dan distribusi versi. Ini entitlement fitur, bukan billing penuh. Harga, invoice, pembayaran, jatuh tempo, dan perpanjangan belum ditemukan.

Pengelolaan pengguna platform, audit trail, dan pengaturan deployment sudah ada. Role platform yang ditemukan berpusat pada `super-admin`; belum ada UI untuk membuat role platform lain. Nilai environment tertentu harus tetap baca-saja karena memerlukan perubahan deployment/restart.

### 3.3 Template website

Katalog token dan penerapannya sudah berjalan. Super Admin mengelola katalog/versi; Admin Desa memilih template terbit dan menerapkannya di Pengaturan Desa. Use case memvalidasi token, repository menyimpan tema aktif tenant, lalu beranda/header/footer membaca tema aktif.

Pratinjau pada detail katalog hanya menampilkan token katalog. Teks “belum otomatis dipakai” merujuk pratinjau itu, bukan ketiadaan seluruh alur penerapan. Gap yang disetujui adalah paket layout/halaman berkode seperti OpenSID. Ikuti [rencana tema situs publik](Dokumentasi-Implementasi-Template-ala-OpenSID.md), tanpa membuat katalog kedua.

### 3.4 Backup dan restore

Endpoint backup/restore dan use case sudah ada. Backup mencakup seluruh database; use case dan restore route memerlukan Super Admin, restore memvalidasi konfirmasi/format/ukuran, memverifikasi hasil, dan mencatat audit. UI Super Admin, jadwal, retensi backup, dan riwayat job belum ditemukan.

## 4. Struktur menu target dan batas peran

Struktur ini adalah target navigasi; tidak semua menu menjadi scope rilis pertama.

1. **Dashboard:** ringkasan tenant/domain/paket dan perhatian operasional.
2. **Manajemen Tenant:** daftar, provisioning, detail, status, kuota, akses admin, ekspor, lifecycle.
3. **Domain & Infrastruktur:** domain utama/alias, DNS, SSL, riwayat pemeriksaan.
4. **Paket & Langganan:** paket, fitur, versi, penetapan; billing tetap opsional.
5. **Website & Template:** registry/katalog, pratinjau, status, versi, penggunaan, distribusi, fondasi tenant.
6. **Pengguna & Hak Akses:** akun platform, sesi, akses; role tambahan hanya bila disetujui.
7. **Integrasi Platform:** status email, WhatsApp, TTE, API/plugin; secret tenant tidak dipindahkan.
8. **Operasional & Pemeliharaan:** status aplikasi/database, backup/restore manual, kapasitas.
9. **Keamanan & Audit:** audit trail, sesi, aktivitas sensitif, retensi.
10. **Support & Bantuan:** tiket, keluhan, pengumuman; menunggu kebutuhan produk.
11. **Laporan & Analitik:** metrik agregat; menunggu sumber data dan batas privasi.
12. **Pengaturan Platform:** identitas, kebijakan, retensi, konfigurasi aman.

Super Admin mengelola platform dan operasi lintas tenant. Admin Desa tetap mengelola data desanya. Akses dukungan lintas tenant harus menyebut alasan dan menghasilkan audit event.

## 5. Matriks status dan scope

| Area | Status saat ini | Tindakan pada rencana |
|---|---|---|
| Dashboard, tenant, domain, paket | Ada | Pertahankan; ubah navigasi dan audit alur, jangan bangun ulang |
| Template token | Penerapan tenant dan rendering publik ada | Migrasikan ke paket kode registry; pertahankan alur Terapkan Template |
| Pengguna dan audit | Ada | Audit reset/nonaktif/sesi serta kelengkapan event |
| Platform RBAC | Satu role `super-admin`; UI role lain tidak ada | Pertahankan untuk rilis awal; multi-role menunggu approval/matriks izin |
| API key/plugin/notifikasi | Fitur tenant/app ada | Konsol pusat hanya setelah secret ownership, izin, dan health contract ditetapkan |
| Backup/restore | API/use case Super Admin ada; UI tidak ada | Tambah UI manual; scheduler/retensi job menunggu desain operasional |
| Monitoring | Konsol terpusat belum ditemukan | Tetapkan metrik, sumber, interval, dan owner sebelum coding |
| Billing/support/analitik | Belum ditemukan atau belum dibutuhkan | Deferred sampai model bisnis/operasional dan acceptance criteria disetujui |

## 6. Rencana implementasi bertahap

Tahap ini mempertahankan fitur yang ada. Fitur deferred tidak menghalangi rilis awal.

### Tahap 0: Bekukan baseline dan scope

**Berkas:** dokumen ini, `docs/Dokumentasi-Implementasi-Template-ala-OpenSID.md`, `src/features/navigation/domain/menu-platform.ts`, dan source route/use case/schema yang dirujuk.

1. Tandai tiap item sebagai ada, perlu perubahan, baru, atau deferred.
2. Catat bukti page/action/use case/repository/schema/test untuk item yang berubah.
3. Pertahankan satu role `super-admin`; jika operator tambahan diperlukan, buat matriks permission dan keputusan terpisah.
4. Audit slug/tenant aktif hanya pada database nonproduksi atau ekspor yang disetujui.

**Selesai bila:** scope rilis, deferred items, pemilik, dan bukti source tercatat tanpa klaim status yang tidak diverifikasi.

### Tahap 1: Pisahkan navigasi dan harden akses

**Berkas:** `src/features/navigation/domain/menu-platform.ts`, `menu-platform.test.ts`, `header-platform.ts`, `header-platform.test.ts`, `src/app/(admin)/super-admin/guard.ts`, serta route/action Super Admin yang ditemukan audit.

1. Jadikan `/super-admin/tenant` tujuan Manajemen Tenant; jadikan `/super-admin/domain` tujuan Domain & Infrastruktur.
2. Perbarui label, submenu, breadcrumb, route aktif, dan redirect lama.
3. Audit setiap page dan mutasi: page memanggil `pastikanSuperAdmin`; use case/action memanggil `requireSuperAdmin` atau guard setara.
4. Jangan membuat UI role platform pada tahap ini.

**Test:** `npx vitest run --config vitest.config.mts src/features/navigation/domain/menu-platform.test.ts src/features/navigation/domain/header-platform.test.ts "src/app/(admin)/super-admin/page.test.ts" "src/app/(admin)/super-admin/domain/page.test.ts" "src/app/(admin)/super-admin/tenant/page.test.ts"`.

**Selesai bila:** Tenant dan Domain punya tautan/breadcrumb terpisah; URL lama tetap berfungsi; akses tanpa Super Admin ditolak pada page dan mutasi.

### Tahap 2: Integrasikan tema berkode

**Spec:** `docs/Dokumentasi-Implementasi-Template-ala-OpenSID.md`. Berkas utama: `src/themes/`, `src/features/multi-desa/domain/template-website.ts`, `template-website-use-cases.ts`, `template-website-repository.ts`, `src/app/(admin)/super-admin/template/*`, `form-template.tsx`, `pengaturan-desa-client.tsx`, dan route/shell publik.

1. Tambahkan Esensi/Natra ke registry statis; jangan menerima slug paket bebas.
2. Ubah UI Super Admin menjadi katalog/publikasi paket registry, bukan pembuatan source atau unggah ZIP.
3. Pertahankan alur tenant memilih/menerapkan tema dan semua opsi/data publik.
4. Migrasikan `samudra-modern` dan tenant legacy; jangan fallback klasik diam-diam.

**Test:** `template-website.test.ts`, `template-website-use-cases.test.ts`, `public-site-layout.test.ts`, `public-shell.test.ts`, `gallery-shell.test.ts`, registry test, dan route-coverage test.

**Selesai bila:** hanya versi registry dapat diterbitkan; semua 35 route situs publik memakai renderer; Admin Desa hanya menerapkan tema terbit; opsi/slug lama dimigrasikan atau tetap tersedia.

### Tahap 3: Tambahkan UI manual backup/restore

**API/use case:** `src/app/api/database/backup/route.ts`, `src/app/api/database/restore/route.ts`, `src/features/pengaturan/database/application/database-use-cases.ts`, `src/features/pengaturan/database/domain/database.ts`.

**Berkas baru:** `src/app/(admin)/super-admin/backup/page.tsx`, komponen UI, dan page test. Jangan membuat mekanisme dump kedua.

1. Sediakan unduh SQL/SQL.GZ dan restore satu file.
2. Jelaskan bahwa restore mengganti seluruh database dan memengaruhi semua desa; minta konfirmasi eksplisit.
3. Pertahankan guard Super Admin, batas 200 MB, Content-Length, format yang diizinkan, konfirmasi server, verifikasi pascarestore, dan audit event.
4. Jangan menambah jadwal/retensi/job history sampai scheduler dan kebijakan operasional disetujui.

**Test:** `src/app/api/database/backup/route.test.ts`, `restore/route.test.ts`, dan `database-use-cases.test.ts`; tambah test UI untuk izin, konfirmasi, pending, error, dan sukses.

**Selesai bila:** hanya Super Admin dapat menjalankan operasi; restore tanpa konfirmasi, format/ukuran valid ditolak; audit tercatat; UI menjelaskan dampak global.

### Tahap 4: Gate operasi lintas tenant tambahan

1. **Provider/API key/plugin:** tentukan sumber status, kepemilikan secret, read/write scope, izin, dan audit sebelum membangun konsol. Rilis awal boleh read-only.
2. **Monitoring/kapasitas:** tetapkan metrik, definisi, interval, sumber data, dan owner. Jangan menampilkan angka tanpa sumber uji.
3. **RBAC multi-role:** tetap di luar scope sampai daftar role, permission, bootstrap, migrasi, dan recovery disetujui.
4. **Billing, support/ticketing, analitik, backup terjadwal:** buat spec terpisah setelah model bisnis/operasional disetujui.

**Selesai bila:** setiap fitur deferred memiliki keputusan owner/scope atau tetap dicatat di luar rilis.

## 7. Kriteria penerimaan implementasi

1. Navigasi Tenant/Domain, breadcrumb, route aktif, dan redirect lama lulus test.
2. Page, Server Action, API, dan use case sensitif membatasi akses ke Super Admin serta mencatat akses lintas tenant sensitif.
3. Katalog template hanya menerbitkan versi registry; Admin Desa hanya memilih tema terbit.
4. Tema Esensi/Natra merender semua route publik dan opsi yang dipetakan OpenSID; test mencakup default lama, opsi invalid, data kosong, error, alias, dan tenant legacy.
5. Backup/restore UI memakai API yang ada, menjelaskan cakupan database, meminta konfirmasi, dan menampilkan hasil/audit.
6. Billing, support, analitik, multi-role, monitoring baru, dan scheduler tidak menjadi syarat rilis awal tanpa persetujuan.
7. Setelah perubahan, jalankan `npm run typecheck`, ESLint terarah, Prettier file berubah, test terkait, `npm run build`, dan smoke test browser desktop/mobile.

## 8. Sumber dan test terkait

1. [Super Admin routes](<../src/app/(admin)/super-admin/>), [guard](<../src/app/(admin)/super-admin/guard.ts>), [platform navigation](../src/features/navigation/domain/menu-platform.ts), [header/breadcrumb](../src/features/navigation/domain/header-platform.ts).
2. [Multi-desa](../src/features/multi-desa/), [subscription plans](../src/db/schema/subscription-plans.ts), [website templates](../src/db/schema/website-templates.ts), [theme schema](../src/db/schema/theme.ts).
3. [API key schema](../src/db/schema/api-keys.ts), [plugin registry schema](../src/db/schema/plugin-registry.ts).
4. [Backup API](../src/app/api/database/backup/route.ts), [restore API](../src/app/api/database/restore/route.ts), [database use cases](../src/features/pengaturan/database/application/database-use-cases.ts), [database domain](../src/features/pengaturan/database/domain/database.ts).
5. [Template implementation plan](Dokumentasi-Implementasi-Template-ala-OpenSID.md), [functional blueprint](Blueprint_Fungsional_AppDes.md).
6. Test awal: `menu-platform.test.ts`, `header-platform.test.ts`, Super Admin page tests, template domain/use-case tests, backup/restore route/use-case tests.

## 9. Batasan dan tindak lanjut

Dokumen ini menjadi roadmap untuk navigasi, akses, tema berkode, dan UI manual backup/restore. Ia bukan bukti bahwa browser, database produksi, atau operasi restore sudah diverifikasi.

Jadwal backup, provider console yang mengubah secret, RBAC multi-role, billing, support/ticketing, dan analitik memerlukan keputusan produk serta spec tersendiri. Menu target pada bagian 5 tidak otomatis menyetujui semua fitur untuk dibangun.

## 10. Status pelaksanaan (27 November 2026)

Tahap 1 (navigasi) dan Tahap 3 (UI backup manual) ada pada source. Tahap 2 (tema berkode) masih parsial; Tahap 4 tetap gerbang keputusan.

### 10.1 Tahap 0 — baseline dan scope

| Item | Status | Bukti |
|---|---|---|
| Dashboard, tenant, domain, paket | ada, dipertahankan | `src/app/(admin)/super-admin/{page.tsx,tenant,domain,paket}`, `features/multi-desa/application/*` |
| Tema berbasis registry | Registry/page map dan route-adapter test ada; rendering paket per halaman belum lengkap | Lengkapi komposisi page paket, semantik opsi, dan rendering seluruh route sebelum rilis |
| Pengguna platform + audit | ada, dipertahankan; satu role `super-admin` | `src/app/(admin)/super-admin/{pengguna,audit}`, `features/pengaturan/audit` |
| Navigasi Tenant/Domain | perlu perubahan → selesai | Tahap 1 di bawah |
| UI backup/restore | baru → selesai | Tahap 3 di bawah |
| API key/plugin/notifikasi pusat, monitoring, billing, ticketing, analitik, scheduler, RBAC multi-role | deferred | Bagian 10.4 |

### 10.2 Tahap 1 — navigasi dan akses

- Menu platform kini memisahkan **Tenant** (`/super-admin/tenant`) dan **Domain & infrastruktur** (`/super-admin/domain`), masing-masing dengan grup sidebar, eyebrow, judul, dan remah sendiri (`menu-platform.ts`, `header-platform.ts`).
- Halaman daftar domain tidak lagi memakai judul paksa "Tenant"; wizard tambah tenant membatalkan ke `/super-admin/tenant`.
- Rute lama tetap hidup: `/super-admin/domain/tambah` masih mengalihkan ke `/super-admin/tenant/tambah`, dan detail domain tetap berada di bawah menu Domain.
- Audit guard: seluruh 18 `page.tsx` di `src/app/(admin)/super-admin/` memanggil `pastikanSuperAdmin`; seluruh Server Action di `super-admin/{actions,paket/actions,pengguna/actions,template/actions}.ts` hanya memanggil use case yang memanggil `requireSuperAdmin`; API `database/backup` dan `database/restore` juga memanggilnya di server.
Test `menu-platform.test.ts`, `header-platform.test.ts`, dan test halaman Super Admin sebelumnya tercatat lulus (99 test); test tersebut tidak dijalankan ulang pada verifikasi tema ini.

### 10.3 Tahap 2 dan Tahap 3 (backup manual)

Tema berkode:

- Registry statis hanya memuat `esensi@1.0.0` dan `natra@1.0.0`; `buatTemplateWebsiteBaru` menolak slug di luar registry, dan penerapan/distribusi hanya untuk template berstatus `published`.
- Alias `samudra-modern@1.0.0` → `natra@1.0.0` menjaga tenant legacy; tidak ada fallback klasik diam-diam.
- `ThemeDefinition` memiliki `pages` dan `widgets`, tetapi fungsi page saat ini hanya membungkus `children`; fungsi terdaftar tidak membuktikan komposisi halaman bertema yang berbeda.
- `TemaRenderer` menerima `surface` dan merender `pages[surface]` di dalam layout paket; beranda memakai `beranda`, `PublicShell` memakai `layanan`, `GalleryShell` memakai `media`.
- Cakupan route: peta mencatat 35 route (1 renderer langsung, 6 shell, 25 header bersama, 3 alias). Hanya 7 route instance memakai `TemaRenderer`; test memeriksa impor/adapter, bukan output render atau layout paket pada setiap route.
- `muatTemaPublik` dibungkus `cache()` React sehingga tema dibaca satu kali per render route meski header, footer, renderer, dan halaman memintanya.
- Opsi punya consumer runtime: `warna_dasar` mengubah `--public-primary` pada `PublicSiteHeader`, `PublicShell`, dan `GalleryShell`; `pintasan_masuk` menyembunyikan tautan masuk di ketiganya; `jam`/`statistik_desa` dirender sesuai nilainya di layout Natra; fallback foto dipakai galeri/pembangunan; page-size membatasi daftar dengan navigasi `?page=` (bukan potongan tanpa jalan ke sisa data).
- Opsi tema dapat diubah Admin Desa lewat tab Tampilan Website → **Opsi Tema**: field dirender dari `config.json` paket dan disimpan ke `theme.opsi.templateOptions`. Aset unggah dibatasi MIME/ukuran dan disimpan dengan path tenant. Path aset dari database maupun kiriman klien divalidasi ke ruang `<villageId>/`: simpan opsi menolak path tenant lain, dan ganti/hapus aset mengabaikan path di luar tenant (`pengaturan-desa-opsi-tema.test.ts`).
- Migrasi opsi (`src/themes/migrasi.ts`) dipakai saat menyimpan opsi, menerapkan template, dan mendistribusikan versi. Alur Super Admin ganti/distribusi mempertahankan key lama di luar schema tujuan (`{ ...lama, ...migrasi.opsi }`) dan mencatat jumlah key tak terpetakan pada audit; nilai tidak hilang diam-diam.
- Sisa tema: komposisi halaman paket yang berbeda per surface (saat ini page renderer membungkus `children`; layout paket yang memberi variasi), uji browser, uji tulis/rollback opsi. Dry-run database dev mencatat 2 tenant aktif `esensi@1.0.0` tanpa penulisan; kebijakan token katalog sudah default katalog + override tenant.

Backup/restore:

- Halaman baru `/super-admin/backup` (`page.tsx`) memakai API yang sudah ada: unduh `SQL`/`SQL.GZ` lewat `/api/database/backup`, pulihkan lewat `/api/database/restore`.
- Halaman menjelaskan bahwa restore mengganti seluruh basis data dan memengaruhi semua desa, mewajibkan centang konfirmasi sebelum unggah, dan menyebut batas 200 MB serta format `.sql`/`.sql.gz`.
- Guard, batas ukuran, `Content-Length`, verifikasi pascarestore, dan audit event tetap di server; redirect sukses kini kembali ke `/super-admin/backup?restored=1`.
- Test: `backup/page.test.ts` (izin, tautan unduh, konfirmasi, banner sukses), `backup/route.test.ts`, `restore/route.test.ts`, `database-use-cases.test.ts`.
- Penjadwalan, retensi berkas, dan riwayat job tetap ditunda.

### 10.4 Tahap 4 — gerbang keputusan

| Fitur | Status | Syarat sebelum coding |
|---|---|---|
| Provider/API key/plugin lintas tenant | deferred; rilis awal boleh read-only | sumber status, kepemilikan secret, scope read/write, izin, audit |
| Monitoring/kapasitas | deferred | metrik, definisi, interval, sumber data, owner |
| RBAC multi-role platform | deferred | daftar role, permission, bootstrap, migrasi, recovery |
| Billing, support/ticketing, analitik, backup terjadwal | deferred | spec produk/operasional dan acceptance criteria |

### 10.5 Verifikasi yang dijalankan

Verifikasi dijalankan pada 27 November 2026:

- `npm run check` lulus penuh: typecheck, ESLint, Prettier, dan 307 file test / 2.507 test.
- `NODE_ENV=production npm run build`: exit 0, 250/250 halaman diprerender; build dipanggil dengan `NODE_ENV=production` karena `.env` lokal menetapkan `development`.
- `ui-guard` lulus; halaman backup memakai `Button`/komponen bersama, tanpa tombol mentah.
- Prettier bersih pada seluruh proyek; script `scripts/platform/tambah-template-samudra.mjs` kini terformat.
- `npm ci` di server melaporkan 13 advisori dependensi tingkat sedang; belum ditriase.
- Browser desktop memverifikasi landing platform, login Super Admin, dan konsol tenant melalui SSH tunnel. Public DNS `flexides.id` belum resolve; mobile/accessibility, restore data nyata, dan deployment smoke publik belum dijalankan.
- Tidak ditemukan workflow deploy/runbook di repo. Aplikasi berjalan dengan proxy staging loopback; DNS A/wildcard dan TLS tepercaya masih perlu disiapkan sebelum akses publik.
