import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import type { KlasifikasiSuratDTO } from "@/features/pelayanan-persuratan/surat/domain/surat";

type Row = {
  id?: number;
  agendaNumber?: number;
  receivedDate?: string;
  letterNumber?: string;
  letterDate?: string | null;
  sender?: string | null;
  recipient?: string | null;
  classificationId?: number | null;
  summary?: string | null;
  disposition?: string | null;
  sentDate?: string | null;
  archiveLocation?: string | null;
};
export function BukuAgendaForm({
  jenis,
  row,
  klasifikasi,
  action,
}: {
  jenis: "masuk" | "keluar";
  row?: Row | null;
  klasifikasi: KlasifikasiSuratDTO[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const masuk = jenis === "masuk";
  return (
    <div className="modul-page">
      <PageHeading
        judul={
          <>
            {row?.id ? "Ubah" : "Tambah"} Surat {masuk ? "Masuk" : "Keluar"}
          </>
        }
        deskripsi={<>Catat informasi surat dan lokasi arsip pada buku agenda desa.</>}
      />
      <section className="modul-card">
        <form action={action} className="modul-form-grid modul-card-body form-card">
          {row?.id ? <input type="hidden" name="id" value={row.id} /> : null}
          <FormField
            label="Nomor agenda (kosong = otomatis)"
            name="agendaNumber"
            type="number"
            min={0}
            max={99999}
            placeholder="Otomatis"
            defaultValue={row?.agendaNumber ?? ""}
          />
          <FormField
            label="Nomor surat"
            name="letterNumber"
            required
            maxLength={50}
            defaultValue={row?.letterNumber ?? ""}
          />
          <FormField
            label={masuk ? "Tanggal diterima" : "Tanggal surat"}
            name={masuk ? "receivedDate" : "letterDate"}
            type="date"
            required
            defaultValue={masuk ? (row?.receivedDate ?? "") : (row?.letterDate ?? "")}
          />
          {masuk ? (
            <FormField
              label="Tanggal surat"
              name="letterDate"
              type="date"
              defaultValue={row?.letterDate ?? ""}
            />
          ) : (
            <FormField
              label="Tanggal dikirim"
              name="sentDate"
              type="date"
              defaultValue={row?.sentDate ?? ""}
            />
          )}
          <FormField
            label={masuk ? "Pengirim" : "Penerima"}
            name={masuk ? "sender" : "recipient"}
            maxLength={150}
            defaultValue={masuk ? (row?.sender ?? "") : (row?.recipient ?? "")}
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
            label="Ringkasan / perihal"
            name="summary"
            maxLength={255}
            defaultValue={row?.summary ?? ""}
          />
          {masuk ? (
            <FormField
              label="Disposisi"
              name="disposition"
              maxLength={255}
              defaultValue={row?.disposition ?? ""}
            />
          ) : null}
          <FormField
            label="Lokasi arsip"
            name="archiveLocation"
            maxLength={150}
            defaultValue={row?.archiveLocation ?? ""}
          />
          <div className="form-actions">
            <ButtonLink
              variant="secondary"
              href={
                masuk
                  ? "/layanan-surat/persuratan/surat-masuk"
                  : "/layanan-surat/persuratan/surat-keluar"
              }
            >
              Batal
            </ButtonLink>
            <Button variant="primary" type="submit">
              Simpan Surat {masuk ? "Masuk" : "Keluar"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
