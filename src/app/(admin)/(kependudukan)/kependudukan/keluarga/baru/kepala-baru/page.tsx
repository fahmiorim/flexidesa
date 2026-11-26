import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buatKeluargaDenganKepalaBaruAction } from "@/app/(admin)/(kependudukan)/kependudukan/keluarga/actions";
import { FormPenduduk } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/form-penduduk";
import { PageHeading } from "@/components/shell/page-heading";
import {
  KELUARGA_RESOURCE,
  KELUARGA_WELFARE_CLASSES,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import { getPendudukFormData } from "@/features/kependudukan/penduduk/application/use-cases";
import { PENDUDUK_RESOURCE } from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Tambah KK & Kepala Keluarga" };

export default async function KeluargaBaruKepalaPage() {
  const user = await verifySession();
  if (
    !hasPermission(user.permissions, KELUARGA_RESOURCE, "create") ||
    !hasPermission(user.permissions, PENDUDUK_RESOURCE, "create")
  ) {
    notFound();
  }

  const { references } = await getPendudukFormData();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page">
      <PageHeading
        judul={<>Tambah KK &amp; Kepala Keluarga Baru</>}
        deskripsi={<>Buat KK baru beserta kepala keluarganya.</>}
      />

      <FormPenduduk
        aksi={buatKeluargaDenganKepalaBaruAction}
        kembaliHref="/kependudukan/keluarga"
        labelKembali="← Kembali ke daftar Kartu Keluarga"
        labelSimpan="Simpan KK & Kepala Keluarga"
        redirectPrefix="/kependudukan/keluarga"
        references={references}
        sembunyikanKeluarga
      >
        <section className="platform-card penduduk-form-card" id="data-kk">
          <header className="penduduk-form-section-head">
            <span aria-hidden="true" className="penduduk-form-step">
              00
            </span>
            <div>
              <h2>Data Kartu Keluarga</h2>
              <p>
                Nomor KK, kelas sosial, dan tanggal cetak. Kepala keluarga diisi pada form di bawah.
              </p>
            </div>
          </header>
          <div className="platform-card-body">
            <div className="platform-form-grid">
              <label className="form-field">
                <span className="form-label">Nomor Kartu Keluarga</span>
                <input
                  className="form-input"
                  inputMode="numeric"
                  maxLength={16}
                  name="number"
                  pattern="[0-9]{16}"
                  placeholder="16 angka"
                />
                <span className="form-help">
                  Wajib 16 angka untuk KK permanen. Biarkan kosong bila memakai nomor sementara.
                </span>
              </label>
              <label className="form-field">
                <span className="form-label">Nomor KK sementara</span>
                <span className="form-check">
                  <input name="temporary" type="checkbox" />
                  <span>Buat nomor sementara otomatis</span>
                </span>
                <span className="form-help">
                  Nomor memakai awalan 0 + kode desa + urutan, seperti OpenSID.
                </span>
              </label>
              <label className="form-field">
                <span className="form-label">Kelas Sosial</span>
                <select className="form-input" defaultValue="" name="welfareClass">
                  <option value="">Belum ditetapkan</option>
                  {KELUARGA_WELFARE_CLASSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Tanggal Cetak KK</span>
                <input className="form-input" name="cardPrintedAt" type="date" />
              </label>
            </div>
          </div>
        </section>
      </FormPenduduk>
    </div>
  );
}
