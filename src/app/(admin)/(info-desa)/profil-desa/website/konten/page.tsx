import type { Metadata } from "next";

import { getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import { WebsiteAdminShell, WebsiteMetric } from "../website-admin-shell";
import { BagianAgenda } from "./bagian-agenda";
import { BagianBerita } from "./bagian-berita";
import { BagianGaleri } from "./bagian-galeri";
import { BagianSlider } from "./bagian-slider";

export const metadata: Metadata = { title: "Konten & Publikasi Website Desa" };

export default async function WebsiteContentPage() {
  const { berita, album, photos, slider, agenda, categories, izin } = await getWebsiteContentData();
  const tayang = berita.filter((item) => item.status === "published");
  const draft = berita.filter((item) => item.status === "draft");
  const agendaTayang = agenda.filter((item) => item.tayang);
  const formatTanggal = (value: Date | string | null) =>
    value
      ? new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(value))
      : "Belum dijadwalkan";
  return (
    <WebsiteAdminShell
      title="Konten & Publikasi"
      description="Kelola berita, pengumuman, agenda kegiatan, galeri foto, dan materi publikasi website desa."
    >
      <div className="website-metrics website-content-metrics">
        {izin.berita.baca && (
          <WebsiteMetric label="Berita" value={berita.length} note={`${draft.length} draft`} />
        )}
        {izin.berita.baca && <WebsiteMetric label="Berita tayang" value={tayang.length} />}
        {izin.agenda.baca && (
          <WebsiteMetric
            label="Agenda"
            value={agenda.length}
            note={`${agendaTayang.length} ditayangkan`}
          />
        )}
        {izin.galeri.baca && <WebsiteMetric label="Album galeri" value={album.length} />}
        {izin.slider.baca && <WebsiteMetric label="Slider beranda" value={slider.length} />}
      </div>
      <nav className="website-settings-tabs website-content-tabs">
        {izin.berita.baca && (
          <a className="is-active" href="#berita">
            Berita
          </a>
        )}
        {izin.berita.baca && <a href="#pengumuman">Pengumuman</a>}
        {izin.agenda.baca && <a href="#agenda">Agenda</a>}
        {izin.galeri.baca && <a href="#galeri">Galeri</a>}
        {izin.slider.baca && <a href="#slider">Slider</a>}
      </nav>
      <div className="website-content-layout">
        {(izin.berita.baca || izin.agenda.baca) && (
          <div className="website-content-primary">
            {izin.berita.baca && (
              <BagianBerita
                izin={izin}
                berita={berita}
                categories={categories}
                tayang={tayang}
                draft={draft}
                formatTanggal={formatTanggal}
              />
            )}
            {izin.agenda.baca && (
              <BagianAgenda izin={izin} agenda={agenda} formatTanggal={formatTanggal} />
            )}
          </div>
        )}
        {(izin.galeri.baca || izin.slider.baca) && (
          <aside className="website-content-aside">
            {izin.galeri.baca && <BagianGaleri izin={izin} album={album} photos={photos} />}
            {izin.slider.baca && <BagianSlider izin={izin} slider={slider} />}
          </aside>
        )}
      </div>
    </WebsiteAdminShell>
  );
}
