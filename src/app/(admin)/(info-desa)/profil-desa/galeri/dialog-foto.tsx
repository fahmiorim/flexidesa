"use client";

import Image from "next/image";

import { FormDialog } from "@/components/ui/form-dialog";

import { simpanFotoFormAction } from "./actions";

export interface FotoDialogItem {
  id: number;
  gambar: string;
  judul: string | null;
  keterangan: string | null;
  urut: number;
  aktif: boolean;
  slider: boolean;
}

const urlGambar = (gambar: string) =>
  `/api/publik/media/${gambar.split("/").map(encodeURIComponent).join("/")}`;

/** Tombol pembuka modal ubah foto. */
export function DialogFoto({ item }: { item: FotoDialogItem }) {
  return (
    <FormDialog
      aksi={simpanFotoFormAction}
      deskripsi="Perbarui foto."
      judul="Ubah Foto"
      kelasTombol="button button-ghost"
      label="Ubah"
      labelSimpan="Simpan Perubahan"
    >
      <input name="id" type="hidden" value={item.id} />
      <div className="berita-form">
        <section aria-label="Foto" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ▣
            </span>
            <div>
              <h3>Foto</h3>
              <p>Judul dan keterangan foto.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <div className="berita-field is-penuh">
              <Image
                alt={item.judul ?? ""}
                height={120}
                src={urlGambar(item.gambar)}
                unoptimized
                width={180}
              />
            </div>
            <label className="berita-field is-penuh">
              Judul
              <input
                defaultValue={item.judul ?? ""}
                maxLength={150}
                name="judul"
                placeholder="Judul foto"
              />
            </label>
            <label className="berita-field is-penuh">
              Keterangan
              <textarea
                defaultValue={item.keterangan ?? ""}
                maxLength={2000}
                name="keterangan"
                rows={2}
              />
            </label>
            <label className="berita-field is-setengah">
              Urutan
              <input defaultValue={item.urut} max={9999} min={0} name="urut" type="number" />
            </label>
          </div>
        </section>

        <section aria-label="Tampilan foto" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ★
            </span>
            <div>
              <h3>Tampilan</h3>
              <p>Penempatan di halaman publik.</p>
            </div>
          </div>
          <div className="berita-form-cek">
            <label className="berita-cek-kartu">
              <input defaultChecked={item.aktif} name="aktif" type="checkbox" />
              <span>
                <strong>Aktif</strong>
                <small>Tampil di album publik</small>
              </span>
            </label>
            <label className="berita-cek-kartu">
              <input defaultChecked={item.slider} name="slider" type="checkbox" />
              <span>
                <strong>Slider</strong>
                <small>Tampil di slider beranda</small>
              </span>
            </label>
          </div>
        </section>
      </div>
    </FormDialog>
  );
}
