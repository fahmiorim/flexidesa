import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { PlatformCard, PlatformPageHeader } from "@/features/multi-desa/presentation/platform-ui";
import { MAX_RESTORE_BYTES } from "@/features/pengaturan/database/domain/database";

import { pastikanSuperAdmin } from "../guard";

export const metadata: Metadata = {
  title: "Backup & Restore",
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
        <Alert variant="info">
          Restore selesai dan verifikasi tabel inti lulus. Seluruh sesi pengguna mengikuti data
          hasil restore.
        </Alert>
      ) : null}

      <PlatformCard
        description="Berkas berisi seluruh basis data platform, termasuk data semua desa. Simpan di tempat aman dan jangan dibagikan."
        title="Unduh backup"
      >
        <p>
          Unduhan dibuat saat tautan dibuka. Proses selesai ditandai dengan berkas terunduh dan
          tercatat pada audit trail platform.
        </p>
        <div className="ui-page-actions">
          <ButtonLink variant="secondary" href="/api/database/backup">
            Unduh SQL.GZ
          </ButtonLink>
          <ButtonLink variant="secondary" href="/api/database/backup?format=sql">
            Unduh SQL
          </ButtonLink>
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
        <Alert variant="error">
          Perhatian: restore menimpa data berjalan untuk <strong>semua desa</strong>, bukan hanya
          satu tenant. Buat backup terbaru dan pastikan berkas berasal dari platform ini sebelum
          melanjutkan.
        </Alert>

        <form
          action="/api/database/restore"
          className="ui-form-grid"
          encType="multipart/form-data"
          method="post"
        >
          <FormField
            accept=".sql,.sql.gz"
            containerClassName="form-field-full"
            helpText={`Hanya .sql atau .sql.gz, maksimum ${batasMb} MB.`}
            id="berkas"
            kind="file"
            label="Berkas backup"
            name="berkas"
            required
          />
          <FormField
            containerClassName="form-field-full"
            id="konfirmasi"
            kind="checkbox"
            label="Saya memahami restore mengganti seluruh basis data dan memengaruhi semua desa."
            name="konfirmasi"
            required
            value="1"
          />

          <div className="ui-page-actions">
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
