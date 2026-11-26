import {
  INDIKATOR_ANAK_KEYS,
  INDIKATOR_IBU_HAMIL_KEYS,
  type SkorcardKonvergensiResult,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";

import { angka, LABEL_INDIKATOR_ANAK, LABEL_INDIKATOR_IBU, persen } from "./bagian-rekap-format";
import styles from "./stunting.module.css";

export function SkorcardKonvergensi({ skorcard }: { skorcard: SkorcardKonvergensiResult }) {
  const ibu = skorcard.ibuHamil.capaianKonvergensi ?? {};
  const balita = skorcard.bulananAnak.capaianKonvergensi ?? {};
  const tingkatIbu = skorcard.ibuHamil.tingkatKonvergensiDesa;
  const tingkatAnak = skorcard.bulananAnak.tingkatKonvergensiDesa;

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Scorecard Konvergensi Desa</h2>
        <p>
          Ringkasan sasaran 1.000 HPK, hasil tikar pertumbuhan, dan kelengkapan paket layanan
          pencegahan stunting.
        </p>
      </header>

      <div className="table-scroll">
        <table className="data-table">
          <caption className={styles.matrixCaption}>
            Tabel 1. Jumlah sasaran 1.000 HPK (ibu hamil dan anak 0-23 bulan)
          </caption>
          <thead>
            <tr>
              <th>Sasaran</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total rumah tangga sasaran</td>
              <td>{angka.format(skorcard.jumlahTotalRt)}</td>
            </tr>
            <tr>
              <td>Ibu hamil</td>
              <td>{angka.format(skorcard.ibuHamilTotal)}</td>
            </tr>
            <tr>
              <td>Ibu hamil KEK/risti</td>
              <td>{angka.format(skorcard.jumlahKekRisti)}</td>
            </tr>
            <tr>
              <td>Anak 0-23 bulan</td>
              <td>{angka.format(skorcard.bulananAnakTotal)}</td>
            </tr>
            <tr>
              <td>Anak gizi kurang/buruk/stunting</td>
              <td>{angka.format(skorcard.jumlahGiziBukanNormal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <caption className={styles.matrixCaption}>
            Tabel 2. Hasil pengukuran tikar pertumbuhan (deteksi dini stunting)
          </caption>
          <thead>
            <tr>
              <th>Total anak</th>
              <th>Hijau (normal)</th>
              <th>Kuning (risiko stunting)</th>
              <th>Merah (terindikasi stunting)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{angka.format(skorcard.bulananAnakTotal)}</td>
              <td>{angka.format(skorcard.tikar.H)}</td>
              <td>{angka.format(skorcard.tikar.K)}</td>
              <td>{angka.format(skorcard.tikar.M)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.rekapGrid}>
        <article className={styles.rekapCard}>
          <h3>Ibu Hamil</h3>
          <small>Kelengkapan konvergensi paket layanan</small>
          <ul className={styles.rekapList}>
            {INDIKATOR_IBU_HAMIL_KEYS.map((key) => (
              <li key={key}>
                <span>{LABEL_INDIKATOR_IBU[key] ?? key}</span>
                <strong>
                  {angka.format(ibu[key]?.jumlah_diterima ?? 0)} / {persen(ibu[key]?.persen ?? 0)}
                </strong>
              </li>
            ))}
          </ul>
          <p className="form-help">
            Tingkat konvergensi desa:{" "}
            {tingkatIbu
              ? `${persen(tingkatIbu.persen)} (${angka.format(tingkatIbu.jumlah_diterima)}/${angka.format(
                  tingkatIbu.jumlah_seharusnya,
                )})`
              : "belum ada data"}
          </p>
        </article>

        <article className={styles.rekapCard}>
          <h3>Anak 0-23 Bulan</h3>
          <small>Kelengkapan konvergensi paket layanan</small>
          <ul className={styles.rekapList}>
            {INDIKATOR_ANAK_KEYS.map((key) => (
              <li key={key}>
                <span>{LABEL_INDIKATOR_ANAK[key] ?? key}</span>
                <strong>
                  {angka.format(balita[key]?.jumlah_diterima ?? 0)} /{" "}
                  {persen(balita[key]?.persen ?? 0)}
                </strong>
              </li>
            ))}
          </ul>
          <p className="form-help">
            Tingkat konvergensi desa:{" "}
            {tingkatAnak
              ? `${persen(tingkatAnak.persen)} (${angka.format(tingkatAnak.jumlah_diterima)}/${angka.format(
                  tingkatAnak.jumlah_seharusnya,
                )})`
              : "belum ada data"}
          </p>
        </article>
      </div>
    </section>
  );
}
