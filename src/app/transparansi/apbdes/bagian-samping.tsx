import Link from "next/link";

import styles from "./apbdes.module.css";
import { palette, type DokumenApbdes, type LaporanApbdes } from "./bagian-apbdes";

function tanggal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Tanggal tidak tersedia"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export function InformasiApbdes({
  tahun,
  jumlahDokumen,
}: {
  tahun: number;
  jumlahDokumen: number;
}) {
  return (
    <section className={styles.panel + " " + styles.infoPanel}>
      <div className={styles.sectionTitle}>
        <span className={styles.titleIcon}>ⓘ</span>
        <h2>Informasi APBDes</h2>
      </div>
      <p>
        APBDes merupakan rencana keuangan tahunan pemerintah desa yang ditetapkan melalui peraturan
        desa dan menjadi dasar pelaksanaan pembangunan serta pelayanan masyarakat.
      </p>
      <div className={styles.infoItem}>
        <span>⚖</span>
        <div>
          <strong>Dasar Pengelolaan</strong>
          <small>
            Pengelolaan keuangan desa mengikuti ketentuan peraturan perundang-undangan yang berlaku.
          </small>
        </div>
      </div>
      <div className={styles.infoItem}>
        <span>▤</span>
        <div>
          <strong>Dokumen Penetapan</strong>
          <small>
            {jumlahDokumen
              ? jumlahDokumen + " dokumen laporan diserahkan untuk tahun " + tahun
              : "Dokumen penetapan belum diunggah atau belum diserahkan."}
          </small>
        </div>
      </div>
      <div className={styles.infoItem}>
        <span>▦</span>
        <div>
          <strong>Tahun Anggaran</strong>
          <small>{tahun}</small>
        </div>
      </div>
      <div className={styles.infoItem}>
        <span className={jumlahDokumen ? styles.ok : styles.pending}>
          {jumlahDokumen ? "✓" : "!"}
        </span>
        <div>
          <strong>Status Dokumen</strong>
          <small>
            {jumlahDokumen
              ? "Terdapat dokumen yang telah diserahkan"
              : "Belum ada dokumen APBDes yang diserahkan"}
          </small>
        </div>
      </div>
    </section>
  );
}

export function DokumenApbdesTerkait({ dokumen }: { dokumen: DokumenApbdes[] }) {
  return (
    <section id="dokumen" className={styles.panel + " " + styles.docsPanel}>
      <div className={styles.sectionTitle}>
        <span className={styles.titleIcon}>▱</span>
        <h2>Dokumen Terkait</h2>
      </div>
      {dokumen.length ? (
        <div className={styles.documentList}>
          {dokumen.map((doc) => (
            <article key={doc.id}>
              <span className={styles.pdfIcon}>PDF</span>
              <div>
                <strong>{doc.judul}</strong>
                <small>
                  {doc.tahun} · {doc.semesterLabel} · Diserahkan {tanggal(doc.diserahkanPada)}
                </small>
              </div>
              <Link
                href={"/desa/apbdes/dokumen/" + doc.id + "/berkas"}
                aria-label={"Unduh " + doc.judul}
              >
                ↓
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Belum ada dokumen APBDes yang dipublikasikan untuk tahun ini. Dokumen akan muncul setelah
          Admin Desa mengunggah dan mencatat penyerahannya.
        </p>
      )}
      <Link className={styles.allDocs} href="/dokumen">
        Lihat Semua Dokumen　→
      </Link>
    </section>
  );
}

export function GrafikRealisasi({
  bidang,
  maxBar,
}: {
  bidang: LaporanApbdes["bidang"];
  maxBar: number;
}) {
  return (
    <section className={styles.panel + " " + styles.chartPanel}>
      <div className={styles.sectionTitle}>
        <span className={styles.titleIcon}>◔</span>
        <h2>Grafik Realisasi Belanja</h2>
      </div>
      <div className={styles.chartLegend}>
        <span>
          <i />
          Rencana
        </span>
        <span>
          <i />
          Realisasi
        </span>
      </div>
      {bidang.length ? (
        <div className={styles.barChart}>
          {bidang.map((row, index) => (
            <div className={styles.barGroup} key={row.kode}>
              <div className={styles.bars}>
                <i style={{ height: (Number(row.anggaran) / maxBar) * 100 + "%" }} />
                <b
                  style={{
                    height: (Number(row.realisasi) / maxBar) * 100 + "%",
                    background: palette[index % palette.length],
                  }}
                />
              </div>
              <small>{row.uraian}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Grafik muncul setelah data bidang belanja tersedia.</p>
      )}
    </section>
  );
}
