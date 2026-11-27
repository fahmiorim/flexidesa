import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import type { getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import { hapusSliderWebsiteAction, ubahStatusSliderWebsiteAction } from "../actions";
import { tambahSliderWebsiteFormAction, ubahSliderWebsiteFormAction } from "../form-actions";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  slider: DataKonten["slider"];
}

type SliderRow = DataKonten["slider"][number];

function formSlider(row: SliderRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField defaultValue={row?.judul ?? ""} label="Judul" maxLength={150} name="judulSlider" />
      <FormField
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={500}
        name="keteranganSlider"
        rows={2}
      />
      <FormField
        defaultValue={row?.tautan ?? ""}
        label="Link tujuan"
        name="tautanSlider"
        placeholder="https://..."
        type="url"
      />
      <FormField
        defaultValue={row?.urut ?? 0}
        label="Urutan"
        min={0}
        name="urutSlider"
        type="number"
      />
      <FormField
        accept="image/jpeg,image/png,image/webp,image/gif"
        label={row ? "Ganti gambar" : "Gambar"}
        name="gambarSlider"
        required={row === null}
        type="file"
      />
      {row ? null : (
        <div className="modul-form-checks form-field-full">
          <label>
            <input defaultChecked name="aktifSlider" type="checkbox" /> Aktif
          </label>
        </div>
      )}
    </div>
  );
}

/** Bagian slider beranda Website. */
export function BagianSlider({ izin, slider }: Props) {
  return (
    <TableCard
      title="Slider Beranda"
      description={`${slider.length} slide terdaftar.`}
      actions={
        izin.slider.tambah ? (
          <FormDialog
            aksi={tambahSliderWebsiteFormAction}
            deskripsi="Slide aktif akan tampil pada bagian atas beranda website desa."
            judul="Tambah slider"
            label="Tambah slider"
            labelSimpan="Tambah slider"
          >
            {formSlider(null)}
          </FormDialog>
        ) : undefined
      }
    >
      <div className="website-table-wrap">
        {slider.length === 0 ? (
          <p className="modul-empty">Belum ada slide beranda.</p>
        ) : (
          <TableScroll>
            <Table className="website-table">
              <THead>
                <Row>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Urutan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {slider.map((item) => (
                  <Row key={item.id}>
                    <Cell>
                      <strong>{item.judul ?? "Slide tanpa judul"}</strong>
                    </Cell>
                    <Cell>{item.urut}</Cell>
                    <Cell>
                      <span
                        className={
                          item.aktif ? "website-status" : "website-status website-status-off"
                        }
                      >
                        {item.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </Cell>
                    <Cell>
                      {(izin.slider.ubah || izin.slider.hapus) && (
                        <div className="website-row-actions">
                          {izin.slider.ubah && (
                            <FormDialog
                              aksi={ubahSliderWebsiteFormAction}
                              deskripsi={`Ubah slide "${item.judul ?? "tanpa judul"}".`}
                              judul="Ubah slider"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {formSlider(item)}
                            </FormDialog>
                          )}
                          {izin.slider.ubah && (
                            <form action={ubahStatusSliderWebsiteAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="aktif" value={String(!item.aktif)} />
                              <Button size="sm" type="submit" variant="secondary">
                                {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                              </Button>
                            </form>
                          )}
                          {izin.slider.hapus && (
                            <DialogHapusForm
                              aksi={hapusSliderWebsiteAction}
                              id={item.id}
                              judul={`Hapus slide "${item.judul ?? "tanpa judul"}"?`}
                              keterangan="Slide dan gambarnya akan dihapus permanen dari beranda website desa."
                              labelAksi="Hapus slide"
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
        )}
      </div>
    </TableCard>
  );
}
