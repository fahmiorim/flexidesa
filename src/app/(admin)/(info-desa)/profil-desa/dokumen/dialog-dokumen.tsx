"use client";

import { FormDialog } from "@/components/ui/form-dialog";

import { simpanDokumenFormAction } from "./actions";

export interface DokumenDialogItem {
  id: number;
  nama: string;
  slug: string;
  kategori: string;
  jenis: string | null;
  nomor: string | null;
  tahun: number | null;
  keterangan: string | null;
  tautan: string | null;
  aktif: boolean;
}

const KATEGORI = [
  { value: "informasi_publik", label: "Informasi Publik" },
  { value: "produk_hukum", label: "Produk Hukum" },
  { value: "wilayah", label: "Wilayah" },
  { value: "lainnya", label: "Lainnya" },
];

/**
 * Tombol pembuka modal dokumen.
 *
 * `item` kosong berarti tambah dokumen baru; bila diisi, form terisi data
 * dokumen tersebut dan disimpan lewat aksi ubah.
 */
export function DialogDokumen({ item = null }: { item?: DokumenDialogItem | null }) {
  return (
    <FormDialog
      aksi={simpanDokumenFormAction}
      deskripsi={item ? "Perbarui dokumen." : "Unggah berkas atau isi tautan."}
      judul={item ? `Ubah Dokumen: ${item.nama}` : "Tambah Dokumen"}
      varian={item ? "ghost" : "primary"}
      label={item ? "Ubah" : "＋ Tambah Dokumen"}
      labelSimpan={item ? "Simpan Perubahan" : "Simpan Dokumen"}
    >
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <div className="berita-form">
        <section aria-label="Data dokumen" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ▤
            </span>
            <div>
              <h3>Data Dokumen</h3>
              <p>Nama, kategori, dan nomor.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-penuh">
              Nama dokumen *
              <input
                defaultValue={item?.nama ?? ""}
                maxLength={200}
                name="nama"
                placeholder="Contoh: Peraturan Desa tentang APBDes"
                required
              />
            </label>
            <label className="berita-field is-setengah">
              Slug
              <input
                defaultValue={item?.slug ?? ""}
                maxLength={190}
                name="slug"
                placeholder="dibuat dari nama"
              />
            </label>
            <label className="berita-field is-setengah">
              Kategori
              <select defaultValue={item?.kategori ?? "informasi_publik"} name="kategori">
                {KATEGORI.map((kategori) => (
                  <option key={kategori.value} value={kategori.value}>
                    {kategori.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="berita-field is-setengah">
              Jenis
              <input
                defaultValue={item?.jenis ?? ""}
                maxLength={50}
                name="jenis"
                placeholder="Peraturan Desa, Laporan..."
              />
            </label>
            <label className="berita-field is-setengah">
              Nomor
              <input defaultValue={item?.nomor ?? ""} maxLength={100} name="nomor" />
            </label>
            <label className="berita-field is-setengah">
              Tahun
              <input
                defaultValue={item?.tahun ?? ""}
                max={2200}
                min={1900}
                name="tahun"
                type="number"
              />
            </label>
            <label className="berita-field is-penuh">
              Keterangan
              <textarea
                defaultValue={item?.keterangan ?? ""}
                maxLength={10000}
                name="keterangan"
                rows={2}
              />
            </label>
          </div>
        </section>

        <section aria-label="Berkas dokumen" className="berita-form-bagian is-ungu">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ◔
            </span>
            <div>
              <h3>Berkas</h3>
              <p>Unggah PDF/gambar atau tautan eksternal.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-penuh">
              {item ? "Ganti berkas" : "Berkas (PDF / gambar)"}
              <input
                accept="application/pdf,image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                name="berkas"
                type="file"
              />
              <small>PDF, JPG, PNG, WebP, GIF, SVG · maks. 5 MB</small>
            </label>
            <label className="berita-field is-penuh">
              Atau tautan eksternal
              <input
                defaultValue={item?.tautan ?? ""}
                name="tautan"
                placeholder="https://..."
                type="url"
              />
            </label>
          </div>
          <div className="berita-form-cek">
            <label className="berita-cek-kartu">
              <input defaultChecked={item?.aktif ?? true} name="aktif" type="checkbox" />
              <span>
                <strong>Publik</strong>
                <small>Tampil di website desa</small>
              </span>
            </label>
          </div>
        </section>
      </div>
    </FormDialog>
  );
}
