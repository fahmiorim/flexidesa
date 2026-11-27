"use client";

import { FormDialog } from "@/components/ui/form-dialog";

import { simpanAlbumFormAction } from "./actions";

export interface AlbumDialogItem {
  id: number;
  nama: string;
  keterangan: string | null;
  kategori: string | null;
  publishedAt: Date | null;
  urut: number;
  aktif: boolean;
}

const tanggalInput = (value: Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

/**
 * Tombol pembuka modal album.
 *
 * `item` kosong berarti tambah album baru; bila diisi, form terisi data album
 * tersebut dan disimpan lewat aksi ubah.
 */
export function DialogAlbum({ item = null }: { item?: AlbumDialogItem | null }) {
  return (
    <FormDialog
      aksi={simpanAlbumFormAction}
      deskripsi={item ? "Perbarui album." : "Album baru langsung dapat diisi foto."}
      judul={item ? `Ubah Album: ${item.nama}` : "Tambah Album"}
      varian={item ? "ghost" : "primary"}
      label={item ? "Ubah" : "＋ Tambah Album"}
      labelSimpan={item ? "Simpan Perubahan" : "Simpan Album"}
    >
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <div className="berita-form">
        <section aria-label="Data album" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ▧
            </span>
            <div>
              <h3>Data Album</h3>
              <p>Nama, keterangan, dan kategori.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-penuh">
              Nama album *
              <input
                defaultValue={item?.nama ?? ""}
                maxLength={150}
                name="nama"
                placeholder="Contoh: Gotong royong"
                required
              />
            </label>
            <label className="berita-field is-penuh">
              Keterangan
              <textarea
                defaultValue={item?.keterangan ?? ""}
                maxLength={2000}
                name="keterangan"
                placeholder="Satu atau dua kalimat tentang album."
                rows={2}
              />
            </label>
            <label className="berita-field is-setengah">
              Kategori
              <input
                defaultValue={item?.kategori ?? ""}
                maxLength={80}
                name="kategori"
                placeholder="Contoh: Pembangunan"
              />
            </label>
            <label className="berita-field is-setengah">
              Urutan
              <input defaultValue={item?.urut ?? 0} max={999} min={0} name="urut" type="number" />
            </label>
          </div>
        </section>

        <section aria-label="Penerbitan album" className="berita-form-bagian is-ungu">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ◔
            </span>
            <div>
              <h3>Penerbitan</h3>
              <p>Tanggal dan status tayang.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-setengah">
              Tanggal publikasi
              <input
                defaultValue={tanggalInput(item?.publishedAt ?? null)}
                name="publishedAt"
                type="date"
              />
            </label>
            <div className="berita-form-cek is-penuh">
              <label className="berita-cek-kartu">
                <input defaultChecked={item?.aktif ?? true} name="aktif" type="checkbox" />
                <span>
                  <strong>Tayang</strong>
                  <small>Tampil di website desa</small>
                </span>
              </label>
            </div>
          </div>
        </section>
      </div>
    </FormDialog>
  );
}
