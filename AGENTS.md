# Panduan Agent Appdes

## Tujuan

Saat diminta menyamakan menu dengan OpenSID, **field dan cakupan datanya harus setara dengan menu OpenSID yang menjadi acuan**, sedangkan UI Appdes dibuat lebih modern, rapi, dan responsif. Gunakan pola kerja Identitas Desa sebagai acuan integrasi lintas lapisan: UI → API → use case/domain → repository/database → penggunaan data. Jangan menyalin tampilan OpenSID mentah-mentah, tetapi jangan menghilangkan atau mengganti field OpenSID tanpa alasan dan persetujuan yang jelas. Struktur tab boleh berbeda jika membuat UI lebih mudah digunakan, asalkan seluruh field dan fungsi tetap terjangkau. Pertahankan tujuan, istilah, izin, dan alur khusus menu yang dikerjakan.

## Sumber pembanding OpenSID

Sumber OpenSID lokal untuk membandingkan field berada di `D:\laragon\www\opensid`. Gunakan implementasi form di bawah sebagai rujukan utama Identitas Desa (baca versi yang tersedia di direktori tersebut saat mengerjakan; jangan menganggap versi/field lama selalu sama):

- Form Identitas Desa: `resources/views/admin/identitas_desa/form.blade.php`
- Tab profil: `resources/views/admin/identitas_desa/tab-profil.blade.php`
- Halaman/tombol pendukung: `resources/views/admin/identitas_desa/index.blade.php`

Direktori ini hanya sumber pembanding. Perubahan yang diminta untuk Appdes diterapkan di repositori Appdes, bukan dengan mengedit OpenSID.

## Contoh: Identitas Desa

Implementasi acuan berada di:

- UI: `src/features/pengaturan/presentation/pengaturan-desa-client.tsx` dan `src/features/pengaturan/presentation/identitas-desa-view.tsx`
- API: `src/app/api/identitas-desa/route.ts` dan `src/app/api/identitas-desa/media/route.ts`
- Use case/domain: `src/features/identitas-desa/application/identitas-desa-use-cases.ts` dan `src/features/identitas-desa/domain/identitas-desa.ts`
- Repository: `src/features/identitas-desa/infrastructure/identitas-desa-repository.ts`
- Sinkronisasi perangkat/jabatan: `src/features/pemerintahan/application/use-cases.ts`

Karakteristik yang relevan sebagai pola:

1. UI memisahkan kelompok informasi agar form mudah dipindai; Identitas Desa memakai tab Identitas, Kantor, Wilayah, Profil, Lingkungan, dan Adat. Susunan ini contoh presentasi, bukan batas field yang harus ditiru menu lain.
2. Jika OpenSID menjadi acuan, inventarisasikan field dan perilaku form OpenSID terlebih dahulu. Pertahankan kesetaraan nama/arti field, tipe input, opsi pilihan, validasi, serta kemampuan unggah/aksi yang relevan. Buat matriks pemetaan OpenSID → Appdes; setiap field harus punya padanan, atau ditandai jelas bila memang sengaja tidak diterapkan beserta alasannya.
3. Setelah paritas field dipastikan, rancang UI Appdes yang lebih menarik dan mudah dipakai: pengelompokan yang jelas, hirarki visual, responsivitas, dan pola navigasi yang sesuai. Kesetaraan field tidak mengharuskan kesamaan layout mentah.
4. Komponen UI membaca serta menyimpan lewat endpoint eksplisit, menampilkan status berhasil/gagal, dan memuat ulang nilai tersimpan setelah mutasi.
5. API menentukan tenant dari sesi/server, memeriksa permission, membatasi payload, memvalidasi input di domain/use case, dan mengirim respons tanpa cache untuk data privat.
6. Use case mengoordinasikan validasi dan repository; repository menjadi batas akses Drizzle/database.
7. Data kepala desa mengikuti perangkat aktif sebagai sumber kebenaran. Nilai `villages.headName/headNip` adalah cache kompatibilitas yang disinkronkan setelah perubahan perangkat/jabatan.
8. Upload media dibatasi berdasarkan jenis dan ukuran, disimpan dalam ruang tenant, referensinya diperbarui, lalu berkas lama dibersihkan ketika diganti/dihapus.
9. Data yang dipakai beberapa halaman perlu diperiksa konsistensinya. Contoh: alamat/koordinat kantor diselaraskan dengan pengaturan kontak publik.
10. Skema database/migrasi Drizzle adalah sumber kebenaran untuk struktur data. Jangan menyimpulkan database sudah berubah hanya karena UI atau schema validasi berubah.

Enam tab adalah keputusan khusus Identitas Desa, bukan standar wajib untuk semua menu.

## Checklist saat menyamakan menu lain

Sebelum mengubah kode:

- Temukan route/page, komponen UI, API, use case/domain, repository, schema Drizzle/migrasi, permission, serta pemakai data menu tersebut.
- Jika acuannya OpenSID, periksa implementasi OpenSID yang relevan (versi/sumber yang tersedia) dan catat semua field, opsi, validasi, upload, serta aksi form. Jangan mengandalkan ingatan atau hanya membandingkan screenshot.
- Buat pemetaan field OpenSID ke UI, kontrak API, validasi/backend, dan penyimpanan Appdes. Tandai kekurangan paritas sebelum implementasi; jangan menyatakan menu sudah disamakan jika ada field yang belum dipetakan.
- Tetapkan masalah yang diminta dan ruang lingkupnya. Bedakan perbaikan UI, perubahan kontrak API, perubahan aturan bisnis, dan perubahan skema.
- Ikuti konvensi dan komponen yang sudah ada di area terkait. Jangan membuat lapisan atau abstraksi baru jika pola yang ada mencukupi.
- Pastikan field yang sudah digunakan tidak hilang; cek pemakai downstream seperti halaman publik, laporan, surat, ekspor, dan integrasi.

Saat implementasi:

- Untuk UI yang diselaraskan dengan OpenSID, pertahankan semua field dan kemampuan form OpenSID yang termasuk ruang lingkup. Buat tampilannya lebih modern daripada OpenSID—tanpa mengorbankan label yang jelas, keterjangkauan field, responsivitas, validasi, atau status loading/simpan/error. Kelompokkan informasi menurut tugas pengguna; gunakan tab hanya jika mengurangi kepadatan dan navigasinya tetap jelas.
- Untuk API, verifikasi autentikasi/permission, tenant isolation, bentuk request/response, validasi server-side, status error, dan kebijakan cache. Jangan mempercayai `villageId` dari payload klien bila tenant dapat diperoleh dari sesi.
- Untuk backend, jaga pembagian tanggung jawab: route mengurus HTTP/otorisasi, use case mengatur alur dan validasi, repository mengakses penyimpanan. Ikuti struktur aktual modul—jangan memindahkan kode hanya demi keseragaman.
- Untuk perubahan data, tentukan satu sumber kebenaran. Bila ada cache atau representasi ganda, dokumentasikan dan sinkronkan pada titik mutasi yang relevan.
- Untuk upload/hapus file, validasi tipe dan ukuran di server, ikat path ke tenant, dan tangani pembersihan referensi/berkas lama dengan aman.
- Jika kontrak atau skema database berubah, perbarui schema Drizzle dan migrasi yang diperlukan; jangan mengubah migrasi lama sebagai jalan pintas. Jangan menjalankan migrasi terhadap data produksi tanpa permintaan eksplisit.
- Hindari perubahan di luar menu dan perilaku yang diminta.

## Verifikasi

Pilih pemeriksaan terkecil yang relevan, lalu jalankan ulang setelah perubahan terakhir:

- `npm run typecheck` untuk tipe TypeScript.
- `npx eslint <file-yang-diubah>` untuk lint terarah; `npm run lint` bila cakupannya memang luas.
- `npm test` untuk suite unit. Untuk perubahan lintas lapisan atau perilaku bisnis, jalankan test terkait dan perluas seperlunya.
- Jika menyentuh format, gunakan `npx prettier --check <file-yang-diubah>`.
- Untuk migrasi, periksa migrasi dan test paritas/validasi database yang relevan. Jangan mengklaim perubahan perilaku runtime sudah diverifikasi hanya dari typecheck.
- Laporkan tepat pemeriksaan yang dijalankan, hasilnya, dan hal yang belum diverifikasi (misalnya pemeriksaan browser visual).

Perintah proyek yang tersedia tercatat di `package.json`; jangan mengarang nama script. Perintah umum: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run check`.
