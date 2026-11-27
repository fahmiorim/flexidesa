import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ubahRiwayatAction } from "@/app/(admin)/(kependudukan)/kependudukan/mutasi-penduduk/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { getRiwayatPendudukById } from "@/features/kependudukan/penduduk/application/riwayat-penduduk-use-cases";
import { PENDUDUK_RESOURCE } from "@/features/kependudukan/penduduk/domain/penduduk";
import {
  PENOLONG_KEMATIAN,
  PENOLONG_KEMATIAN_LABELS,
  SEBAB_KEMATIAN,
  SEBAB_KEMATIAN_LABELS,
  TUJUAN_PINDAH,
  TUJUAN_PINDAH_LABELS,
  type MutasiDetailMeta,
} from "@/features/kependudukan/penduduk/domain/riwayat-penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Ubah Catatan Mutasi" };
const inputClass = "form-input";

export default async function UbahRiwayatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [user, row] = await Promise.all([verifySession(), getRiwayatPendudukById(id)]);
  if (!row || !hasPermission(user.permissions, PENDUDUK_RESOURCE, "update")) notFound();

  const meta = (row.meta ?? {}) as MutasiDetailMeta;
  const reportedDate = new Date(row.reportedAt).toISOString().slice(0, 10);
  const mati = row.type === "death";
  const pindah = row.type === "move_out";

  return (
    <div className="modul-page data-kependudukan-page">
      <ButtonLink variant="secondary" href="/kependudukan/mutasi-penduduk">
        ← Kembali
      </ButtonLink>
      <PageHeading
        judul={<>Ubah Catatan Mutasi</>}
        deskripsi={<>{row.residentName ?? "Data penduduk tidak tersedia"}</>}
      />
      <section className="platform-card data-panel">
        <header>
          <h2>Data Peristiwa</h2>
          <p>Perbarui tanggal peristiwa, tanggal lapor, dan catatan peristiwa.</p>
        </header>
        <form action={ubahRiwayatAction.bind(null, id)} className="form-stack">
          <div className="modul-form-grid">
            {mati ? (
              <>
                <label className="form-field">
                  <span className="form-label">Tempat Meninggal</span>
                  <input
                    className={inputClass}
                    defaultValue={meta.tempatMeninggal ?? ""}
                    maxLength={50}
                    name="tempatMeninggal"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Jam Kematian</span>
                  <input
                    className={inputClass}
                    defaultValue={meta.jamKematian ?? ""}
                    maxLength={50}
                    name="jamKematian"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Penyebab Kematian</span>
                  <select className={inputClass} defaultValue={meta.sebab ?? ""} name="sebab">
                    <option value="">— Belum ditentukan —</option>
                    {SEBAB_KEMATIAN.map((value) => (
                      <option key={value} value={value}>
                        {SEBAB_KEMATIAN_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Yang Menerangkan Kematian</span>
                  <select className={inputClass} defaultValue={meta.penolong ?? ""} name="penolong">
                    <option value="">— Belum ditentukan —</option>
                    {PENOLONG_KEMATIAN.map((value) => (
                      <option key={value} value={value}>
                        {PENOLONG_KEMATIAN_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Anak Ke-</span>
                  <input
                    className={inputClass}
                    defaultValue={meta.anakKe ?? ""}
                    min={1}
                    name="anakKe"
                    type="number"
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Nomor Akta Kematian</span>
                  <input
                    className={inputClass}
                    defaultValue={meta.nomorAkta ?? ""}
                    maxLength={50}
                    name="nomorAkta"
                  />
                </label>
              </>
            ) : null}
            {pindah ? (
              <>
                <label className="form-field">
                  <span className="form-label">Tujuan Pindah</span>
                  <select
                    className={inputClass}
                    defaultValue={meta.refPindah ?? ""}
                    name="refPindah"
                  >
                    <option value="">— Belum ditentukan —</option>
                    {TUJUAN_PINDAH.map((value) => (
                      <option key={value} value={value}>
                        {TUJUAN_PINDAH_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Alamat Tujuan</span>
                  <textarea
                    className={inputClass}
                    defaultValue={meta.alamatTujuan ?? row.toAddress ?? ""}
                    name="alamatTujuan"
                    rows={3}
                  />
                </label>
              </>
            ) : null}
            <label className="form-field">
              <span className="form-label">Tanggal Peristiwa</span>
              <input
                className={inputClass}
                defaultValue={row.eventDate}
                name="eventDate"
                required
                type="date"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Tanggal Lapor</span>
              <input
                className={inputClass}
                defaultValue={reportedDate}
                name="reportDate"
                required
                type="date"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Catatan Peristiwa</span>
              <textarea
                className={inputClass}
                defaultValue={row.notes ?? ""}
                name="notes"
                placeholder="Catatan"
                rows={5}
              />
            </label>
          </div>
          <div className="penduduk-heading-actions">
            <ButtonLink variant="secondary" href="/kependudukan/mutasi-penduduk">
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
