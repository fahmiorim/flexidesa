import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ubahKeluargaAction } from "@/app/(admin)/(kependudukan)/kependudukan/keluarga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  getKeluargaDetail,
  getKeluargaFormReference,
} from "@/features/kependudukan/keluarga/application/use-cases";
import { KELUARGA_WELFARE_CLASSES } from "@/features/kependudukan/keluarga/domain/keluarga";

export const metadata: Metadata = { title: "Ubah Kartu Keluarga" };
export default async function UbahKeluargaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [detail, reference] = await Promise.all([
    getKeluargaDetail(id),
    getKeluargaFormReference(),
  ]);
  return (
    <div className="modul-page penduduk-page data-kependudukan-page keluarga-page">
      <Link className="penduduk-back" href={`/kependudukan/keluarga/${id}`}>
        ← Kembali ke detail KK
      </Link>
      <PageHeading
        judul={<>Ubah Data Kartu Keluarga</>}
        deskripsi={<>Perbarui nomor KK, alamat, wilayah, kelas sosial, dan tanggal cetak.</>}
      />
      <section className="platform-card data-panel">
        <header className="data-section-heading">
          <div>
            <h2>Data Administrasi KK</h2>
            <p>Perubahan nomor, alamat, wilayah, kelas sosial, dan tanggal cetak.</p>
          </div>
        </header>
        <form action={ubahKeluargaAction.bind(null, id)} className="form-stack">
          <div className="modul-form-grid">
            <label className="form-field">
              <span className="form-label">Nomor Kartu Keluarga</span>
              <input
                className="form-input"
                defaultValue={detail.keluarga.number}
                inputMode="numeric"
                maxLength={16}
                name="number"
                pattern="[0-9]{16}"
              />
              <span className="form-help">
                Wajib 16 angka untuk KK permanen; kosongkan bila memakai nomor sementara.
              </span>
            </label>
            <label className="form-field">
              <span className="form-label">Nomor KK sementara</span>
              <span className="form-check">
                <input
                  defaultChecked={detail.keluarga.temporary}
                  name="temporary"
                  type="checkbox"
                />
                <span>Pertahankan / buat nomor sementara</span>
              </span>
              <span className="form-help">Nomor sementara dibuat otomatis dan tetap 16 angka.</span>
            </label>
            <label className="form-field">
              <span className="form-label">Tanggal Cetak KK</span>
              <input
                className="form-input"
                defaultValue={detail.keluarga.cardPrintedAt ?? ""}
                name="cardPrintedAt"
                type="date"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Kelas Sosial</span>
              <select
                className="form-input"
                defaultValue={detail.keluarga.welfareClass ?? ""}
                name="welfareClass"
              >
                <option value="">Belum ditetapkan</option>
                {KELUARGA_WELFARE_CLASSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="form-field">
            <span className="form-label">Alamat</span>
            <textarea
              className="form-input"
              defaultValue={detail.keluarga.address ?? ""}
              maxLength={255}
              name="address"
              rows={3}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Dusun / RT / RW</span>
            <select
              className="form-input"
              defaultValue={detail.keluarga.regionId ?? ""}
              name="regionId"
            >
              <option value="">Belum ditentukan</option>
              {reference.regions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="penduduk-heading-actions">
            <ButtonLink variant="secondary" href={`/kependudukan/keluarga/${id}`}>
              Batal
            </ButtonLink>
            <Button variant="primary" type="submit">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
