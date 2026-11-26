# Audit Super Admin FlexiDesa

> **Status:** Audit statis source code  
> **Repository:** `fahmiorim/flexidesa`  
> **Branch yang diperiksa:** `main`  
> **Tanggal audit:** 26 November 2026  
> **Tujuan:** Memastikan inventaris fitur Super Admin, membedakan fitur yang sudah ada dan yang belum lengkap, serta menetapkan struktur menu target tanpa menduplikasi fitur Admin Desa.

---

## 1. Ringkasan eksekutif

FlexiDesa sudah memiliki fondasi konsol Super Admin yang cukup luas: dashboard platform, pengelolaan tenant, domain, paket dan versi fitur, template website, pengguna platform, audit trail, serta pengaturan platform.

Karena itu, pekerjaan berikutnya **bukan membangun ulang konsol Super Admin dari nol**. Fokusnya adalah:

1. Merapikan navigasi dan pemisahan tanggung jawab menu.
2. Menuntaskan integrasi template dengan website publik.
3. Memperkuat tata kelola role dan hak akses platform.
4. Menambahkan kemampuan operasional lintas tenant yang belum terbukti tersedia sebagai konsol terpusat.
5. Menambahkan billing hanya jika model bisnis FlexiDesa memang memerlukan penagihan berbayar.

### Kesimpulan audit

- **Sudah ada:** tenant, domain, paket/fitur, template, pengguna platform, audit trail, konfigurasi platform.
- **Ada di sisi aplikasi/tenant tetapi belum ditemukan sebagai konsol platform terpusat:** API key, plugin, notifikasi/provider, backup dan restore.
- **Perlu diverifikasi/dituntaskan:** pemakaian token template pada website publik.
- **Belum ditemukan pada inventaris source yang diperiksa:** billing SaaS lengkap, role platform yang dapat dikelola, support/ticketing platform, analitik lintas tenant, dashboard operasional terpusat.

> "Belum ditemukan" berarti tidak ditemukan pada route, schema, dan source yang diperiksa dalam audit ini. Itu bukan bukti mutlak bahwa tidak ada implementasi di seluruh sistem atau layanan eksternal.

---

## 2. Ruang lingkup dan metode

Pemeriksaan dilakukan secara statis terhadap branch `main`, dengan meninjau:

- Route dan halaman di `src/app/(admin)/super-admin/`.
- Navigasi platform di `src/features/navigation/domain/menu-platform.ts`.
- Komponen sidebar administrasi.
- Use case, domain, dan repository pada `src/features/multi-desa/`.
- Schema database di `src/db/schema/`.
- Sebagian route dan infrastruktur terkait API, plugin, notifikasi, backup, dan restore.
- Blueprint fungsional pada `docs/Blueprint_Fungsional_AppDes.md`.

Audit ini **tidak** menjalankan aplikasi, browser, seluruh server action, migrasi database, atau pengujian operasional. Status "ada" berarti implementasi ditemukan pada source; bukan jaminan semua alur runtime sudah lolos uji.

---

## 3. Inventaris Super Admin yang sudah ditemukan

| Area | Route / sumber utama | Temuan |
|---|---|---|
| Dashboard platform | `/super-admin` | Halaman dashboard Super Admin tersedia. |
| Tenant | `/super-admin/tenant`, `/super-admin/tenant/tambah` | Daftar dan provisioning tenant tersedia. |
| Domain | `/super-admin/domain`, `/super-admin/domain/tambah`, `/super-admin/domain/[domainId]` | Pengelolaan domain, detail domain, DNS dan SSL tersedia. |
| Paket | `/super-admin/paket`, `/super-admin/paket/baru`, `/super-admin/paket/[paketId]` | Katalog paket, metadata, versi, fitur dan publikasi tersedia. |
| Penetapan paket | `/super-admin/paket/tenant` | Penetapan versi paket ke tenant tersedia. |
| Template | `/super-admin/template`, `/super-admin/template/baru`, `/super-admin/template/[templateId]` | Katalog, metadata, status, token, dan riwayat versi tersedia. |
| Penggunaan template | `/super-admin/template/penggunaan` | Daftar tenant yang memakai template tersedia. |
| Fondasi tenant | `/super-admin/template/fondasi` | Pengelolaan template fondasi tenant tersedia. |
| Pengguna platform | `/super-admin/pengguna` | Pengelolaan akun pengguna platform tersedia. |
| Audit trail | `/super-admin/audit`, `/super-admin/audit/ekspor` | Daftar dan ekspor audit platform tersedia. |
| Pengaturan platform | `/super-admin/pengaturan` | Informasi konfigurasi dan kebijakan tertentu tersedia; sebagian besar bersifat baca-saja. |

### 3.1 Manajemen tenant

Use case dan repository multi-desa menunjukkan dukungan untuk beberapa operasi berikut:

- Provisioning tenant/desa.
- Mengaktifkan dan menonaktifkan tenant.
- Melihat dan mengelola domain tenant.
- Mengelola kuota media.
- Reset akses admin tenant.
- Ekspor data tenant.
- Retensi dan lifecycle data tenant, termasuk proses purge.

**Catatan:** keberadaan use case tidak otomatis membuktikan seluruh operasi memiliki halaman UI yang lengkap. Setiap operasi tetap perlu dicocokkan dengan action dan tampilan terkait saat audit implementasi terperinci.

### 3.2 Domain dan DNS/SSL

Fitur yang ditemukan:

- Domain utama dan alias.
- Detail domain dan tenant pemiliknya.
- Pemeriksaan DNS.
- Pemeriksaan sertifikat SSL/TLS.
- Penyimpanan hasil pemeriksaan sebagai cache.
- Pemeriksaan satu domain maupun pemeriksaan massal dengan batas konkurensi.
- Riwayat/status pemeriksaan yang ditampilkan pada halaman terkait.

Pemeriksaan dilakukan hanya terhadap domain yang sudah terdaftar, bukan host bebas dari input pengguna.

### 3.3 Paket dan fitur tenant

Schema dan repository mencakup:

- Identitas paket.
- Versi paket.
- Status draft, published, archived pada versi.
- Daftar slug modul/fitur per versi.
- Penetapan versi paket ke tenant.
- Hitungan tenant per versi paket.
- Preview dan rollout versi paket.

Dengan demikian, fitur "Paket & fitur" bukan sekadar katalog statis. Sudah ada mekanisme versi dan distribusi fitur.

**Batasan penting:** struktur yang diperiksa lebih menggambarkan entitlement/modul paket. Belum ditemukan model billing lengkap seperti harga, periode tagihan, invoice, transaksi pembayaran, jatuh tempo, dan perpanjangan otomatis.

### 3.4 Template website

Fitur yang ditemukan:

- Katalog template.
- Kategori dan tag.
- Metadata dan deskripsi.
- Token warna, font heading, radius, dan gaya.
- Status draft, published, archived.
- Snapshot/riwayat versi dan changelog.
- Daftar tenant yang menggunakan template.
- Distribusi pembaruan template.
- Template fondasi untuk provisioning tenant baru.

**Gap integrasi yang perlu dituntaskan:** halaman detail template menyatakan bahwa preview token belum otomatis digunakan oleh website publik. Schema `theme` juga menjelaskan bahwa tema publik memiliki mekanisme tersendiri dan dikompilasi dari `src/themes/<slug>`. Karena itu, integrasi token katalog dengan rendering website publik harus diverifikasi dan diselesaikan secara eksplisit.

Jangan membuat katalog template kedua. Yang dibutuhkan adalah menuntaskan alur penerapan template yang sudah ada.

### 3.5 Pengguna dan hak akses platform

Pengelolaan pengguna platform sudah ditemukan, termasuk operasi akun seperti aktivasi/nonaktif, reset akses, dan pencabutan sesi.

Namun, role platform saat ini berpusat pada role `super-admin` dan belum ditemukan halaman khusus untuk mengelola role serta permission platform.

RBAC tenant yang sudah ada tidak boleh dianggap otomatis sama dengan RBAC platform. Keduanya memiliki cakupan dan batas keamanan berbeda.

### 3.6 Audit dan pengaturan

Audit trail platform dan ekspor audit sudah ditemukan.

Halaman pengaturan menampilkan konfigurasi deployment seperti URL aplikasi, domain dasar desa, pengaturan proxy, status konfigurasi email, konfigurasi TTE, dan nilai retensi. Nilai environment/deployment tertentu bersifat baca-saja dan perubahan memerlukan pengaturan deployment serta restart.

---

## 4. Koreksi atas temuan audit awal

Beberapa kesimpulan awal perlu diperjelas agar tidak menyesatkan:

### 4.1 Navigasi Tenant bukan tautan rusak

Pada `menu-platform.ts`, menu berlabel **Tenant** menggunakan `/super-admin/domain` sebagai href utama dan memasukkan `/super-admin/tenant` sebagai rute tambahan. Jadi rute tenant tidak hilang, tetapi label dan tujuan menu induknya membingungkan.

**Rekomendasi:** pisahkan menjadi menu **Manajemen Tenant** dan **Domain & Infrastruktur**.

### 4.2 Integrasi sudah ada pada level tenant/aplikasi

Ditemukan schema dan implementasi terkait API key, plugin, notifikasi, email, WhatsApp, serta TTE. Maka tidak tepat menyatakan "integrasi belum ada".

**Yang belum ditemukan:** konsol Super Admin yang mengelola konfigurasi dan kesehatan provider secara lintas tenant.

### 4.3 Backup dan restore sudah memiliki implementasi

Ditemukan route API database backup/restore dan infrastruktur terkait. Maka tidak tepat menyatakan mekanisme backup/restore belum ada.

**Yang belum terbukti:** dashboard Super Admin untuk jadwal, status, riwayat, retensi, dan pemulihan backup lintas tenant.

### 4.4 Paket saat ini belum sama dengan billing SaaS

Paket, versi, fitur dan penetapan tenant sudah ada. Namun, jangan menyebutnya sistem penagihan penuh tanpa menemukan harga, invoice, pembayaran, periode dan status tagihan.

### 4.5 Template sudah punya katalog dan distribusi

Yang perlu dituntaskan adalah integrasi penerapan template dengan rendering publik, bukan membuat ulang katalog atau distribusi template.

---

## 5. Struktur menu Super Admin yang direkomendasikan

Struktur berikut adalah **target navigasi produk**, bukan klaim bahwa semua submenu sudah tersedia. Status setiap submenu dijelaskan pada bagian 6.

1. **Dashboard**
   - Ringkasan tenant.
   - Ringkasan domain dan SSL.
   - Ringkasan paket dan template.
   - Aktivitas platform terbaru.
   - Peringatan operasional.

2. **Manajemen Tenant**
   - Daftar tenant.
   - Tambah/provision tenant.
   - Detail tenant.
   - Status aktif/nonaktif.
   - Kuota dan penggunaan.
   - Reset akses admin.
   - Ekspor data.
   - Retensi dan lifecycle/purge.

3. **Domain & Infrastruktur**
   - Daftar domain.
   - Tambah domain.
   - Domain utama dan alias.
   - Pemeriksaan DNS.
   - Status SSL/TLS.
   - Riwayat pemeriksaan.
   - Ringkasan status infrastruktur tenant.

4. **Paket & Langganan**
   - Katalog paket.
   - Katalog modul/fitur.
   - Versi paket.
   - Penetapan paket tenant.
   - Riwayat perubahan paket.
   - Billing, invoice dan pembayaran (opsional, sesuai model bisnis).

5. **Website & Template**
   - Katalog template.
   - Tambah/edit template.
   - Preview.
   - Riwayat versi dan changelog.
   - Penggunaan template.
   - Distribusi pembaruan.
   - Fondasi tenant baru.

6. **Pengguna & Hak Akses**
   - Pengguna platform.
   - Role platform.
   - Permission platform.
   - Sesi dan perangkat.
   - Riwayat akses.

7. **Integrasi Platform**
   - Email transaksional.
   - WhatsApp/provider notifikasi.
   - TTE.
   - API platform.
   - Plugin/integrasi.
   - Status koneksi provider.

8. **Operasional & Pemeliharaan**
   - Status aplikasi.
   - Status database.
   - Backup dan restore.
   - Jadwal backup.
   - Riwayat pekerjaan terjadwal.
   - Penggunaan penyimpanan.

9. **Keamanan & Audit**
   - Audit trail.
   - Aktivitas pengguna.
   - Login dan sesi.
   - Aktivitas mencurigakan.
   - Kebijakan retensi.

10. **Support & Bantuan**
    - Tiket bantuan tenant.
    - Keluhan tenant.
    - Riwayat penanganan.
    - Dokumentasi dan pengumuman.

11. **Laporan & Analitik**
    - Pertumbuhan tenant.
    - Aktivitas penggunaan.
    - Statistik pemakaian modul.
    - Penggunaan kapasitas.
    - Laporan operasional.

12. **Pengaturan Platform**
    - Identitas platform.
    - Konfigurasi umum.
    - Kebijakan sistem.
    - Retensi data.
    - Konfigurasi layanan.

### Prinsip pemisahan Super Admin dan Admin Desa

Super Admin mengelola **platform dan tenant secara keseluruhan**. Admin Desa mengelola **operasional dan data milik desanya sendiri**.

Jangan menyalin menu operasional desa ke Super Admin. Contoh:

- Data penduduk, surat, keuangan desa, perangkat desa, dan inventaris tetap dikelola Admin Desa.
- Super Admin cukup mengelola tenant, akses platform, paket, status layanan, kapasitas, dan dukungan lintas tenant.
- Jika Super Admin perlu melihat data tenant untuk dukungan, akses tersebut harus memiliki kontrol otorisasi, pencatatan audit, dan alasan akses.

---

## 6. Matriks status dan rekomendasi pekerjaan

Status:
- **Ada:** implementasi ditemukan pada source.
- **Perlu verifikasi:** ada fondasi atau petunjuk implementasi, tetapi alur lengkap/runtime belum dibuktikan.
- **Belum ditemukan:** belum ditemukan pada cakupan source yang diperiksa.
- **Opsional:** dibutuhkan hanya jika model operasional/bisnis mengharuskannya.

| Area | Status audit | Tindakan |
|---|---|---|
| Dashboard Super Admin | Ada | Tingkatkan ringkasan dan indikator operasional lintas tenant. |
| Provisioning dan manajemen tenant | Ada | Audit kelengkapan action, validasi, dan lifecycle end-to-end. |
| Domain utama/alias | Ada | Pertahankan; rapikan navigasi terpisah dari Tenant. |
| Pemeriksaan DNS/SSL | Ada | Tambahkan ringkasan operasional dan kebijakan pemeriksaan terjadwal bila diperlukan. |
| Katalog paket dan versi | Ada | Jangan bangun ulang; audit detail rollout dan histori. |
| Penetapan paket tenant | Ada | Audit perubahan paket, tenant legacy, dan rekonsiliasi entitlement. |
| Billing/invoice/pembayaran | Belum ditemukan | Bangun hanya jika penagihan berbayar menjadi kebutuhan produk. |
| Katalog template dan distribusi | Ada | Pertahankan; jangan membuat katalog duplikat. |
| Penerapan token template ke situs publik | Perlu verifikasi | Selesaikan integrasi token, preview, penerapan, fallback dan kompatibilitas versi. |
| Pengguna platform | Ada | Pertahankan; audit alur reset, deaktivasi, dan pencabutan sesi. |
| Role/permission platform | Belum ditemukan sebagai UI pengelolaan | Rancang RBAC platform terpisah dari RBAC tenant jika diperlukan multi-role. |
| Audit trail platform | Ada | Audit kelengkapan event sensitif, filter, ekspor dan retensi. |
| Pengaturan platform | Ada, terbatas | Bedakan konfigurasi runtime read-only dan pengaturan yang aman diubah melalui UI. |
| API key, plugin dan notifikasi | Ada pada level aplikasi/tenant | Evaluasi konsol pengelolaan provider lintas tenant. |
| Backup dan restore | Ada pada level API/infrastruktur | Evaluasi dashboard backup terpusat dan prosedur pemulihan tenant. |
| Monitoring platform | Belum ditemukan sebagai konsol terpusat | Tambahkan health/status aplikasi, database, antrean dan kapasitas sesuai arsitektur. |
| Support/ticketing | Belum ditemukan | Bangun jika dukungan tenant akan dikelola melalui platform. |
| Analitik lintas tenant | Belum ditemukan sebagai modul platform | Tambahkan metrik agregat dengan batas privasi dan isolasi data. |

---

## 7. Prioritas implementasi

Prioritas di bawah merupakan rekomendasi produk dan operasional. Prioritas tidak berarti semua item yang belum ada adalah bug.

### P0 — Fondasi dan risiko utama

1. Pisahkan menu Manajemen Tenant dan Domain & Infrastruktur.
2. Pastikan guard dan otorisasi semua route/action Super Admin konsisten.
3. Tetapkan model role dan permission platform yang aman jika platform akan memiliki lebih dari satu operator dengan kewenangan berbeda.
4. Tuntaskan integrasi template dengan rendering website publik.
5. Pastikan akses lintas tenant selalu tercatat dan dapat diaudit.

### P1 — Operasional platform

1. Dashboard monitoring lintas tenant.
2. Konsol backup/restore terpusat di atas mekanisme yang sudah ada.
3. Konsol status integrasi/provider (email, WhatsApp, TTE, API).
4. Laporan kapasitas dan penggunaan tenant.
5. Support dan pengumuman platform jika proses layanan pelanggan membutuhkannya.

### P2 — Pengembangan bisnis dan analitik

1. Billing, invoice dan pembayaran SaaS jika diperlukan.
2. Analitik pertumbuhan dan retensi tenant.
3. Otomasi perpanjangan, pengingat tagihan, dan kebijakan suspend berbasis status pembayaran jika model bisnis menggunakannya.

---

## 8. Kriteria penerimaan audit lanjutan

Sebuah submenu baru boleh dinyatakan **selesai** setelah bukti berikut tersedia sesuai jenis fiturnya:

- Route/page tersedia dan dapat diakses oleh role yang benar.
- Server action/API memiliki validasi input dan otorisasi di sisi server.
- Use case menjalankan aturan bisnis yang tepat.
- Repository membaca/menulis entitas yang benar.
- Schema dan migrasi mendukung data yang diperlukan.
- Operasi create/read/update/delete yang memang diperlukan berjalan; tidak memaksakan CRUD untuk data yang bersifat turunan atau read-only.
- Isolasi tenant tidak dapat dilewati dengan manipulasi ID.
- Operasi sensitif menghasilkan audit event.
- Kondisi kosong, gagal, konflik, dan data tidak valid ditangani.
- Integrasi dengan website publik atau layanan terkait terbukti berjalan bila memang menjadi bagian fitur.
- Pengujian yang relevan tersedia dan lulus.

Untuk fitur yang melibatkan infrastruktur, tambahkan bukti operasional seperti status backup yang benar, verifikasi restore, pemeriksaan DNS/SSL, atau health check provider.

---

## 9. File sumber utama yang menjadi acuan

- [Super Admin routes](../src/app/(admin)/super-admin/)
- [Platform navigation](../src/features/navigation/domain/menu-platform.ts)
- [Admin sidebar](../src/components/shell/admin-sidebar.tsx)
- [Multi-desa features](../src/features/multi-desa/)
- [Subscription plan schema](../src/db/schema/subscription-plans.ts)
- [Website template schema](../src/db/schema/website-templates.ts)
- [Theme schema](../src/db/schema/theme.ts)
- [API key schema](../src/db/schema/api-keys.ts)
- [Plugin registry schema](../src/db/schema/plugin-registry.ts)
- [Database backup implementation](../src/features/database/infrastructure/backup.ts)
- [Database restore implementation](../src/features/database/infrastructure/restore.ts)
- [Functional blueprint](./Blueprint_Fungsional_AppDes.md)

---

## 10. Batasan dan tindak lanjut

Dokumen ini adalah baseline audit statis, bukan sertifikasi bahwa seluruh fitur telah lolos uji. Audit berikutnya sebaiknya dilakukan per submenu dengan matriks:

`Menu → Route → Page → Action/API → Use case → Repository → Schema/Migration → CRUD → Integrasi → Test → Status`

Hasil audit lanjutan perlu mencatat bukti file/route dan status implementasi per fitur, bukan hanya status per kelompok menu.

**Keputusan utama:** pertahankan seluruh fondasi Super Admin yang sudah ada, rapikan struktur navigasi, tuntaskan gap integrasi dan kontrol operasional, lalu bangun hanya fitur yang benar-benar belum tersedia.
