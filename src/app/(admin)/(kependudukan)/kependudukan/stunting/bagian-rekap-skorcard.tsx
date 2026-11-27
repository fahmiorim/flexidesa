import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
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

      <TableScroll>
        <Table>
          <caption className={styles.matrixCaption}>
            Tabel 1. Jumlah sasaran 1.000 HPK (ibu hamil dan anak 0-23 bulan)
          </caption>
          <THead>
            <Row>
              <HeaderCell>Sasaran</HeaderCell>
              <HeaderCell>Jumlah</HeaderCell>
            </Row>
          </THead>
          <TBody>
            <Row>
              <Cell>Total rumah tangga sasaran</Cell>
              <Cell>{angka.format(skorcard.jumlahTotalRt)}</Cell>
            </Row>
            <Row>
              <Cell>Ibu hamil</Cell>
              <Cell>{angka.format(skorcard.ibuHamilTotal)}</Cell>
            </Row>
            <Row>
              <Cell>Ibu hamil KEK/risti</Cell>
              <Cell>{angka.format(skorcard.jumlahKekRisti)}</Cell>
            </Row>
            <Row>
              <Cell>Anak 0-23 bulan</Cell>
              <Cell>{angka.format(skorcard.bulananAnakTotal)}</Cell>
            </Row>
            <Row>
              <Cell>Anak gizi kurang/buruk/stunting</Cell>
              <Cell>{angka.format(skorcard.jumlahGiziBukanNormal)}</Cell>
            </Row>
          </TBody>
        </Table>
      </TableScroll>

      <TableScroll>
        <Table>
          <caption className={styles.matrixCaption}>
            Tabel 2. Hasil pengukuran tikar pertumbuhan (deteksi dini stunting)
          </caption>
          <THead>
            <Row>
              <HeaderCell>Total anak</HeaderCell>
              <HeaderCell>Hijau (normal)</HeaderCell>
              <HeaderCell>Kuning (risiko stunting)</HeaderCell>
              <HeaderCell>Merah (terindikasi stunting)</HeaderCell>
            </Row>
          </THead>
          <TBody>
            <Row>
              <Cell>{angka.format(skorcard.bulananAnakTotal)}</Cell>
              <Cell>{angka.format(skorcard.tikar.H)}</Cell>
              <Cell>{angka.format(skorcard.tikar.K)}</Cell>
              <Cell>{angka.format(skorcard.tikar.M)}</Cell>
            </Row>
          </TBody>
        </Table>
      </TableScroll>

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
