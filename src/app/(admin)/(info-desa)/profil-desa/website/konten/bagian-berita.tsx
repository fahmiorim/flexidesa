import Image from "next/image";

import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { type getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import {
  hapusBeritaWebsiteAction,
  hapusKategoriBeritaWebsiteAction,
  ubahStatusBeritaWebsiteAction,
} from "../actions";
import {
  tambahBeritaFormAction,
  tambahKategoriBeritaFormAction,
  ubahBeritaFormAction,
  ubahKategoriBeritaFormAction,
} from "../form-actions";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  berita: DataKonten["berita"];
  categories: DataKonten["categories"];
  tayang: DataKonten["berita"];
  draft: DataKonten["berita"];
  formatTanggal: (value: Date | string | null) => string;
}

type BeritaRow = DataKonten["berita"][number];
type KategoriRow = DataKonten["categories"][number];

function formKategori(row: KategoriRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.nama ?? ""}
        label="Nama kategori"
        maxLength={100}
        name="namaKategori"
        required
      />
      <FormField
        defaultValue={row?.slug ?? ""}
        helpText={row ? undefined : "Kosongkan untuk dibuat otomatis dari nama kategori."}
        label="Slug"
        maxLength={100}
        name="slugKategori"
        required={row !== null}
      />
    </div>
  );
}

function formBerita(row: BeritaRow | null, categories: KategoriRow[]) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.judul ?? ""}
        label="Judul"
        maxLength={200}
        name="judulBerita"
        required
      />
      <FormField
        defaultValue={row?.slug ?? ""}
        helpText={row ? undefined : "Kosongkan untuk dibuat otomatis dari judul."}
        label="Slug"
        maxLength={190}
        name="slugBerita"
        placeholder={row ? undefined : "dibuat-otomatis"}
        required={row !== null}
      />
      <FormField
        defaultValue={row?.kategoriId?.toString() ?? ""}
        kind="select"
        label="Kategori"
        name="kategoriId"
        options={[
          { value: "", label: "Umum" },
          ...categories.map((item) => ({ value: String(item.id), label: item.nama })),
        ]}
      />
      <FormField
        defaultValue={row?.status ?? "draft"}
        kind="select"
        label="Status"
        name="statusBerita"
        options={[
          { value: "draft", label: row ? "Draft" : "Simpan sebagai draft" },
          { value: "published", label: "Tayang" },
        ]}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.ringkasan ?? ""}
        kind="textarea"
        label="Ringkasan"
        maxLength={500}
        name="ringkasanBerita"
        rows={2}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.isi ?? ""}
        kind="textarea"
        label="Isi berita (HTML dasar)"
        name="isiBerita"
        placeholder="<p>Tulis isi berita...</p>"
        required
        rows={6}
      />
      <FormField
        accept="image/jpeg,image/png,image/webp,image/gif"
        label={row ? "Ganti gambar" : "Gambar sampul"}
        name="gambarBerita"
        type="file"
      />
      <div className="modul-form-checks form-field-full">
        <label>
          <input defaultChecked={row?.headline ?? false} name="headline" type="checkbox" /> Jadikan
          headline
        </label>
        <label>
          <input defaultChecked={row?.slider ?? false} name="tampilSlider" type="checkbox" />{" "}
          Tampilkan sebagai slider berita
        </label>
      </div>
    </div>
  );
}

/** Bagian berita dan pengumuman Website. */
export function BagianBerita({ izin, berita, categories, tayang, draft, formatTanggal }: Props) {
  return (
    <>
      <TableCard
        title="Berita & Pengumuman"
        description={`${tayang.length} tayang · ${draft.length} draft · ${categories.length} kategori`}
        actions={
          izin.berita.tambah ? (
            <FormDialog
              aksi={tambahBeritaFormAction}
              deskripsi="Berita yang ditayangkan akan muncul di halaman publik desa."
              judul="Tulis berita"
              label="Tulis berita"
              labelSimpan="Simpan berita"
            >
              {formBerita(null, categories)}
            </FormDialog>
          ) : undefined
        }
      >
        <div className="website-table-wrap">
          <TableScroll>
            <Table className="website-table website-table-news">
              <THead>
                <Row>
                  <HeaderCell>Judul</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Dilihat</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {berita.map((item) => (
                  <Row key={item.id}>
                    <Cell>
                      <div className="website-content-title">
                        {item.gambar ? (
                          <Image
                            src={`/api/publik/media/${item.gambar.split("/").map(encodeURIComponent).join("/")}`}
                            alt=""
                            width={58}
                            height={42}
                            unoptimized
                          />
                        ) : (
                          <span className="website-image-placeholder">FD</span>
                        )}
                        <div>
                          <strong>{item.judul}</strong>
                          <small>
                            /{item.slug} · {formatTanggal(item.terbitPada)}
                          </small>
                        </div>
                      </div>
                    </Cell>
                    <Cell>{item.kategori ?? "Umum"}</Cell>
                    <Cell>
                      <span
                        className={
                          item.status === "published"
                            ? "website-status"
                            : "website-status website-status-off"
                        }
                      >
                        {item.status === "published" ? "Tayang" : "Draft"}
                      </span>
                    </Cell>
                    <Cell>{item.hit.toLocaleString("id-ID")}</Cell>
                    <Cell>
                      {(izin.berita.ubah || izin.berita.hapus) && (
                        <div className="website-row-actions">
                          {izin.berita.ubah && (
                            <FormDialog
                              aksi={ubahBeritaFormAction}
                              deskripsi={`Ubah berita "${item.judul}".`}
                              judul="Ubah berita"
                              label="Ubah"
                              labelSimpan="Simpan perubahan"
                              varian="secondary"
                            >
                              {formBerita(item, categories)}
                            </FormDialog>
                          )}
                          {izin.berita.ubah && (
                            <form action={ubahStatusBeritaWebsiteAction}>
                              <input type="hidden" name="id" value={item.id} />
                              <input
                                type="hidden"
                                name="status"
                                value={item.status === "published" ? "draft" : "published"}
                              />
                              <Button size="sm" type="submit" variant="secondary">
                                {item.status === "published" ? "Jadikan Draft" : "Publikasikan"}
                              </Button>
                            </form>
                          )}
                          {izin.berita.hapus && (
                            <DialogHapusForm
                              aksi={hapusBeritaWebsiteAction}
                              id={item.id}
                              judul={`Hapus berita "${item.judul}"?`}
                              keterangan="Berita beserta gambarnya akan dihapus permanen dari website desa."
                              labelAksi="Hapus berita"
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
          {berita.length === 0 ? (
            <p className="modul-empty">Belum ada berita. Buat publikasi pertama desa.</p>
          ) : null}
        </div>
      </TableCard>
      <TableCard
        title="Kategori Berita"
        description={`${categories.length} kategori terdaftar.`}
        actions={
          izin.berita.tambah ? (
            <FormDialog
              aksi={tambahKategoriBeritaFormAction}
              deskripsi="Kategori dipakai untuk mengelompokkan berita dan pengumuman."
              judul="Tambah kategori berita"
              label="Tambah kategori"
              labelSimpan="Tambah kategori"
            >
              {formKategori(null)}
            </FormDialog>
          ) : undefined
        }
      >
        <div className="website-table-wrap">
          {categories.length === 0 ? (
            <p className="modul-empty">Belum ada kategori berita.</p>
          ) : (
            <TableScroll>
              <Table className="website-table">
                <THead>
                  <Row>
                    <HeaderCell>Nama Kategori</HeaderCell>
                    <HeaderCell>Slug</HeaderCell>
                    <HeaderCell>Aksi</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {categories.map((category) => (
                    <Row key={category.id}>
                      <Cell>
                        <strong>{category.nama}</strong>
                      </Cell>
                      <Cell>/{category.slug}</Cell>
                      <Cell>
                        {(izin.berita.ubah || izin.berita.hapus) && (
                          <div className="website-row-actions">
                            {izin.berita.ubah && (
                              <FormDialog
                                aksi={ubahKategoriBeritaFormAction}
                                deskripsi={`Ubah kategori "${category.nama}".`}
                                judul="Ubah kategori berita"
                                label="Ubah"
                                labelSimpan="Simpan"
                                varian="secondary"
                              >
                                {formKategori(category)}
                              </FormDialog>
                            )}
                            {izin.berita.hapus && (
                              <DialogHapusForm
                                aksi={hapusKategoriBeritaWebsiteAction}
                                id={category.id}
                                judul={`Hapus kategori "${category.nama}"?`}
                                keterangan="Kategori hanya dapat dihapus bila tidak lagi dipakai berita lain."
                                labelAksi="Hapus kategori"
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
    </>
  );
}
