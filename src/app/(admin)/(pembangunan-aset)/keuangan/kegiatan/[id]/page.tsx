import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/app/(admin)/(keuangan-desa)/keuangan/keuangan.module.css";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { getPembangunanDetail } from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import {
  STATUS_PEMBANGUNAN,
  SUMBER_DANA_PEMBANGUNAN,
} from "@/features/pembangunan-aset/pembangunan/domain/pembangunan";

import {
  hapusDokumentasiKegiatanAction,
  tambahDokumentasiKegiatanAction,
  ubahKegiatanPembangunanAction,
} from "../actions";

export const metadata = { title: "Detail Kegiatan Pembangunan" };

export default async function DetailKegiatanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  const detail = await getPembangunanDetail(id);
  const p = detail.proyek;
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>{p.judul}</>}
        deskripsi={<>Detail, progres, anggaran, dan informasi pelaksanaan kegiatan.</>}
      />
      <nav className={styles.tabs}>
        <Link href="/keuangan">Dashboard</Link>
        <Link href="/keuangan/kegiatan">← Kembali ke daftar kegiatan</Link>
      </nav>
      <form action={ubahKegiatanPembangunanAction} className={styles.panel}>
        <input type="hidden" name="id" value={p.id} />
        <div className={styles.panelHeading}>
          <div>
            <h2>Ubah Data Kegiatan</h2>
            <p>Perubahan akan ikut diperbarui pada halaman publik pembangunan desa.</p>
          </div>
          <Button className={styles.primaryButton} variant="primary" type="submit">
            Simpan Perubahan
          </Button>
        </div>
        <div className={styles.projectForm}>
          <label>
            Nama kegiatan
            <input name="judul" required defaultValue={p.judul} />
          </label>
          <label>
            Tahun anggaran
            <input
              name="tahunAnggaran"
              type="number"
              min="2000"
              max="2100"
              defaultValue={p.tahunAnggaran}
            />
          </label>
          <label>
            Sumber dana
            <select name="sumberDana" defaultValue={p.sumberDana ?? "APBDes"}>
              {SUMBER_DANA_PEMBANGUNAN.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            Anggaran (Rp)
            <input name="anggaran" type="number" min="0" step="1" defaultValue={p.anggaran ?? ""} />
          </label>
          <label>
            Lokasi
            <input name="lokasi" defaultValue={p.lokasi ?? ""} />
          </label>
          <label>
            Latitude
            <input
              name="latitude"
              type="number"
              min="-90"
              max="90"
              step="0.0000001"
              defaultValue={p.latitude ?? ""}
            />
          </label>
          <label>
            Longitude
            <input
              name="longitude"
              type="number"
              min="-180"
              max="180"
              step="0.0000001"
              defaultValue={p.longitude ?? ""}
            />
          </label>
          {p.latitude !== null && p.longitude !== null ? (
            <p className={styles.fullField}>
              <a
                href={
                  "https://www.openstreetmap.org/?mlat=" +
                  p.latitude +
                  "&mlon=" +
                  p.longitude +
                  "#map=16/" +
                  p.latitude +
                  "/" +
                  p.longitude
                }
                target="_blank"
                rel="noreferrer"
              >
                Lihat pin proyek pada peta ↗
              </a>
            </p>
          ) : null}
          <label>
            Pelaksana
            <input name="pelaksana" defaultValue={p.pelaksana ?? ""} />
          </label>
          <label>
            Tanggal mulai
            <input name="mulai" type="date" defaultValue={p.mulai ?? ""} />
          </label>
          <label>
            Tanggal selesai
            <input name="selesai" type="date" defaultValue={p.selesai ?? ""} />
          </label>
          <label>
            Status
            <select name="status" defaultValue={p.status}>
              {STATUS_PEMBANGUNAN.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label>
            Progres (%)
            <input name="progres" type="number" min="0" max="100" defaultValue={p.progres} />
          </label>
          <label className={styles.fullField}>
            Deskripsi
            <textarea name="deskripsi" rows={4} defaultValue={p.deskripsi ?? ""} />
          </label>
          <label className={styles.fullField}>
            Hasil / manfaat
            <textarea name="hasil" rows={3} defaultValue={p.hasil ?? ""} />
          </label>
        </div>
      </form>
      <section className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2>Dokumentasi Kegiatan ({detail.dokumentasi.length})</h2>
            <p>Dokumentasi foto proyek ditampilkan di website publik desa.</p>
          </div>
        </div>
        {detail.dokumentasi.length ? (
          <div className={styles.documentationGrid}>
            {detail.dokumentasi.map((x) => (
              <article className={styles.documentationCard} key={x.id}>
                <Image
                  src={"/api/publik/media/" + x.gambar.split("/").map(encodeURIComponent).join("/")}
                  alt={x.judul || "Dokumentasi kegiatan"}
                  width={320}
                  height={140}
                  unoptimized
                />
                <div>
                  <strong>{x.judul || "Dokumentasi kegiatan"}</strong>
                  <p>{x.keterangan || "Tanpa keterangan"}</p>
                </div>
                <DialogHapusForm
                  aksi={hapusDokumentasiKegiatanAction}
                  id={x.id}
                  hidden={{ proyekId: p.id }}
                  judul={`Hapus foto "${x.judul || "dokumentasi kegiatan"}"?`}
                  keterangan="Foto dokumentasi beserta berkasnya akan dihapus permanen."
                  labelAksi="Hapus foto"
                  varian="danger-ghost"
                />
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Belum ada dokumentasi foto untuk kegiatan ini.</p>
        )}
        <form action={tambahDokumentasiKegiatanAction} className={styles.projectForm}>
          <input type="hidden" name="proyekId" value={p.id} />
          <label>
            Foto dokumentasi
            <input
              type="file"
              name="foto"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              required
            />
          </label>
          <label>
            Judul foto
            <input name="judul" maxLength={150} />
          </label>
          <label className={styles.fullField}>
            Keterangan
            <textarea name="keterangan" rows={2} />
          </label>
          <Button className={styles.primaryButton} variant="primary" type="submit">
            Unggah Dokumentasi
          </Button>
        </form>
      </section>
    </main>
  );
}
