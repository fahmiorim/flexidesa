import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Konfigurasi integration test.
 *
 * Berbeda dari `vitest.config.mts`, konfigurasi ini tidak memberi nilai
 * `DATABASE_URL` sama sekali. `src/testing/setup-integration.ts` memvalidasi
 * `TEST_DATABASE_URL` + `TEST_DATABASE_ACK` lalu menetapkan `DATABASE_URL` dari
 * nilai yang sudah lolos guard. Bila validasi gagal, setup melempar error dan
 * seluruh suite gagal (tidak ada skip diam-diam).
 *
 * Jalankan hanya dengan `npm run test:integration` setelah database disposable
 * disiapkan. Lihat `.env.example` untuk variabel yang dibutuhkan.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/db/b2-bantuan-composite-fk.integration.test.ts",
      "src/db/b2-dtks-suplemen-composite-fk.integration.test.ts",
      "src/db/b2-resident-composite-fk.integration.test.ts",
      "src/db/b3-inventaris-composite-fk.integration.test.ts",
      "src/db/b4-cascade-relations-composite-fk.integration.test.ts",
      "src/db/b4b-cascade-relations-composite-fk.integration.test.ts",
      "src/db/b4c1-restrict-relations-composite-fk.integration.test.ts",
      "src/db/b4c2a-letter-classification-composite-fk.integration.test.ts",
      "src/db/b4c2b-remaining-relations-composite-fk.integration.test.ts",
      "src/db/b5-set-null-relations-composite-fk.integration.test.ts",
      "src/db/tenant-child-tables.integration.test.ts",
      "src/db/role-tenant-constraint.integration.test.ts",
      "src/db/rbac-batas-tenant.integration.test.ts",
      "src/db/survey-indicator-tenant-fk.integration.test.ts",
      "src/db/tenant-composite-fk.integration.test.ts",
      "src/features/info-desa/agenda/infrastructure/agenda-repository.integration.test.ts",
      "src/features/program-data-desa/bantuan/integrasi-warga.test.ts",
      "src/features/pembangunan-aset/inventaris/infrastructure/inventaris-tenant-isolation.integration.test.ts",
      "src/features/kehadiran/kehadiran/infrastructure/rekap-kehadiran-tenant-isolation.integration.test.ts",
      "src/features/keuangan-desa/keuangan/infrastructure/apbdes-import-concurrency.integration.test.ts",
      "src/features/keuangan-desa/keuangan/infrastructure/keuangan-concurrency.integration.test.ts",
      "src/features/pelayanan-persuratan/layanan-mandiri/infrastructure/permohonan-status-concurrency.integration.test.ts",
      "src/features/kependudukan/kelompok/infrastructure/kelompok-tenant-isolation.integration.test.ts",
      "src/features/layanan-warga/kontak/application/kontak-tenant-isolation.integration.test.ts",
      "src/features/kependudukan/keluarga/infrastructure/keluarga-tenant-isolation.integration.test.ts",
      "src/features/pengaturan/database/infrastructure/verifikasi-restore.integration.test.ts",
      "src/features/pertanahan-gis/gis/infrastructure/gis-repository.integration.test.ts",
      "src/features/isolasi-modul-tambahan.integration.test.ts",
      "src/features/isolasi-village.integration.test.ts",
      "src/features/info-desa/konten/dokumen-publik.integration.test.ts",
      "src/features/pelayanan-persuratan/layanan-mandiri/integrasi-warga.test.ts",
      "src/features/multi-desa/isolasi-host.integration.test.ts",
      "src/features/multi-desa/kelola-domain.integration.test.ts",
      "src/features/multi-desa/lifecycle-tenant.integration.test.ts",
      "src/features/multi-desa/provisioning-template.integration.test.ts",
      "src/features/multi-desa/platform-konsol.integration.test.ts",
      "src/features/multi-desa/paket-langganan.integration.test.ts",
      "src/features/notifikasi/infrastructure/mailbox-webhook-idempotency.integration.test.ts",
      "src/features/kependudukan/penduduk/infrastructure/dtks-tenant-isolation.integration.test.ts",
      "src/features/kependudukan/penduduk/infrastructure/penduduk-tenant-references.integration.test.ts",
      "src/features/kependudukan/penduduk/infrastructure/riwayat-penduduk-tenant-isolation.integration.test.ts",
      "src/features/kependudukan/penduduk/infrastructure/suplemen-tenant-isolation.integration.test.ts",
      "src/features/info-desa/publik/application/pengumuman-publik.integration.test.ts",
      "src/features/media/infrastructure/media-quota-concurrency.integration.test.ts",
      "src/features/layanan-warga/pesan-warga/integrasi-pesan-warga.test.ts",
      "src/features/kependudukan/rumah-tangga/infrastructure/rumah-tangga-tenant-isolation.integration.test.ts",
      "src/features/kependudukan/statistik/infrastructure/statistik-tenant-isolation.integration.test.ts",
      "src/features/pengaturan/rbac/infrastructure/rbac-tenant-isolation.integration.test.ts",
      "src/features/pelayanan-persuratan/layanan-mandiri/permohonan-tenant-relations.integration.test.ts",
      "src/features/pelayanan-persuratan/surat/infrastructure/penomoran-archive.integration.test.ts",
      "src/features/info-desa/wilayah/infrastructure/wilayah-repository.integration.test.ts",
    ],
    setupFiles: ["./src/testing/setup-integration.ts"],
    // Suite migration membuat beberapa database dan menjalankan DDL; pada
    // Windows dengan suite paralel, beforeAll dapat melewati 120 detik.
    hookTimeout: 300_000,
    env: {
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "rahasia-uji-coba-minimal-32-karakter",
      TRUST_PROXY: "true",
    },
    alias: {
      "server-only": fileURLToPath(new URL("./src/testing/server-only.ts", import.meta.url)),
    },
  },
});
