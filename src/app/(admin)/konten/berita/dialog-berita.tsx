"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { FormDialog } from "@/features/pemerintahan/presentation/form-dialog";

import { simpanBeritaFormAction } from "./actions";
import { EditorBerita } from "./editor-berita";

export interface KategoriPilihan {
  id: number;
  nama: string;
}

export interface BeritaDialogItem {
  id: number;
  judul: string;
  slug: string;
  ringkasan: string | null;
  isi: string;
  gambar: string | null;
  kategoriId: number | null;
  status: string;
  terbitPada: Date | null;
  headline: boolean;
  slider: boolean;
}

const tanggalInput = (value: Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const urlGambar = (gambar: string | null) =>
  gambar ? `/api/publik/media/${gambar.split("/").map(encodeURIComponent).join("/")}` : null;

/** Inisial judul untuk kartu pratinjau saat berita belum punya sampul. */
const inisial = (judul: string) =>
  judul
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0])
    .join("")
    .toUpperCase();

/**
 * Tombol pembuka modal berita.
 *
 * `item` kosong berarti tambah berita baru; bila diisi, form terisi data berita
 * tersebut dan disimpan lewat aksi ubah.
 */
export function DialogBerita({
  item = null,
  kategori,
}: {
  item?: BeritaDialogItem | null;
  kategori: readonly KategoriPilihan[];
}) {
  const sampul = urlGambar(item?.gambar ?? null);
  const wadahRef = useRef<HTMLDivElement>(null);

  // Pratinjau kartu mengikuti isian tanpa membuat input menjadi controlled,
  // supaya `form.reset()` setelah simpan tetap mengosongkan form.
  const [judul, setJudul] = useState(item?.judul ?? "");
  const [ringkasan, setRingkasan] = useState(item?.ringkasan ?? "");
  const [kategoriId, setKategoriId] = useState(item?.kategoriId?.toString() ?? "");
  const [status, setStatus] = useState(item?.status ?? "draft");

  useEffect(() => {
    const form = wadahRef.current?.closest("form");
    if (!form) return;
    const pulihkan = () => {
      setJudul(item?.judul ?? "");
      setRingkasan(item?.ringkasan ?? "");
      setKategoriId(item?.kategoriId?.toString() ?? "");
      setStatus(item?.status ?? "draft");
    };
    form.addEventListener("reset", pulihkan);
    return () => form.removeEventListener("reset", pulihkan);
  }, [item]);

  const namaKategori = kategoriId
    ? (kategori.find((pilihan) => pilihan.id.toString() === kategoriId)?.nama ?? "Umum")
    : "Umum";
  const tayang = status === "published";

  return (
    <FormDialog
      aksi={simpanBeritaFormAction}
      deskripsi={item ? "Perbarui berita." : "Simpan sebagai draft atau langsung tayang."}
      judul={item ? `Ubah Berita: ${item.judul}` : "Tulis Berita"}
      kelasTombol={item ? "button button-ghost" : "button button-primary"}
      label={item ? "Ubah" : "＋ Tulis Berita"}
      labelSimpan={item ? "Simpan Perubahan" : "Simpan Berita"}
    >
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <div className="berita-form" ref={wadahRef}>
        <section aria-label="Konten berita" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ▤
            </span>
            <div>
              <h3>Konten</h3>
              <p>Judul, alamat, dan ringkasan.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-penuh">
              Judul *
              <input
                defaultValue={item?.judul ?? ""}
                maxLength={200}
                name="judulBerita"
                onChange={(event) => setJudul(event.target.value)}
                required
              />
            </label>
            <label className="berita-field is-setengah">
              Slug
              <input
                defaultValue={item?.slug ?? ""}
                maxLength={190}
                name="slugBerita"
                placeholder="dibuat dari judul"
              />
            </label>
            <label className="berita-field is-setengah">
              Kategori
              <select
                defaultValue={item?.kategoriId?.toString() ?? ""}
                name="kategoriId"
                onChange={(event) => setKategoriId(event.target.value)}
              >
                <option value="">Umum</option>
                {kategori.map((kategoriItem) => (
                  <option key={kategoriItem.id} value={kategoriItem.id}>
                    {kategoriItem.nama}
                  </option>
                ))}
              </select>
            </label>
            <label className="berita-field is-penuh">
              Ringkasan
              <textarea
                defaultValue={item?.ringkasan ?? ""}
                maxLength={500}
                name="ringkasanBerita"
                onChange={(event) => setRingkasan(event.target.value)}
                placeholder="Satu atau dua kalimat untuk kartu berita."
                rows={2}
              />
            </label>
          </div>
          <div className="berita-live">
            <span className="berita-live-label">Pratinjau kartu</span>
            <div className="berita-live-kartu">
              <span aria-hidden className="berita-thumb">
                {sampul ? (
                  <Image alt="" height={46} src={sampul} unoptimized width={46} />
                ) : judul.trim() ? (
                  inisial(judul)
                ) : (
                  "▤"
                )}
              </span>
              <div className="berita-live-isi">
                <strong className={`berita-live-judul ${judul.trim() ? "" : "is-kosong"}`}>
                  {judul.trim() || "Judul berita"}
                </strong>
                <p className={`berita-live-ringkas ${ringkasan.trim() ? "" : "is-kosong"}`}>
                  {ringkasan.trim() || "Ringkasan tampil di bawah judul."}
                </p>
                <div className="berita-live-meta">
                  <span className="berita-kategori">{namaKategori}</span>
                  <span className={`berita-status ${tayang ? "is-tayang" : "is-draft"}`}>
                    <i aria-hidden="true" />
                    {tayang ? "Tayang" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Penerbitan berita" className="berita-form-bagian is-ungu">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ◔
            </span>
            <div>
              <h3>Penerbitan</h3>
              <p>Status, tanggal, dan sampul.</p>
            </div>
          </div>
          <div className="berita-form-grid">
            <label className="berita-field is-setengah">
              Status
              <select
                defaultValue={item?.status ?? "draft"}
                name="statusBerita"
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Tayang</option>
              </select>
            </label>
            <label className="berita-field is-setengah">
              Tanggal terbit
              <input
                defaultValue={tanggalInput(item?.terbitPada ?? null)}
                name="terbitPada"
                type="date"
              />
            </label>
            <label className="berita-field is-penuh">
              {item ? "Ganti sampul" : "Sampul"}
              <span className="berita-form-sampul">
                <span aria-hidden="true" className="berita-form-sampul-pratinjau">
                  {sampul ? <Image alt="" height={40} src={sampul} unoptimized width={40} /> : "▤"}
                </span>
                <span className="berita-form-sampul-isi">
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    name="gambarBerita"
                    type="file"
                  />
                  <small>JPG, PNG, WebP, GIF · maks. 5 MB</small>
                </span>
              </span>
            </label>
          </div>
        </section>

        <section aria-label="Isi berita" className="berita-form-bagian">
          <div className="berita-form-kepala">
            <span aria-hidden="true" className="berita-form-ikon">
              ✎
            </span>
            <div>
              <h3>Isi Berita</h3>
              <p>Gunakan toolbar untuk memformat teks.</p>
            </div>
          </div>
          <div className="berita-editor-label">
            <span>Isi berita *</span>
            <EditorBerita defaultValue={item?.isi ?? ""} name="isiBerita" />
          </div>
        </section>

        <section aria-label="Tampilan berita" className="berita-form-bagian">
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
              <input defaultChecked={item?.headline ?? false} name="headline" type="checkbox" />
              <span>
                <strong>Headline</strong>
                <small>Tampil di sorotan beranda</small>
              </span>
            </label>
            <label className="berita-cek-kartu">
              <input defaultChecked={item?.slider ?? false} name="tampilSlider" type="checkbox" />
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
