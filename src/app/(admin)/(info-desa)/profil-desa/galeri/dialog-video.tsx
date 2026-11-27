"use client";

import { FormDialog } from "@/components/ui/form-dialog";

import { simpanVideoFormAction } from "./actions";

const tanggalHariIni = () => {
  const sekarang = new Date();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const tanggal = String(sekarang.getDate()).padStart(2, "0");
  return `${sekarang.getFullYear()}-${bulan}-${tanggal}`;
};

/** Tombol pembuka modal tambah video. */
export function DialogVideo() {
  return (
    <FormDialog
      aksi={simpanVideoFormAction}
      deskripsi="Simpan tautan YouTube/Vimeo."
      judul="Tambah Video"
      varian="primary"
      label="＋ Tambah Video"
      labelSimpan="Simpan Video"
    >
      <div className="berita-form">
        <section aria-label="Data video" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ▷
            </span>
            <div>
              <h3>Video</h3>
              <p>Judul, tautan, dan keterangan.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-penuh">
              Judul video *
              <input
                maxLength={150}
                name="judul"
                placeholder="Contoh: Dokumentasi pembangunan jalan"
                required
              />
            </label>
            <label className="berita-field is-penuh">
              URL YouTube / Vimeo *
              <input
                name="url"
                placeholder="https://www.youtube.com/watch?v=..."
                required
                type="url"
              />
            </label>
            <label className="berita-field is-penuh">
              Keterangan
              <textarea maxLength={2000} name="keterangan" rows={2} />
            </label>
            <label className="berita-field is-setengah">
              Tanggal publikasi
              <input defaultValue={tanggalHariIni()} name="publishedAt" type="date" />
            </label>
          </div>
        </section>
      </div>
    </FormDialog>
  );
}
