import type { getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import {
  hapusSliderWebsiteAction,
  tambahSliderWebsiteAction,
  ubahSliderWebsiteAction,
  ubahStatusSliderWebsiteAction,
} from "../actions";
import { WebsiteSection } from "../website-admin-shell";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  slider: DataKonten["slider"];
}

/** Bagian slider beranda Website. */
export function BagianSlider({ izin, slider }: Props) {
  return (
    <WebsiteSection title="Slider Beranda">
      <div id="slider" className="website-list">
        {slider.map((item) => (
          <div className="website-list-row" key={item.id}>
            <div>
              <strong>{item.judul ?? "Slide tanpa judul"}</strong>
              <span>Urutan {item.urut}</span>
            </div>
            {(izin.slider.ubah || izin.slider.hapus) && (
              <div className="website-row-actions">
                {izin.slider.ubah && (
                  <details>
                    <summary className="website-mini-button">Edit</summary>
                    <form action={ubahSliderWebsiteAction} className="website-inline-form">
                      <input type="hidden" name="id" value={item.id} />
                      <label>
                        Judul
                        <input name="judulSlider" defaultValue={item.judul ?? ""} />
                      </label>
                      <label>
                        Keterangan
                        <textarea name="keteranganSlider" defaultValue={item.keterangan ?? ""} />
                      </label>
                      <label>
                        Link tujuan
                        <input type="url" name="tautanSlider" defaultValue={item.tautan ?? ""} />
                      </label>
                      <label>
                        Urutan
                        <input type="number" min="0" name="urutSlider" defaultValue={item.urut} />
                      </label>
                      <label>
                        Ganti gambar
                        <input
                          type="file"
                          name="gambarSlider"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                        />
                      </label>
                      <button className="website-mini-button" type="submit">
                        Simpan Perubahan
                      </button>
                    </form>
                  </details>
                )}
                {izin.slider.ubah && (
                  <form action={ubahStatusSliderWebsiteAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="aktif" value={String(!item.aktif)} />
                    <button className="website-mini-button" type="submit">
                      {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                )}
                {izin.slider.hapus && (
                  <form action={hapusSliderWebsiteAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="website-mini-button is-danger" type="submit">
                      Hapus
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
        {slider.length === 0 ? <p className="modul-empty">Belum ada slide beranda.</p> : null}
      </div>
      {izin.slider.tambah && (
        <form action={tambahSliderWebsiteAction} className="website-inline-form">
          <strong>Tambah Slider</strong>
          <label>
            Judul
            <input name="judulSlider" maxLength={150} />
          </label>
          <label>
            Keterangan
            <textarea name="keteranganSlider" rows={2} maxLength={500} />
          </label>
          <label>
            Link tujuan
            <input name="tautanSlider" type="url" placeholder="https://..." />
          </label>
          <label>
            Gambar *
            <input
              name="gambarSlider"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
            />
          </label>
          <label>
            Urutan
            <input name="urutSlider" type="number" min="0" defaultValue="0" />
          </label>
          <label className="website-checkbox">
            <input name="aktifSlider" type="checkbox" defaultChecked /> Aktif
          </label>
          <button className="website-button website-button-primary" type="submit">
            Tambah Slider
          </button>
        </form>
      )}
    </WebsiteSection>
  );
}
