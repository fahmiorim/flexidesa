import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { PlatformCard, PlatformPageHeader } from "@/features/multi-desa/presentation/platform-ui";
import { MAX_RESTORE_BYTES } from "@/features/pengaturan/database/domain/database";

import { pastikanSuperAdmin } from "../guard";

export const metadata: Metadata = {
  title: "Backup & Restore Database",
  robots: { index: false, follow: false },
};

const batasMb = Math.round(MAX_RESTORE_BYTES / (1024 * 1024));

/**
 * Operasi manual backup/restore basis data platform.
 *
 * Halaman ini tidak menjalankan dump sendiri: unduhan memakai
 * `/api/database/backup` dan pemulihan memakai `/api/database/restore`, yang
 * sama-sama memeriksa Super Admin di server. Karena restore mengganti seluruh
 * basis data (semua desa), konfirmasi wajib dicentang sebelum berkas dikirim
 * dan diperiksa ulang di server.
 *
 * Penjadwalan, retensi berkas, dan riwayat job sengaja belum ada sampai
 * kebijakan operasional disetujui.
 */
export default async function SuperAdminBackupPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string }>;
}) {
  await pastikanSuperAdmin();
  const { restored } = await searchParams;

  return (
    <>
      <PlatformPageHeader path="/super-admin/backup" />

      {restored === "1" ? (
        <p className="alert alert-success" role="status">
          Restore selesai dan verifikasi tabel inti lulus. Seluruh sesi pengguna mengikuti data
          hasil restore.
        </p>
      ) : null}

      <PlatformCard
        description="Berkas berisi seluruh basis data platform, termasuk data semua desa. Simpan di tempat aman dan jangan dibagikan."
        title="Unduh backup"
      >
        <p>
          Unduhan dibuat saat tautan dibuka. Proses selesai ditandai dengan berkas terunduh dan
          tercatat pada audit trail platform.
        </p>
        <div className="platform-page-actions">
          <a className="button button-secondary" href="/api/database/backup">
            Unduh SQL.GZ
          </a>
          <a className="button button-secondary" href="/api/database/backup?format=sql">
            Unduh SQL
          </a>
        </div>
        <p className="form-help">
          Format SQL.GZ lebih kecil dan lebih cepat diunggah; format SQL dipakai bila perlu dibaca
          manual.
        </p>
      </PlatformCard>

      <PlatformCard
        description="Restore mengganti seluruh basis data yang sedang dipakai aplikasi."
        title="Pulihkan dari berkas"
      >
        <p className="alert alert-error" role="alert">
          Perhatian: restore menimpa data berjalan untuk <strong>semua desa</strong>, bukan hanya
          satu tenant. Buat backup terbaru dan pastikan berkas berasal dari platform ini sebelum
          melanjutkan.
        </p>

        <form
          action="/api/database/restore"
          className="platform-form-grid"
          encType="multipart/form-data"
          method="post"
        >
          <label className="form-field form-field-full">
            <span>Berkas backup</span>
            <input accept=".sql,.sql.gz" name="berkas" required type="file" />
            <small className="form-help">Hanya .sql atau .sql.gz, maksimum {batasMb} MB.</small>
          </label>

          <label className="form-field form-field-full">
            <span>Konfirmasi</span>
            <span>
              <input name="konfirmasi" required type="checkbox" value="1" /> Saya memahami restore
              mengganti seluruh basis data dan memengaruhi semua desa.
            </span>
          </label>

          <div className="platform-page-actions">
            <Button type="submit" variant="secondary">
              Jalankan restore
            </Button>
          </div>
        </form>

        <p className="form-help">
          Berkas tanpa konfirmasi, berformat lain, atau melebihi batas ditolak server sebelum data
          diubah. Setelah restore, server memverifikasi tabel inti dan menulis audit trail.
        </p>
      </PlatformCard>

      <PlatformCard description="Belum termasuk pada rilis ini." title="Penjadwalan dan retensi">
        <p>
          Backup terjadwal, penyimpanan berkas di server, dan riwayat pekerjaan belum tersedia. Saat
          ini backup diunduh manual oleh operator platform.
        </p>
      </PlatformCard>
    </>
  );
}
