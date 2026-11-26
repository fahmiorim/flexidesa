import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import type {
  KlasifikasiSuratDTO,
  SuratDinasDTO,
} from "@/features/pelayanan-persuratan/surat/domain/surat";

import { simpanSuratDinasAction } from "./actions";

export function SuratDinasForm({
  row,
  klasifikasi,
}: {
  row?: SuratDinasDTO | null;
  klasifikasi: KlasifikasiSuratDTO[];
}) {
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>{row ? "Ubah Surat Dinas" : "Buat Surat Dinas"}</>}
        deskripsi={<>Catat surat dinas yang diterbitkan.</>}
        aksi={
          <>
            <Link className="button button-secondary" href="/layanan-surat/persuratan/surat-dinas">
              Kembali
            </Link>
          </>
        }
      />
      <section className="modul-card">
        <form action={simpanSuratDinasAction} className="modul-form-grid">
          {row ? <input type="hidden" name="id" value={row.id} /> : null}
          <label className="modul-field">
            <span>Nomor surat *</span>
            <input
              name="letterNumber"
              required
              maxLength={100}
              defaultValue={row?.letterNumber ?? ""}
            />
          </label>
          <label className="modul-field">
            <span>Tanggal surat *</span>
            <input name="letterDate" type="date" required defaultValue={row?.letterDate ?? ""} />
          </label>
          <label className="modul-field">
            <span>Penerima</span>
            <input name="recipient" maxLength={150} defaultValue={row?.recipient ?? ""} />
          </label>
          <label className="modul-field">
            <span>Alamat penerima</span>
            <input
              name="recipientAddress"
              maxLength={255}
              defaultValue={row?.recipientAddress ?? ""}
            />
          </label>
          <label className="modul-field">
            <span>Perihal *</span>
            <input name="subject" required maxLength={200} defaultValue={row?.subject ?? ""} />
          </label>
          <label className="modul-field">
            <span>Klasifikasi</span>
            <select
              name="classificationId"
              defaultValue={row?.classificationId?.toString() ?? "none"}
            >
              <option value="none">Tanpa klasifikasi</option>
              {klasifikasi.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="modul-field" style={{ gridColumn: "1 / -1" }}>
            <span>Isi / ringkasan surat</span>
            <textarea name="content" rows={6} maxLength={4000} defaultValue={row?.content ?? ""} />
          </label>
          <label className="modul-field">
            <span>Unggah lampiran surat (PDF, maksimal 20 MB)</span>
            <input name="archiveUpload" type="file" accept="application/pdf,.pdf" />
          </label>
          <label className="modul-field">
            <span>Lokasi arsip fisik</span>
            <input
              name="archiveLocation"
              maxLength={150}
              defaultValue={row?.archiveLocation ?? ""}
            />
          </label>
          {row?.archiveFile ? (
            <div
              className="modul-field"
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>
                Lampiran tersimpan:{" "}
                <a
                  className="table-action-link"
                  href={`/api/admin/persuratan/surat-dinas/${row.id}/lampiran`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat / unduh PDF →
                </a>
              </span>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" name="hapusArsip" /> Hapus lampiran saat disimpan
              </label>
            </div>
          ) : null}
          <div
            style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}
          >
            <Link className="button button-secondary" href="/layanan-surat/persuratan/surat-dinas">
              Batal
            </Link>
            <button className="button button-primary" type="submit">
              Simpan Surat Dinas
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
