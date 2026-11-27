import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { type getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import { hapusAgendaWebsiteAction, ubahStatusAgendaWebsiteAction } from "../actions";
import { tambahAgendaFormAction, ubahAgendaFormAction } from "../form-actions";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  agenda: DataKonten["agenda"];
  formatTanggal: (value: Date | string | null) => string;
}

type AgendaRow = DataKonten["agenda"][number];

function formAgenda(row: AgendaRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.judul ?? ""}
        label="Nama kegiatan"
        maxLength={200}
        name="judulAgenda"
        required
      />
      <FormField
        defaultValue={row?.kategori ?? "umum"}
        label="Kategori"
        maxLength={50}
        name="kategoriAgenda"
      />
      <FormField
        defaultValue={row ? String(row.mulai).slice(0, 10) : ""}
        label="Tanggal mulai"
        name="mulaiAgenda"
        required
        type="date"
      />
      <FormField
        defaultValue={row?.selesai ? String(row.selesai).slice(0, 10) : ""}
        label="Tanggal selesai"
        name="selesaiAgenda"
        type="date"
      />
      <FormField defaultValue={row?.jamMulai ?? ""} label="Jam mulai" name="jamMulai" type="time" />
      <FormField
        defaultValue={row?.jamSelesai ?? ""}
        label="Jam selesai"
        name="jamSelesai"
        type="time"
      />
      <FormField
        defaultValue={row?.lokasi ?? ""}
        label="Lokasi"
        maxLength={200}
        name="lokasiAgenda"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.deskripsi ?? ""}
        kind="textarea"
        label="Deskripsi"
        name="deskripsiAgenda"
        rows={3}
      />
      {row ? null : (
        <div className="modul-form-checks form-field-full">
          <label>
            <input name="tayangAgenda" type="checkbox" /> Tampilkan di website publik
          </label>
        </div>
      )}
    </div>
  );
}

/** Bagian agenda kegiatan Website. */
export function BagianAgenda({ izin, agenda, formatTanggal }: Props) {
  return (
    <TableCard
      title="Agenda Kegiatan"
      description={`${agenda.length} agenda terdaftar.`}
      actions={
        izin.agenda.tambah ? (
          <FormDialog
            aksi={tambahAgendaFormAction}
            deskripsi="Agenda yang ditayangkan akan muncul di halaman publik desa."
            judul="Tambah agenda"
            label="Tambah agenda"
            labelSimpan="Simpan agenda"
          >
            {formAgenda(null)}
          </FormDialog>
        ) : undefined
      }
    >
      <div className="website-table-wrap">
        <TableScroll>
          <Table className="website-table website-table-agenda">
            <THead>
              <Row>
                <HeaderCell>Kegiatan</HeaderCell>
                <HeaderCell>Tanggal</HeaderCell>
                <HeaderCell>Lokasi</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {agenda.map((item) => (
                <Row key={item.id}>
                  <Cell>
                    <strong>{item.judul}</strong>
                    <small>{item.kategori}</small>
                  </Cell>
                  <Cell>
                    {formatTanggal(item.mulai)}
                    {item.selesai && item.selesai !== item.mulai
                      ? ` – ${formatTanggal(item.selesai)}`
                      : ""}
                  </Cell>
                  <Cell>{item.lokasi ?? "—"}</Cell>
                  <Cell>
                    <span
                      className={
                        item.tayang ? "website-status" : "website-status website-status-off"
                      }
                    >
                      {item.tayang ? "Tayang" : "Disimpan"}
                    </span>
                  </Cell>
                  <Cell>
                    {(izin.agenda.ubah || izin.agenda.hapus) && (
                      <div className="website-row-actions">
                        {izin.agenda.ubah && (
                          <FormDialog
                            aksi={ubahAgendaFormAction}
                            deskripsi={`Ubah agenda "${item.judul}".`}
                            judul="Ubah agenda"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {formAgenda(item)}
                          </FormDialog>
                        )}
                        {izin.agenda.ubah && (
                          <form action={ubahStatusAgendaWebsiteAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="tayang" value={String(!item.tayang)} />
                            <Button size="sm" type="submit" variant="secondary">
                              {item.tayang ? "Sembunyikan" : "Tayangkan"}
                            </Button>
                          </form>
                        )}
                        {izin.agenda.hapus && (
                          <DialogHapusForm
                            aksi={hapusAgendaWebsiteAction}
                            id={item.id}
                            judul={`Hapus agenda "${item.judul}"?`}
                            keterangan="Agenda kegiatan akan dihapus permanen dari website desa."
                            labelAksi="Hapus agenda"
                          />
                        )}
                      </div>
                    )}
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
        {agenda.length === 0 ? <p className="modul-empty">Belum ada agenda kegiatan.</p> : null}
      </div>
    </TableCard>
  );
}
