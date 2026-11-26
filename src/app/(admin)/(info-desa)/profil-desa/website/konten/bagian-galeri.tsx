import Image from "next/image";

import { type getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import {
  hapusAlbumGaleriWebsiteAction,
  hapusFotoGaleriWebsiteAction,
  tambahAlbumWebsiteAction,
  ubahAlbumWebsiteAction,
  ubahFotoGaleriWebsiteAction,
  unggahFotoWebsiteAction,
} from "../actions";
import { WebsiteSection } from "../website-admin-shell";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  album: DataKonten["album"];
  photos: DataKonten["photos"];
}

/** Bagian album dan foto galeri Website. */
export function BagianGaleri({ izin, album, photos }: Props) {
  return (
    <WebsiteSection title="Album Galeri">
      <div id="galeri" className="website-list">
        {album.map((item) => (
          <div className="website-list-row" key={item.id}>
            <div>
              <strong>{item.nama}</strong>
              <span>{item.keterangan ?? `/${item.slug}`}</span>
            </div>
            <div className="website-row-actions">
              <span className="website-count">{item.jumlahFoto} foto</span>
              {izin.galeri.ubah && (
                <details>
                  <summary className="website-mini-button">Edit</summary>
                  <form action={ubahAlbumWebsiteAction} className="website-inline-form">
                    <input type="hidden" name="id" value={item.id} />
                    <label>
                      Nama album
                      <input name="namaAlbum" defaultValue={item.nama} required maxLength={150} />
                    </label>
                    <label>
                      Slug
                      <input name="slugAlbum" defaultValue={item.slug} required maxLength={150} />
                    </label>
                    <label>
                      Keterangan
                      <textarea name="keteranganAlbum" defaultValue={item.keterangan ?? ""} />
                    </label>
                    <label>
                      Ganti sampul
                      <input
                        type="file"
                        name="sampulAlbum"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                      />
                    </label>
                    <label>
                      Urutan
                      <input type="number" min="0" name="urutAlbum" defaultValue={item.urut} />
                    </label>
                    <label className="website-checkbox">
                      <input
                        type="checkbox"
                        name="aktifAlbum"
                        value="true"
                        defaultChecked={item.aktif}
                      />{" "}
                      Album aktif
                    </label>
                    <input type="hidden" name="aktifAlbum" value="false" />
                    <button className="website-mini-button" type="submit">
                      Simpan
                    </button>
                  </form>
                </details>
              )}
              {izin.galeri.hapus && (
                <form action={hapusAlbumGaleriWebsiteAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="website-mini-button is-danger" type="submit">
                    Hapus Album
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {album.length === 0 ? <p className="modul-empty">Belum ada album galeri.</p> : null}
      </div>
      <div className="website-gallery-photos">
        {photos.map((photo) => (
          <article key={photo.id}>
            {
              <Image
                src={`/api/publik/media/${photo.gambar.split("/").map(encodeURIComponent).join("/")}`}
                alt={photo.judul ?? "Foto galeri"}
                width={88}
                height={66}
                unoptimized
              />
            }
            <div>
              <strong>{photo.judul ?? "Foto tanpa judul"}</strong>
              <small>{album.find((item) => item.id === photo.albumId)?.nama ?? "Foto lepas"}</small>
            </div>
            {izin.galeri.ubah && (
              <details>
                <summary className="website-mini-button">Edit</summary>
                <form action={ubahFotoGaleriWebsiteAction} className="website-inline-form">
                  <input type="hidden" name="id" value={photo.id} />
                  <label>
                    Album
                    <select name="albumId" defaultValue={photo.albumId ?? ""}>
                      {album.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nama}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Judul
                    <input name="judulFoto" defaultValue={photo.judul ?? ""} />
                  </label>
                  <label>
                    Keterangan
                    <textarea name="keteranganFoto" defaultValue={photo.keterangan ?? ""} />
                  </label>
                  <label>
                    Ganti foto
                    <input
                      name="gambar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                    />
                  </label>
                  <label>
                    Urutan
                    <input type="number" min="0" name="urutFoto" defaultValue={photo.urut} />
                  </label>
                  <label className="website-checkbox">
                    <input
                      type="checkbox"
                      name="aktifFoto"
                      value="true"
                      defaultChecked={photo.aktif}
                    />{" "}
                    Foto aktif
                  </label>
                  <input type="hidden" name="aktifFoto" value="false" />
                  <label className="website-checkbox">
                    <input
                      type="checkbox"
                      name="sliderFoto"
                      value="true"
                      defaultChecked={photo.slider}
                    />{" "}
                    Tampilkan sebagai slider
                  </label>
                  <input type="hidden" name="sliderFoto" value="false" />
                  <button className="website-mini-button" type="submit">
                    Simpan
                  </button>
                </form>
              </details>
            )}
            {izin.galeri.hapus && (
              <form action={hapusFotoGaleriWebsiteAction}>
                <input type="hidden" name="id" value={photo.id} />
                <button className="website-mini-button is-danger" type="submit">
                  Hapus
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
      {izin.galeri.tambah && (
        <form action={tambahAlbumWebsiteAction} className="website-inline-form">
          <strong>Tambah Album</strong>
          <label>
            Nama Album *<input name="namaAlbum" required maxLength={150} />
          </label>
          <label>
            Slug
            <input name="slugAlbum" maxLength={150} />
          </label>
          <label>
            Keterangan
            <textarea name="keteranganAlbum" rows={2} />
          </label>
          <button className="website-button website-button-primary" type="submit">
            Buat Album
          </button>
        </form>
      )}
      {album.length > 0 && izin.galeri.tambah ? (
        <form action={unggahFotoWebsiteAction} className="website-inline-form">
          <strong>Upload Foto</strong>
          <label>
            Album *
            <select name="albumId" required defaultValue="">
              <option value="" disabled>
                Pilih album
              </option>
              {album.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama}
                </option>
              ))}
            </select>
          </label>
          <label>
            Judul Foto
            <input name="judulFoto" maxLength={150} />
          </label>
          <label>
            Keterangan
            <textarea name="keteranganFoto" rows={2} />
          </label>
          <label>
            File Foto *
            <input
              name="gambar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
            />
          </label>
          <button className="website-button website-button-primary" type="submit">
            Upload Foto
          </button>
        </form>
      ) : null}
    </WebsiteSection>
  );
}
