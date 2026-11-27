import Image from "next/image";

import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { type getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import { hapusAlbumGaleriWebsiteAction, hapusFotoGaleriWebsiteAction } from "../actions";
import {
  tambahAlbumWebsiteFormAction,
  ubahAlbumWebsiteFormAction,
  ubahFotoGaleriWebsiteFormAction,
  unggahFotoWebsiteFormAction,
} from "../form-actions";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  album: DataKonten["album"];
  photos: DataKonten["photos"];
}

type AlbumRow = DataKonten["album"][number];
type FotoRow = DataKonten["photos"][number];

function formAlbum(row: AlbumRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.nama ?? ""}
        label="Nama album"
        maxLength={150}
        name="namaAlbum"
        required
      />
      <FormField
        defaultValue={row?.slug ?? ""}
        helpText={row ? undefined : "Kosongkan untuk dibuat otomatis dari nama album."}
        label="Slug"
        maxLength={150}
        name="slugAlbum"
        required={row !== null}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        name="keteranganAlbum"
        rows={2}
      />
      {row ? (
        <>
          <FormField
            accept="image/jpeg,image/png,image/webp,image/gif"
            label="Ganti sampul"
            name="sampulAlbum"
            type="file"
          />
          <FormField
            defaultValue={row.urut}
            label="Urutan"
            min={0}
            name="urutAlbum"
            type="number"
          />
          <div className="modul-form-checks form-field-full">
            <label>
              <input defaultChecked={row.aktif} name="aktifAlbum" type="checkbox" value="true" />{" "}
              Album aktif
            </label>
            <input name="aktifAlbum" type="hidden" value="false" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function formFoto(row: FotoRow | null, album: AlbumRow[]) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.albumId?.toString() ?? ""}
        kind="select"
        label="Album"
        name="albumId"
        options={
          row
            ? album.map((item) => ({ value: String(item.id), label: item.nama }))
            : [
                { value: "", label: "Pilih album", disabled: true },
                ...album.map((item) => ({ value: String(item.id), label: item.nama })),
              ]
        }
        required={row === null}
      />
      <FormField
        defaultValue={row?.judul ?? ""}
        label="Judul foto"
        maxLength={150}
        name="judulFoto"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        name="keteranganFoto"
        rows={2}
      />
      <FormField
        accept="image/jpeg,image/png,image/webp,image/gif"
        label={row ? "Ganti foto" : "File foto"}
        name="gambar"
        required={row === null}
        type="file"
      />
      {row ? (
        <>
          <FormField defaultValue={row.urut} label="Urutan" min={0} name="urutFoto" type="number" />
          <div className="modul-form-checks form-field-full">
            <label>
              <input defaultChecked={row.aktif} name="aktifFoto" type="checkbox" value="true" />{" "}
              Foto aktif
            </label>
            <input name="aktifFoto" type="hidden" value="false" />
            <label>
              <input defaultChecked={row.slider} name="sliderFoto" type="checkbox" value="true" />{" "}
              Tampilkan sebagai slider
            </label>
            <input name="sliderFoto" type="hidden" value="false" />
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Bagian album dan foto galeri Website. */
export function BagianGaleri({ izin, album, photos }: Props) {
  return (
    <>
      <TableCard
        title="Album Galeri"
        description={`${album.length} album · ${photos.length} foto`}
        actions={
          izin.galeri.tambah ? (
            <div className="website-row-actions">
              <FormDialog
                aksi={tambahAlbumWebsiteFormAction}
                deskripsi="Album baru akan muncul sebagai kategori foto galeri desa."
                judul="Tambah album"
                label="Tambah album"
                labelSimpan="Buat album"
              >
                {formAlbum(null)}
              </FormDialog>
              {album.length > 0 ? (
                <FormDialog
                  aksi={unggahFotoWebsiteFormAction}
                  deskripsi="Foto yang diunggah akan masuk ke album terpilih."
                  judul="Upload foto"
                  label="Upload foto"
                  labelSimpan="Upload foto"
                  varian="secondary"
                >
                  {formFoto(null, album)}
                </FormDialog>
              ) : null}
            </div>
          ) : undefined
        }
      >
        <div className="website-table-wrap">
          {album.length === 0 ? (
            <p className="modul-empty">Belum ada album galeri.</p>
          ) : (
            <TableScroll>
              <Table className="website-table">
                <THead>
                  <Row>
                    <HeaderCell>Album</HeaderCell>
                    <HeaderCell>Jumlah Foto</HeaderCell>
                    <HeaderCell>Aksi</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {album.map((item) => (
                    <Row key={item.id}>
                      <Cell>
                        <strong>{item.nama}</strong>
                        <small>{item.keterangan ?? `/${item.slug}`}</small>
                      </Cell>
                      <Cell>{item.jumlahFoto} foto</Cell>
                      <Cell>
                        <div className="website-row-actions">
                          {izin.galeri.ubah && (
                            <FormDialog
                              aksi={ubahAlbumWebsiteFormAction}
                              deskripsi={`Ubah album "${item.nama}".`}
                              judul="Ubah album"
                              label="Ubah"
                              labelSimpan="Simpan"
                              varian="secondary"
                            >
                              {formAlbum(item)}
                            </FormDialog>
                          )}
                          {izin.galeri.hapus && (
                            <DialogHapusForm
                              aksi={hapusAlbumGaleriWebsiteAction}
                              id={item.id}
                              judul={`Hapus album "${item.nama}"?`}
                              keterangan="Album hanya dapat dihapus bila tidak lagi berisi foto."
                              labelAksi="Hapus album"
                            />
                          )}
                        </div>
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          )}
        </div>
      </TableCard>
      <TableCard title="Foto Galeri" description={`${photos.length} foto terunggah.`}>
        <div className="website-table-wrap">
          {photos.length === 0 ? (
            <p className="modul-empty">Belum ada foto yang diunggah.</p>
          ) : (
            <TableScroll>
              <Table className="website-table">
                <THead>
                  <Row>
                    <HeaderCell>Foto</HeaderCell>
                    <HeaderCell>Album</HeaderCell>
                    <HeaderCell>Aksi</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {photos.map((photo) => (
                    <Row key={photo.id}>
                      <Cell>
                        <div className="website-content-title">
                          <Image
                            src={`/api/publik/media/${photo.gambar.split("/").map(encodeURIComponent).join("/")}`}
                            alt={photo.judul ?? "Foto galeri"}
                            width={64}
                            height={48}
                            unoptimized
                          />
                          <div>
                            <strong>{photo.judul ?? "Foto tanpa judul"}</strong>
                          </div>
                        </div>
                      </Cell>
                      <Cell>
                        {album.find((item) => item.id === photo.albumId)?.nama ?? "Foto lepas"}
                      </Cell>
                      <Cell>
                        <div className="website-row-actions">
                          {izin.galeri.ubah && (
                            <FormDialog
                              aksi={ubahFotoGaleriWebsiteFormAction}
                              deskripsi={`Ubah foto "${photo.judul ?? "tanpa judul"}".`}
                              judul="Ubah foto"
                              label="Ubah"
                              labelSimpan="Simpan"
                              varian="secondary"
                            >
                              {formFoto(photo, album)}
                            </FormDialog>
                          )}
                          {izin.galeri.hapus && (
                            <DialogHapusForm
                              aksi={hapusFotoGaleriWebsiteAction}
                              id={photo.id}
                              judul={`Hapus foto "${photo.judul ?? "tanpa judul"}"?`}
                              keterangan="Foto beserta berkas gambarnya akan dihapus permanen dari galeri desa."
                              labelAksi="Hapus foto"
                            />
                          )}
                        </div>
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          )}
        </div>
      </TableCard>
    </>
  );
}
