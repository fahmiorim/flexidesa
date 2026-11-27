import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getWebsitePagesData } from "@/features/info-desa/publik/application/website-admin";

import {
  hapusHalamanWebsiteAction,
  hapusMenuWebsiteAction,
  hapusWidgetWebsiteAction,
  ubahMenuWebsiteAction,
  ubahStatusHalamanWebsiteAction,
  ubahStatusWidgetWebsiteAction,
} from "../actions";
import {
  tambahHalamanFormAction,
  tambahMenuFormAction,
  tambahWidgetFormAction,
  ubahHalamanFormAction,
  ubahMenuFormAction,
  ubahWidgetFormAction,
} from "../form-actions";
import { WebsiteAdminShell, WebsiteSection } from "../website-admin-shell";

export const metadata: Metadata = { title: "Halaman & Navigasi Website Desa" };

type DataHalaman = Awaited<ReturnType<typeof getWebsitePagesData>>;
type HalamanRow = DataHalaman["pages"][number];
type MenuRow = DataHalaman["menu"][number];
type WidgetRow = DataHalaman["widget"][number];

function formHalaman(row: HalamanRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.judul ?? ""}
        label="Judul halaman"
        maxLength={200}
        name="judul"
        required
      />
      <FormField
        defaultValue={row?.slug ?? ""}
        helpText={row ? undefined : "Kosongkan untuk dibuat otomatis dari judul."}
        label="Slug"
        maxLength={190}
        name="slug"
        required={row !== null}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.isi ?? ""}
        kind="textarea"
        label="Isi HTML"
        name="isi"
        required
        rows={5}
      />
      {row ? null : (
        <div className="modul-form-checks form-field-full">
          <label>
            <input defaultChecked name="aktif" type="checkbox" /> Tampilkan halaman
          </label>
        </div>
      )}
    </div>
  );
}

function formMenu(row: MenuRow | null, menu: MenuRow[]) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField
        defaultValue={row?.nama ?? ""}
        label="Nama menu"
        maxLength={50}
        name="nama"
        required
      />
      <FormField
        defaultValue={row?.link ?? ""}
        label="URL / Link"
        maxLength={500}
        name="link"
        placeholder="/desa/profil"
        required
      />
      <FormField
        defaultValue={row?.linkTipe ?? "internal"}
        kind="select"
        label="Tipe link"
        name="linkTipe"
        options={[
          { value: "internal", label: "Internal" },
          { value: "eksternal", label: "Eksternal" },
          { value: "halaman", label: "Halaman Statis" },
        ]}
      />
      <FormField
        defaultValue={row?.parentId?.toString() ?? ""}
        kind="select"
        label="Menu induk"
        name="parentId"
        options={[
          { value: "", label: "Menu Utama" },
          ...menu
            .filter((x) => x.parentId === null && x.id !== row?.id)
            .map((x) => ({ value: String(x.id), label: x.nama })),
        ]}
      />
    </div>
  );
}

function formWidget(row: WidgetRow | null) {
  return (
    <div className="modul-form-grid">
      {row ? <input name="id" type="hidden" value={row.id} /> : null}
      <FormField defaultValue={row?.judul ?? ""} label="Judul" maxLength={100} name="judulWidget" />
      <FormField
        defaultValue={String(row?.jenis ?? 3)}
        kind="select"
        label="Jenis"
        name="jenisWidget"
        options={[1, 2, 3, 4, 5, 6].map((value) => ({
          value: String(value),
          label: `Widget ${value}`,
        }))}
      />
      <FormField
        defaultValue={row?.urut ?? 0}
        label="Urutan"
        min={0}
        name="urutWidget"
        type="number"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={row?.isi ?? ""}
        kind="textarea"
        label="Isi"
        name="isiWidget"
        rows={3}
      />
      {row ? null : (
        <div className="modul-form-checks form-field-full">
          <label>
            <input defaultChecked name="aktifWidget" type="checkbox" /> Aktifkan widget
          </label>
        </div>
      )}
    </div>
  );
}

export default async function WebsitePagesPage() {
  const { menu, widget, pages, izin } = await getWebsitePagesData();
  return (
    <WebsiteAdminShell
      title="Halaman & Navigasi"
      description="Kelola halaman statis dan susunan menu yang tampil pada website desa."
    >
      {izin.halaman.baca && (
        <TableCard
          title="Daftar Halaman"
          description={`${pages.length} halaman statis.`}
          actions={
            izin.halaman.tambah ? (
              <FormDialog
                aksi={tambahHalamanFormAction}
                deskripsi="Halaman statis yang aktif akan dapat dibuka dari website desa."
                judul="Tambah halaman"
                label="Tambah halaman"
                labelSimpan="Tambah halaman"
              >
                {formHalaman(null)}
              </FormDialog>
            ) : undefined
          }
        >
          <div className="website-table-wrap">
            <TableScroll>
              <Table className="website-table website-table-pages">
                <THead>
                  <Row>
                    <HeaderCell>Judul Halaman</HeaderCell>
                    <HeaderCell>Alamat</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell>Aksi</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {pages.map((page) => (
                    <Row key={page.id}>
                      <Cell>
                        <strong>{page.judul}</strong>
                      </Cell>
                      <Cell>/{page.slug}</Cell>
                      <Cell>
                        <span
                          className={
                            page.aktif ? "website-status" : "website-status website-status-off"
                          }
                        >
                          {page.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </Cell>
                      <Cell>
                        {(izin.halaman.ubah || izin.halaman.hapus) && (
                          <div className="website-row-actions">
                            {izin.halaman.ubah && (
                              <FormDialog
                                aksi={ubahHalamanFormAction}
                                deskripsi={`Ubah halaman "${page.judul}".`}
                                judul="Ubah halaman"
                                label="Ubah"
                                labelSimpan="Simpan"
                                varian="secondary"
                              >
                                {formHalaman(page)}
                              </FormDialog>
                            )}
                            {izin.halaman.ubah && (
                              <form action={ubahStatusHalamanWebsiteAction}>
                                <input type="hidden" name="id" value={page.id} />
                                <input type="hidden" name="aktif" value={String(!page.aktif)} />
                                <Button size="sm" type="submit" variant="secondary">
                                  {page.aktif ? "Sembunyikan" : "Aktifkan"}
                                </Button>
                              </form>
                            )}
                            {izin.halaman.hapus && (
                              <DialogHapusForm
                                aksi={hapusHalamanWebsiteAction}
                                id={page.id}
                                judul={`Hapus halaman "${page.judul}"?`}
                                keterangan="Halaman akan dihapus permanen dari website desa."
                                labelAksi="Hapus halaman"
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
            {pages.length === 0 ? (
              <p className="modul-empty">
                Belum ada halaman statis. Halaman profil inti dikelola melalui data Profil Desa.
              </p>
            ) : null}
          </div>
        </TableCard>
      )}
      {izin.menu.baca && (
        <TableCard
          title="Menu Navigasi"
          description={`${menu.length} menu terdaftar.`}
          actions={
            izin.menu.tambah ? (
              <FormDialog
                aksi={tambahMenuFormAction}
                deskripsi="Menu baru akan muncul pada navigasi website desa."
                judul="Tambah menu"
                label="Tambah menu"
                labelSimpan="Tambah menu"
              >
                {formMenu(null, menu)}
              </FormDialog>
            ) : undefined
          }
        >
          <div className="website-table-wrap">
            <TableScroll>
              <Table className="website-table website-table-menu">
                <THead>
                  <Row>
                    <HeaderCell>Nama Menu</HeaderCell>
                    <HeaderCell>Link</HeaderCell>
                    <HeaderCell>Status</HeaderCell>
                    <HeaderCell>Aksi</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {menu.map((item) => (
                    <Row key={item.id}>
                      <Cell>
                        <strong>{item.nama}</strong>
                        {item.parentId ? <small>Submenu · induk #{item.parentId}</small> : null}
                      </Cell>
                      <Cell className="website-cell-link">{item.link}</Cell>
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
                        {(izin.menu.ubah || izin.menu.hapus) && (
                          <div className="website-row-actions">
                            {izin.menu.ubah && (
                              <FormDialog
                                aksi={ubahMenuFormAction}
                                deskripsi={`Ubah menu "${item.nama}".`}
                                judul="Ubah menu"
                                label="Ubah"
                                labelSimpan="Simpan"
                                varian="secondary"
                              >
                                {formMenu(item, menu)}
                              </FormDialog>
                            )}
                            {izin.menu.ubah && (
                              <form action={ubahMenuWebsiteAction}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="aktif" value={String(!item.aktif)} />
                                <Button size="sm" type="submit" variant="secondary">
                                  {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                                </Button>
                              </form>
                            )}
                            {izin.menu.hapus && (
                              <DialogHapusForm
                                aksi={hapusMenuWebsiteAction}
                                id={item.id}
                                judul={`Hapus menu "${item.nama}"?`}
                                keterangan="Menu beserta turunannya akan dihapus dari navigasi website."
                                labelAksi="Hapus menu"
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
            {menu.length === 0 ? <p className="modul-empty">Belum ada menu navigasi.</p> : null}
          </div>
        </TableCard>
      )}
      {izin.widget.baca && (
        <TableCard
          title="Widget Website"
          description={`${widget.length} widget terdaftar.`}
          actions={
            izin.widget.tambah ? (
              <FormDialog
                aksi={tambahWidgetFormAction}
                deskripsi="Widget aktif akan tampil pada halaman website desa."
                judul="Tambah widget"
                label="Tambah widget"
                labelSimpan="Tambah widget"
              >
                {formWidget(null)}
              </FormDialog>
            ) : undefined
          }
        >
          <div className="website-table-wrap">
            {widget.length === 0 ? (
              <p className="modul-empty">Belum ada widget yang dikonfigurasi.</p>
            ) : (
              <TableScroll>
                <Table className="website-table">
                  <THead>
                    <Row>
                      <HeaderCell>Judul</HeaderCell>
                      <HeaderCell>Jenis</HeaderCell>
                      <HeaderCell>Urutan</HeaderCell>
                      <HeaderCell>Status</HeaderCell>
                      <HeaderCell>Aksi</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {widget.map((item) => (
                      <Row key={item.id}>
                        <Cell>
                          <strong>{item.judul ?? `Widget ${item.jenis}`}</strong>
                        </Cell>
                        <Cell>Widget {item.jenis}</Cell>
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
                          {(izin.widget.ubah || izin.widget.hapus) && (
                            <div className="website-row-actions">
                              {izin.widget.ubah && (
                                <FormDialog
                                  aksi={ubahWidgetFormAction}
                                  deskripsi={`Ubah widget "${item.judul ?? `Widget ${item.jenis}`}".`}
                                  judul="Ubah widget"
                                  label="Ubah"
                                  labelSimpan="Simpan"
                                  varian="secondary"
                                >
                                  {formWidget(item)}
                                </FormDialog>
                              )}
                              {izin.widget.ubah && (
                                <form action={ubahStatusWidgetWebsiteAction}>
                                  <input type="hidden" name="id" value={item.id} />
                                  <input type="hidden" name="aktif" value={String(!item.aktif)} />
                                  <Button size="sm" type="submit" variant="secondary">
                                    {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                                  </Button>
                                </form>
                              )}
                              {izin.widget.hapus && (
                                <DialogHapusForm
                                  aksi={hapusWidgetWebsiteAction}
                                  id={item.id}
                                  judul={`Hapus widget "${item.judul ?? `Widget ${item.jenis}`}"?`}
                                  keterangan="Widget akan dihapus permanen dari halaman website desa."
                                  labelAksi="Hapus widget"
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
      )}
      <WebsiteSection title="Tips Pengelolaan">
        <ul className="website-tips">
          <li>Gunakan judul menu yang singkat dan mudah dipahami.</li>
          <li>Pastikan tautan internal mengarah ke halaman yang tersedia.</li>
          <li>Nonaktifkan menu tanpa menghapusnya jika hanya ingin menyembunyikan sementara.</li>
        </ul>
      </WebsiteSection>
    </WebsiteAdminShell>
  );
}
