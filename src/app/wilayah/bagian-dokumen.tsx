import type { daftarDokumenPublik } from "@/features/info-desa/publik/application/konten-publik";
import { isSafeDocumentLink } from "@/features/info-desa/publik/domain/dokumen";
import { mediaUrl } from "@/lib/media-url";

import styles from "./wilayah.module.css";

type DokumenWilayah = Awaited<ReturnType<typeof daftarDokumenPublik>>[number];

export function UnduhDokumenWilayah({
  dokumen,
  desaId,
}: {
  dokumen: DokumenWilayah[];
  desaId: number;
}) {
  return (
    <section className={styles.downloadCard}>
      <span className={styles.folder}>▱</span>
      <div>
        <h2>Download Dokumen Wilayah</h2>
        <p>Unduh peta, data wilayah, dan dokumen terkait administrasi wilayah desa.</p>
      </div>
      <div className={styles.downloadActions}>
        {dokumen.length ? (
          dokumen.map((doc) => {
            const link =
              doc.tautan && isSafeDocumentLink(doc.tautan)
                ? doc.tautan
                : mediaUrl(doc.berkas, desaId);
            return link ? (
              <a key={doc.id} href={link} target="_blank" rel="noreferrer">
                {doc.nama} ↗
              </a>
            ) : (
              <span key={doc.id}>{doc.nama} · Berkas belum tersedia</span>
            );
          })
        ) : (
          <>
            <span>Peta Wilayah (PDF) · Belum tersedia</span>
            <span>Batas Wilayah (PDF) · Belum tersedia</span>
            <span>Data Dusun (PDF) · Belum tersedia</span>
          </>
        )}
      </div>
    </section>
  );
}
