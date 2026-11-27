import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { getPengaduanDetailData } from "@/features/layanan-warga/pengaduan/application/use-cases";
import { labelStatus, STATUS_PENGADUAN } from "@/features/layanan-warga/pengaduan/domain/pengaduan";

import { hapusPengaduanAction, simpanTanggapanPengaduanAction } from "../actions";

export const metadata: Metadata = { title: "Detail Pengaduan" };

function tanggal(value: Date | null): string {
  return value
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(value)
    : "—";
}

export default async function DetailPengaduanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; berhasil?: string }>;
}) {
  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const row = await getPengaduanDetailData(id);
  if (!row) notFound();

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Detail Pengaduan</>}
        deskripsi={
          <>
            {row.nomorTiket} · Dikirim {tanggal(row.createdAt)}
          </>
        }
        aksi={
          <>
            <ButtonLink variant="secondary" href="/pengaduan-admin">
              Kembali ke daftar
            </ButtonLink>
          </>
        }
      />
      {query.error ? (
        <p className="alert alert-info" role="alert">
          {query.error}
        </p>
      ) : null}
      {query.berhasil ? (
        <p className="alert alert-info" role="status">
          {query.berhasil}
        </p>
      ) : null}
      <div className="modul-form-grid">
        <section className="modul-card">
          <div className="page-heading">
            <div>
              <h2>{row.judul}</h2>
            </div>
            <strong>{labelStatus(row.status)}</strong>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{row.isi}</p>
          {row.lampiran ? (
            <p>
              <ButtonLink variant="secondary" href={`/pengaduan-admin/${row.id}/lampiran`}>
                Unduh lampiran bukti
              </ButtonLink>
            </p>
          ) : (
            <p className="modul-muted">Tidak ada lampiran.</p>
          )}
          <dl className="modul-detail-grid">
            <div>
              <dt>Nama pelapor</dt>
              <dd>{row.namaPelapor}</dd>
            </div>
            <div>
              <dt>NIK</dt>
              <dd>{row.nik ?? "Tidak diisi"}</dd>
            </div>
            <div>
              <dt>Telepon</dt>
              <dd>{row.telepon ?? "Tidak diisi"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{row.email ?? "Tidak diisi"}</dd>
            </div>
            <div>
              <dt>Alamat</dt>
              <dd>{row.alamat ?? "Tidak diisi"}</dd>
            </div>
            <div>
              <dt>Petugas</dt>
              <dd>{row.petugasNama ?? "Belum ditugaskan"}</dd>
            </div>
            <div>
              <dt>Terakhir ditanggapi</dt>
              <dd>{tanggal(row.ditanggapiPada)}</dd>
            </div>
          </dl>
        </section>
        <section className="modul-card">
          <h2>Perbarui penanganan</h2>
          <form action={simpanTanggapanPengaduanAction} className="modul-form-grid">
            <input type="hidden" name="id" value={row.id} />
            <label className="modul-field">
              Status
              <select name="status" defaultValue={row.status}>
                {STATUS_PENGADUAN.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modul-field">
              Tanggapan / hasil penanganan
              <textarea
                name="tanggapan"
                rows={7}
                maxLength={4000}
                defaultValue={row.tanggapan ?? ""}
                placeholder="Jelaskan tindak lanjut atau alasan penolakan..."
              />
            </label>
            <label className="modul-field">
              <span>
                <input type="checkbox" name="publik" defaultChecked={row.publik} /> Izinkan tampil
                pada halaman publik
              </span>
              <small>Nama pelapor akan disamarkan pada halaman publik.</small>
            </label>
            <div className="modul-form-actions">
              <Button variant="primary" type="submit">
                Simpan Tanggapan
              </Button>
            </div>
          </form>
          <hr />
          <DialogHapusForm
            aksi={hapusPengaduanAction}
            id={row.id}
            judul={`Hapus pengaduan "${row.judul}"?`}
            keterangan="Data pengaduan, tanggapan, dan lampiran yang tersimpan akan dihapus permanen."
            labelAksi="Hapus pengaduan"
            varian="danger"
          />
        </section>
      </div>
    </div>
  );
}
