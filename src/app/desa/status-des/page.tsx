import type { Metadata } from "next";
import Link from "next/link";

import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";
import { urlMediaDesa } from "@/features/info-desa/publik/application/media-url";
import { ringkasanIdmPublik } from "@/features/program-data-desa/idm/application/idm-use-cases";
import {
  formatSkor,
  formatSkorRujukan,
  hitungRekapIdm,
  hitungRekapSdgs,
  IDM_DIMENSI,
  SDGS_GOALS,
} from "@/features/program-data-desa/idm/domain/idm";

import { PublicSiteFooter, PublicSiteHeader } from "../../public-site-layout";
import styles from "./status-des.module.css";

export const metadata: Metadata = {
  title: "Status Desa",
  description: "Status IDM dan capaian SDGs Desa.",
};
export const dynamic = "force-dynamic";

function lebar(skor: number | null): number {
  if (skor === null) return 0;
  return Math.min(100, Math.max(0, skor * 100));
}

function lokasi(desa: {
  namaKecamatan: string | null;
  namaKabupaten: string | null;
  namaPropinsi: string | null;
}) {
  return [desa.namaKecamatan, desa.namaKabupaten, desa.namaPropinsi].filter(Boolean).join(", ");
}

export default async function StatusDesaPublikPage({
  searchParams,
}: {
  searchParams: Promise<{ tahun?: string }>;
}) {
  const params = await searchParams;
  const tahunDiminta = Number.parseInt(params.tahun ?? "", 10);
  const desa = await getIdentitasFromRequest();
  const tema = await muatTemaPublik(desa.id);
  const { tahun, tahunTersedia, indikator, sdgs, ringkasan } = await ringkasanIdmPublik(
    desa.id,
    Number.isInteger(tahunDiminta) ? tahunDiminta : undefined,
  );

  const rekap = hitungRekapIdm(indikator);
  const rekapSdgs = hitungRekapSdgs(sdgs);
  const sdgsPerGoal = new Map(sdgs.map((row) => [row.goal, row]));
  const skorMinimal = ringkasan?.skorMinimal ? Number(ringkasan.skorMinimal) : null;
  const logoUrl = urlMediaDesa(desa.logo, desa.id);
  const alamat = lokasi(desa);
  const adaData = indikator.length > 0 || sdgs.length > 0;
  const diperbarui = ringkasan?.disinkronkanPada
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(ringkasan.disinkronkanPada)
    : null;

  return (
    <main className={styles.site} data-tema={tema?.slug}>
      <PublicSiteHeader
        activePath="/desa/status-des"
        desa={desa}
        location={alamat}
        logoUrl={logoUrl}
      />

      <section className={styles.hero}>
        <div className={styles.container}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/">Beranda</Link>
            <span>›</span>
            <span>Transparansi</span>
            <span>›</span>
            <span>Status Desa</span>
          </nav>
          <div className={styles.heroIsi}>
            <div>
              <span className={styles.eyebrow}>STATUS PEMBANGUNAN DESA</span>
              <h1>Status Desa {tahun}</h1>
              <p>Kemajuan desa menurut IDM dan 18 tujuan SDGs.</p>
            </div>
            <div aria-hidden className={styles.heroSkor}>
              <small>SKOR IDM</small>
              <strong>{formatSkor(rekap.skor)}</strong>
              <span>{rekap.status ?? "Belum dinilai"}</span>
            </div>
          </div>
          {tahunTersedia.length > 1 ? (
            <nav aria-label="Pilih tahun status desa" className={styles.tahunNav}>
              {tahunTersedia.map((item) => (
                <Link
                  aria-current={item === tahun ? "page" : undefined}
                  className={item === tahun ? styles.tahunAktif : undefined}
                  href={`/desa/status-des?tahun=${item}`}
                  key={item}
                >
                  {item}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </section>

      <div className={`${styles.container} ${styles.konten}`}>
        <section aria-label="Ringkasan status" className={styles.kpi}>
          <article className={styles.kpiUtama}>
            <span>Skor IDM</span>
            <strong>{formatSkor(rekap.skor)}</strong>
            <small>{rekap.status ?? "Belum dinilai"}</small>
            <div aria-hidden className={styles.bar}>
              <i style={{ width: `${lebar(rekap.skor)}%` }} />
            </div>
          </article>
          <article>
            <span>Status IDM</span>
            <strong className={styles.teksStatus}>{rekap.status ?? "—"}</strong>
            <small>Klasifikasi skor tiga dimensi</small>
          </article>
          <article>
            <span>Skor minimal</span>
            <strong>{formatSkorRujukan(skorMinimal)}</strong>
            <small>Menuju target status</small>
          </article>
          <article>
            <span>Target status</span>
            <strong className={styles.teksStatus}>{ringkasan?.targetStatus ?? "—"}</strong>
            <small>{diperbarui ? `Data ${diperbarui}` : "Dari API Kemendesa"}</small>
          </article>
          <article>
            <span>Skor SDGs</span>
            <strong>{formatSkor(rekapSdgs.skor)}</strong>
            <small>
              {rekapSdgs.predikat ?? "Belum dinilai"} · {rekapSdgs.jumlahTerisi}/18 tujuan
            </small>
          </article>
        </section>

        <section className={styles.identitas}>
          <div>
            <small>Provinsi</small>
            <strong>{desa.namaPropinsi ?? "—"}</strong>
          </div>
          <div>
            <small>Kabupaten/Kota</small>
            <strong>{desa.namaKabupaten ?? "—"}</strong>
          </div>
          <div>
            <small>Kecamatan</small>
            <strong>{desa.namaKecamatan ?? "—"}</strong>
          </div>
          <div>
            <small>Desa</small>
            <strong>{desa.namaDesa ?? "—"}</strong>
          </div>
          <div>
            <small>Indikator IDM</small>
            <strong>{rekap.jumlahIndikator} terisi</strong>
          </div>
        </section>

        {adaData ? null : (
          <section className={styles.kosong}>
            <h2>Data status desa belum tersedia</h2>
            <p>
              Pemerintah desa belum mengisi indikator IDM atau capaian SDGs untuk tahun ini. Data
              akan tampil otomatis setelah diisi pada administrasi desa.
            </p>
          </section>
        )}

        <section className={styles.panel}>
          <div className={styles.panelKepala}>
            <div>
              <h2>Tiga Dimensi IDM</h2>
              <p>Indeks Ketahanan Sosial, Ekonomi, dan Lingkungan pada tahun {tahun}.</p>
            </div>
            <span>{rekap.jumlahIndikator} indikator</span>
          </div>
          <div className={styles.dimensiGrid}>
            {IDM_DIMENSI.map((item) => {
              const dimensi = rekap.dimensi.find((row) => row.id === item.id);
              return (
                <article className={styles.dimensi} key={item.id}>
                  <span>{item.kode}</span>
                  <strong>{formatSkor(dimensi?.skor ?? null)}</strong>
                  <p>{item.label}</p>
                  <div aria-hidden className={styles.bar}>
                    <i style={{ width: `${lebar(dimensi?.skor ?? null)}%` }} />
                  </div>
                  <small>{dimensi?.jumlahIndikator ?? 0} indikator</small>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelKepala}>
            <div>
              <h2>Capaian 18 Tujuan SDGs</h2>
              <p>Nilai capaian tiap tujuan pembangunan berkelanjutan desa.</p>
            </div>
            <span>
              Rata-rata {formatSkor(rekapSdgs.skor)} · {rekapSdgs.predikat ?? "Belum dinilai"}
            </span>
          </div>
          <div className={styles.sdgsGrid}>
            {SDGS_GOALS.map((goal) => {
              const row = sdgsPerGoal.get(goal.nomor);
              return (
                <article
                  className={row ? styles.goal : `${styles.goal} ${styles.goalKosong}`}
                  key={goal.nomor}
                >
                  <span aria-hidden className={styles.goalNomor}>
                    {goal.nomor}
                  </span>
                  <div>
                    <strong>{goal.nama}</strong>
                    <small>{row ? `Nilai ${row.skor}/100` : "Belum diisi"}</small>
                  </div>
                  <div aria-hidden className={styles.bar}>
                    <i style={{ width: `${row ? Math.min(100, Math.max(0, row.skor)) : 0}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className={styles.catatan}>
          <div>
            <h2>Data terbuka untuk warga</h2>
            <p>
              Status desa dihitung dari rata-rata tiga dimensi IDM dan capaian tujuan SDGs yang
              tersimpan. Skor minimal dan target status berasal dari API IDM Kemendesa.
            </p>
          </div>
        </div>
      </div>

      <PublicSiteFooter desa={desa} location={alamat} logoUrl={logoUrl} />
    </main>
  );
}
