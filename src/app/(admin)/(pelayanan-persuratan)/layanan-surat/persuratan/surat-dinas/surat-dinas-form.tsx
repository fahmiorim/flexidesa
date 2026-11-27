import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
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
      />
      <section className="modul-card">
        <form action={simpanSuratDinasAction} className="modul-form-grid modul-card-body form-card">
          {row ? <input type="hidden" name="id" value={row.id} /> : null}
          <FormField
            label="Nomor surat *"
            name="letterNumber"
            required
            maxLength={100}
            defaultValue={row?.letterNumber ?? ""}
          />
          <FormField
            label="Tanggal surat *"
            name="letterDate"
            type="date"
            required
            defaultValue={row?.letterDate ?? ""}
          />
          <FormField
            label="Penerima"
            name="recipient"
            maxLength={150}
            defaultValue={row?.recipient ?? ""}
          />
          <FormField
            label="Alamat penerima"
            name="recipientAddress"
            maxLength={255}
            defaultValue={row?.recipientAddress ?? ""}
          />
          <FormField
            label="Perihal *"
            name="subject"
            required
            maxLength={200}
            defaultValue={row?.subject ?? ""}
          />
          <FormField
            label="Klasifikasi"
            kind="select"
            name="classificationId"
            defaultValue={row?.classificationId?.toString() ?? "none"}
            options={[
              { value: "none", label: "Tanpa klasifikasi" },
              ...klasifikasi.map((item) => ({
                value: String(item.id),
                label: `${item.code} — ${item.name}`,
              })),
            ]}
          />
          <FormField
            label="Isi / ringkasan surat"
            kind="textarea"
            name="content"
            rows={6}
            maxLength={4000}
            defaultValue={row?.content ?? ""}
            containerClassName="form-field-full"
          />
          <FormField
            label="Unggah lampiran surat (PDF, maksimal 20 MB)"
            name="archiveUpload"
            type="file"
            accept="application/pdf,.pdf"
          />
          <FormField
            label="Lokasi arsip fisik"
            name="archiveLocation"
            maxLength={150}
            defaultValue={row?.archiveLocation ?? ""}
          />
          {row?.archiveFile ? (
            <div className="form-field-full form-check-inline">
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
          <div className="form-actions">
            <ButtonLink variant="secondary" href="/layanan-surat/persuratan/surat-dinas">
              Batal
            </ButtonLink>
            <Button variant="primary" type="submit">
              Simpan Surat Dinas
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
