import Image from "next/image";

import { type getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import {
  hapusBeritaWebsiteAction,
  hapusKategoriBeritaWebsiteAction,
  tambahBeritaWebsiteAction,
  tambahKategoriBeritaWebsiteAction,
  ubahBeritaWebsiteAction,
  ubahKategoriBeritaWebsiteAction,
  ubahStatusBeritaWebsiteAction,
} from "../actions";
import { WebsiteSection } from "../website-admin-shell";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  berita: DataKonten["berita"];
  categories: DataKonten["categories"];
  tayang: DataKonten["berita"];
  draft: DataKonten["berita"];
  formatTanggal: (value: Date | string | null) => string;
}

/** Bagian berita dan pengumuman Website. */
export function BagianBerita({ izin, berita, categories, tayang, draft, formatTanggal }: Props) {
  return (
    <WebsiteSection
      title="Berita & Pengumuman"
      action={
        <span className="website-status">
          {tayang.length} tayang · {draft.length} draft
        </span>
      }
    >
      <div id="berita" className="website-table-wrap">
        <table className="website-table website-table-news">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Dilihat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {berita.map((item) => (
              <tr key={item.id}>
                <td>
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
                </td>
                <td>{item.kategori ?? "Umum"}</td>
                <td>
                  <span
                    className={
                      item.status === "published"
                        ? "website-status"
                        : "website-status website-status-off"
                    }
                  >
                    {item.status === "published" ? "Tayang" : "Draft"}
                  </span>
                </td>
                <td>{item.hit.toLocaleString("id-ID")}</td>
                <td>
                  {(izin.berita.ubah || izin.berita.hapus) && (
                    <div className="website-row-actions">
                      {izin.berita.ubah && (
                        <details>
                          <summary className="website-mini-button">Edit</summary>
                          <form action={ubahBeritaWebsiteAction} className="website-inline-form">
                            <input type="hidden" name="id" value={item.id} />
                            <label>
                              Judul
                              <input
                                name="judulBerita"
                                defaultValue={item.judul}
                                required
                                maxLength={200}
                              />
                            </label>
                            <label>
                              Slug
                              <input
                                name="slugBerita"
                                defaultValue={item.slug}
                                required
                                maxLength={190}
                              />
                            </label>
                            <label>
                              Kategori
                              <select
                                name="kategoriId"
                                defaultValue={item.kategoriId?.toString() ?? ""}
                              >
                                <option value="">Umum</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.nama}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Status
                              <select name="statusBerita" defaultValue={item.status}>
                                <option value="draft">Draft</option>
                                <option value="published">Tayang</option>
                              </select>
                            </label>
                            <label>
                              Ringkasan
                              <textarea
                                name="ringkasanBerita"
                                defaultValue={item.ringkasan ?? ""}
                              />
                            </label>
                            <label>
                              Isi berita (HTML)
                              <textarea
                                name="isiBerita"
                                defaultValue={item.isi}
                                rows={6}
                                required
                              />
                            </label>
                            <label>
                              Ganti gambar
                              <input
                                name="gambarBerita"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                              />
                            </label>
                            <label className="website-checkbox">
                              <input
                                type="checkbox"
                                name="headline"
                                defaultChecked={item.headline}
                              />{" "}
                              Headline
                            </label>
                            <label className="website-checkbox">
                              <input
                                type="checkbox"
                                name="tampilSlider"
                                defaultChecked={item.slider}
                              />{" "}
                              Tampilkan di slider
                            </label>
                            <button className="website-mini-button" type="submit">
                              Simpan Perubahan
                            </button>
                          </form>
                        </details>
                      )}
                      {izin.berita.ubah && (
                        <form action={ubahStatusBeritaWebsiteAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={item.status === "published" ? "draft" : "published"}
                          />
                          <button className="website-mini-button" type="submit">
                            {item.status === "published" ? "Jadikan Draft" : "Publikasikan"}
                          </button>
                        </form>
                      )}
                      {izin.berita.hapus && (
                        <form action={hapusBeritaWebsiteAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="website-mini-button is-danger" type="submit">
                            Hapus
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {berita.length === 0 ? (
          <p className="modul-empty">Belum ada berita. Buat publikasi pertama desa.</p>
        ) : null}
      </div>
      {izin.berita.tambah && (
        <form action={tambahKategoriBeritaWebsiteAction} className="website-inline-form">
          <strong>Kelola Kategori Berita</strong>
          <div className="website-form-grid">
            <label>
              Nama Kategori *<input name="namaKategori" required maxLength={100} />
            </label>
            <label>
              Slug
              <input name="slugKategori" maxLength={100} />
            </label>
          </div>
          <button className="website-mini-button" type="submit">
            Tambah Kategori
          </button>
        </form>
      )}
      <div className="website-list">
        {categories.map((category) => (
          <div className="website-list-row" key={category.id}>
            <strong>{category.nama}</strong>
            {(izin.berita.ubah || izin.berita.hapus) && (
              <div className="website-row-actions">
                {izin.berita.ubah && (
                  <details>
                    <summary className="website-mini-button">Edit</summary>
                    <form action={ubahKategoriBeritaWebsiteAction} className="website-inline-form">
                      <input type="hidden" name="id" value={category.id} />
                      <label>
                        Nama
                        <input
                          name="namaKategori"
                          defaultValue={category.nama}
                          required
                          maxLength={100}
                        />
                      </label>
                      <label>
                        Slug
                        <input
                          name="slugKategori"
                          defaultValue={category.slug}
                          required
                          maxLength={100}
                        />
                      </label>
                      <button className="website-mini-button" type="submit">
                        Simpan
                      </button>
                    </form>
                  </details>
                )}
                {izin.berita.hapus && (
                  <form action={hapusKategoriBeritaWebsiteAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <button className="website-mini-button is-danger" type="submit">
                      Hapus
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {izin.berita.tambah && (
        <form action={tambahBeritaWebsiteAction} className="website-inline-form" id="tambah-berita">
          <strong>＋ Tulis Berita / Pengumuman</strong>
          <div className="website-form-grid">
            <label>
              Judul *<input name="judulBerita" required maxLength={200} />
            </label>
            <label>
              Slug
              <input name="slugBerita" maxLength={190} placeholder="dibuat-otomatis" />
            </label>
            <label>
              Kategori
              <select name="kategoriId" defaultValue="">
                <option value="">Umum</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="statusBerita" defaultValue="draft">
                <option value="draft">Simpan sebagai draft</option>
                <option value="published">Publikasikan</option>
              </select>
            </label>
            <label className="span-two">
              Ringkasan
              <textarea name="ringkasanBerita" rows={2} maxLength={500} />
            </label>
            <label className="span-two">
              Isi Berita (HTML dasar) *
              <textarea
                name="isiBerita"
                rows={6}
                required
                placeholder="<p>Tulis isi berita...</p>"
              />
            </label>
            <label>
              Gambar sampul
              <input
                name="gambarBerita"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
            </label>
            <label className="website-checkbox">
              <input name="headline" type="checkbox" /> Jadikan headline
            </label>
            <label className="website-checkbox">
              <input name="tampilSlider" type="checkbox" /> Tampilkan sebagai slider berita
            </label>
          </div>
          <button className="website-button website-button-primary" type="submit">
            Simpan Berita
          </button>
        </form>
      )}
    </WebsiteSection>
  );
}
