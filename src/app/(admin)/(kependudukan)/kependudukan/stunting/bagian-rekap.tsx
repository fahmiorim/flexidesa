import {
  buildSkorcardKonvergensi,
  hitungKonvergensiBaris,
  hitungSkorcardKia,
  INDIKATOR_ANAK_KEYS,
  INDIKATOR_IBU_HAMIL_KEYS,
  kategoriUsiaAnak,
  KOLOM_INDIKATOR_ANAK,
  KOLOM_INDIKATOR_IBU_HAMIL,
  STATUS_GIZI_ANAK,
  STATUS_KEHAMILAN,
  statusIndikator,
  type BulananAnakRow,
  type IbuHamilRow,
  type SkorcardKonvergensiResult,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";

import {
  angka,
  BadgeAngka,
  BatangPersen,
  Kpi,
  LABEL_INDIKATOR_ANAK,
  LABEL_INDIKATOR_IBU,
  Penanda,
  persen,
} from "./bagian-rekap-format";
import { PanduanAnak, PanduanIbuHamil } from "./bagian-rekap-panduan";
import { SkorcardKonvergensi } from "./bagian-rekap-skorcard";
import { DialogPanduan } from "./dialog-panduan";
import {
  formatTanggal,
  NAMA_BULAN,
  tanggalPeriksaEfektif,
  type KiaRingkas,
  type PendudukRingkas,
} from "./label";
import styles from "./stunting.module.css";

type BarisAnak = BulananAnakRow & { createdAt?: Date | string | null };
type BarisIbu = IbuHamilRow & { createdAt?: Date | string | null };

/**
 * Rekapitulasi bulanan ibu hamil dan anak 0-2 tahun.
 *
 * Susunan kolom, status `Y`/`T`/`-`, kolom Diterima/Seharusnya/%, dan footer
 * "Tingkat Capaian Konvergensi" mengikuti `rekapitulasi-ibu-hamil.blade.php`
 * serta `rekapitulasi-bulanan-anak.blade.php` OpenSID. Tampilan FlexiDesa memakai
 * tabel yang bisa digeser, badge, dan batang capaian agar lebih mudah dibaca.
 */
export function BagianRekap({
  ibuHamil,
  anak,
  posyanduNama,
  posyandu,
  kiaNama,
  penduduk,
  skorcard,
  awalBulan,
  akhirBulan,
  filterTahun,
  filterPosyandu,
  tampilkan = "rekapitulasi",
}: {
  ibuHamil: readonly BarisIbu[];
  anak: readonly BarisAnak[];
  posyanduNama: ReadonlyMap<number, string>;
  posyandu: readonly { id: number; nama: string }[];
  kiaNama: ReadonlyMap<number, KiaRingkas>;
  penduduk: readonly PendudukRingkas[];
  skorcard: SkorcardKonvergensiResult;
  awalBulan: number;
  akhirBulan: number;
  filterTahun: string;
  filterPosyandu: string;
  tampilkan?: "rekapitulasi" | "scorecard";
}) {
  if (tampilkan === "scorecard") {
    return <SkorcardKonvergensi skorcard={skorcard} />;
  }

  // Filter periode mengikuti `filter.blade.php` OpenSID: rentang bulan, tahun,
  // dan posyandu. Tanggal yang dipakai adalah tanggal periksa efektif.
  const cocokFilter = (row: BarisIbu | BarisAnak) => {
    const nilai = tanggalPeriksaEfektif(row.tanggalPeriksa, row.createdAt);
    if (!nilai) return false;
    const tanggal = nilai instanceof Date ? nilai : new Date(nilai);
    if (Number.isNaN(tanggal.getTime())) return false;
    const bulan = tanggal.getMonth() + 1;
    if (bulan < awalBulan || bulan > akhirBulan) return false;
    if (filterTahun !== "" && tanggal.getFullYear() !== Number(filterTahun)) return false;
    if (filterPosyandu !== "" && row.posyanduId !== Number(filterPosyandu)) return false;
    return true;
  };

  const ibuTampil = ibuHamil.filter(cocokFilter);
  const anakTampil = anak.filter(cocokFilter);
  const skorcardPeriode = buildSkorcardKonvergensi(ibuTampil, anakTampil);
  const rekapKia = hitungSkorcardKia(
    anakTampil.map((row) => ({ statusGizi: row.statusGizi, statusTikar: row.statusTikar })),
  );

  const pendudukDari = new Map(penduduk.map((row) => [row.id, row]));
  const ibu = skorcardPeriode.ibuHamil.capaianKonvergensi ?? {};
  const balita = skorcardPeriode.bulananAnak.capaianKonvergensi ?? {};
  const tingkatIbu = skorcardPeriode.ibuHamil.tingkatKonvergensiDesa;
  const tingkatAnak = skorcardPeriode.bulananAnak.tingkatKonvergensiDesa;
  const tahunTersedia = [
    ...new Set(
      [...ibuHamil, ...anak]
        .map((row) => tanggalPeriksaEfektif(row.tanggalPeriksa, row.createdAt))
        .map((nilai) => (nilai ? new Date(nilai).getFullYear() : NaN))
        .filter((tahun) => Number.isFinite(tahun)),
    ),
  ].sort((a, b) => b - a);

  const kategoriAnak = {
    a: anakTampil.filter((row) => (row.umurBulan ?? 0) < 6).length,
    b: anakTampil.filter((row) => (row.umurBulan ?? 0) >= 6 && (row.umurBulan ?? 0) <= 12).length,
    c: anakTampil.filter((row) => (row.umurBulan ?? 0) > 12 && (row.umurBulan ?? 0) < 18).length,
    d: anakTampil.filter((row) => (row.umurBulan ?? 0) >= 18 && (row.umurBulan ?? 0) <= 23).length,
  };
  const giziNormal = anakTampil.filter((row) => row.statusGizi === 1).length;
  const giziRisiko = anakTampil.length - giziNormal;

  return (
    <>
      <form className={styles.filterBar} method="get">
        <input name="tab" type="hidden" value="rekapitulasi" />
        <label>
          Bulan awal
          <select className="form-input" defaultValue={awalBulan} name="awal">
            {NAMA_BULAN.map((nama, index) => (
              <option key={nama} value={index + 1}>
                {nama}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bulan akhir
          <select className="form-input" defaultValue={akhirBulan} name="akhir">
            {NAMA_BULAN.map((nama, index) => (
              <option key={nama} value={index + 1}>
                {nama}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun
          <select className="form-input" defaultValue={filterTahun} name="tahun">
            <option value="">Semua tahun</option>
            {tahunTersedia.map((tahun) => (
              <option key={tahun} value={tahun}>
                {tahun}
              </option>
            ))}
          </select>
        </label>
        <label>
          Posyandu
          <select className="form-input" defaultValue={filterPosyandu} name="posyandu">
            <option value="">Semua posyandu</option>
            {posyandu.map((row) => (
              <option key={row.id} value={row.id}>
                {row.nama}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-primary" type="submit">
          Cari
        </button>
      </form>
      <section className="platform-card data-panel">
        <header className={styles.panelHead}>
          <div>
            <h2>Rekapitulasi Bulanan Ibu Hamil</h2>
            <p>
              Periode {NAMA_BULAN[awalBulan - 1]}–{NAMA_BULAN[akhirBulan - 1]}{" "}
              {filterTahun || "semua tahun"}: {angka.format(rekapKia.total)} pemantauan anak,{" "}
              {angka.format(rekapKia.stunting)} terindikasi stunting ({persen(rekapKia.konversi)}).
            </p>
          </div>
          <DialogPanduan
            judul="Panduan Program Konvergensi Stunting Ibu Hamil"
            label="Panduan Lengkap"
            ringkas="Delapan indikator layanan yang dinilai pada setiap ibu hamil beserta cara perhitungan konvergensinya."
          >
            <PanduanIbuHamil />
          </DialogPanduan>
        </header>

        <section aria-label="Ringkasan rekapitulasi ibu hamil" className="data-kependudukan-kpis">
          <Kpi label="Total Ibu Hamil" nilai={angka.format(ibuTampil.length)} utama />
          <Kpi
            label="Tingkat Konvergensi"
            nilai={persen(tingkatIbu?.persen ?? 0)}
            kecil="Diterima dibagi seharusnya"
          />
          <Kpi
            label="Indikator Terpenuhi"
            nilai={angka.format(tingkatIbu?.jumlah_diterima ?? 0)}
            kecil="Jumlah Y"
          />
          <Kpi
            label="Target Indikator"
            nilai={angka.format(tingkatIbu?.jumlah_seharusnya ?? 0)}
            kecil="Tanpa status -"
          />
        </section>

        <div className="table-scroll">
          <table className={`data-table ${styles.matrix}`}>
            <caption className={styles.matrixCaption}>
              Data rekapitulasi konvergensi stunting ibu hamil
            </caption>
            <thead>
              <tr>
                <th rowSpan={2}>No</th>
                <th rowSpan={2}>NO KIA</th>
                <th rowSpan={2}>Nama Ibu</th>
                <th rowSpan={2}>Status Kehamilan</th>
                <th colSpan={2}>Usia Kehamilan dan Persalinan</th>
                <th colSpan={INDIKATOR_IBU_HAMIL_KEYS.length}>Status Penerimaan Indikator</th>
                <th colSpan={3}>Tingkat Konvergensi Indikator</th>
              </tr>
              <tr>
                <th>Usia (Bulan)</th>
                <th>Tanggal Melahirkan</th>
                {INDIKATOR_IBU_HAMIL_KEYS.map((key) => (
                  <th key={key}>{LABEL_INDIKATOR_IBU[key] ?? key}</th>
                ))}
                <th>Diterima</th>
                <th>Seharusnya</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {ibuTampil.length === 0 ? (
                <tr>
                  <td colSpan={4 + 2 + INDIKATOR_IBU_HAMIL_KEYS.length + 3}>
                    Belum ada data rekapitulasi ibu hamil untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                ibuTampil.map((row, index) => {
                  const kia = kiaNama.get(row.kiaId);
                  const konvergensi = hitungKonvergensiBaris(
                    row,
                    INDIKATOR_IBU_HAMIL_KEYS,
                    KOLOM_INDIKATOR_IBU_HAMIL,
                  );
                  const status = STATUS_KEHAMILAN.find(
                    (item) => item.value === row.statusKehamilan,
                  );
                  return (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>{kia?.noKia ?? "—"}</td>
                      <td>{kia?.ibuName ?? "—"}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            row.statusKehamilan === 1
                              ? styles.badgeHijau
                              : row.statusKehamilan === 2
                                ? styles.badgeKuning
                                : row.statusKehamilan === 3
                                  ? styles.badgeMerah
                                  : styles.badgeNetral
                          }`}
                        >
                          {status?.label ?? "—"}
                        </span>
                      </td>
                      <td>{row.usiaKehamilan ?? "—"}</td>
                      <td>{row.tanggalMelahirkan ? formatTanggal(row.tanggalMelahirkan) : "—"}</td>
                      {INDIKATOR_IBU_HAMIL_KEYS.map((key) => {
                        const kolom = KOLOM_INDIKATOR_IBU_HAMIL[key];
                        const nilai = kolom ? row[kolom] : null;
                        return (
                          <td key={key}>
                            <Penanda status={statusIndikator(nilai as boolean | null)} />
                          </td>
                        );
                      })}
                      <td>
                        <BadgeAngka hijau nilai={konvergensi.jumlah_diterima_lengkap} />
                      </td>
                      <td>
                        <BadgeAngka nilai={konvergensi.jumlah_seharusnya} />
                      </td>
                      <td>
                        <BatangPersen nilai={konvergensi.persen} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {ibuTampil.length > 0 ? (
              <tfoot>
                <tr>
                  <th colSpan={4} rowSpan={3}>
                    Tingkat Capaian Konvergensi
                  </th>
                  <th colSpan={2}>Jumlah Diterima</th>
                  {INDIKATOR_IBU_HAMIL_KEYS.map((key) => (
                    <td key={key}>
                      <BadgeAngka hijau nilai={ibu[key]?.jumlah_diterima ?? 0} />
                    </td>
                  ))}
                  <td rowSpan={3}>
                    <BadgeAngka hijau nilai={tingkatIbu?.jumlah_diterima ?? 0} />
                  </td>
                  <td rowSpan={3}>
                    <BadgeAngka nilai={tingkatIbu?.jumlah_seharusnya ?? 0} />
                  </td>
                  <td rowSpan={3}>
                    <BatangPersen nilai={tingkatIbu?.persen ?? 0} />
                  </td>
                </tr>
                <tr>
                  <th colSpan={2}>Jumlah Seharusnya</th>
                  {INDIKATOR_IBU_HAMIL_KEYS.map((key) => (
                    <td key={key}>
                      <BadgeAngka nilai={ibu[key]?.jumlah_seharusnya ?? 0} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th colSpan={2}>%</th>
                  {INDIKATOR_IBU_HAMIL_KEYS.map((key) => (
                    <td key={key}>{persen(ibu[key]?.persen ?? 0)}</td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        <p className="form-help">
          Posyandu terlibat: {posyanduNama.size === 0 ? "—" : [...posyanduNama.values()].join(", ")}
          . Status indikator: Y = memenuhi syarat, T = tidak memenuhi syarat, - = data tidak
          tersedia.
        </p>
      </section>

      <section className="platform-card data-panel">
        <header className={styles.panelHead}>
          <div>
            <h2>Rekapitulasi Bulanan Anak 0-2 Tahun</h2>
            <p>
              Sepuluh indikator layanan kesehatan dan pengasuhan untuk sasaran 1.000 HPK usia 0-23
              bulan.
            </p>
          </div>
          <DialogPanduan
            judul="Panduan Kategori Usia Anak 0-2 Tahun"
            label="Panduan Kategori Usia"
            ringkas="Fokus indikator tiap kategori usia dalam 1.000 Hari Pertama Kehidupan."
          >
            <PanduanAnak />
          </DialogPanduan>
        </header>

        <section aria-label="Ringkasan rekapitulasi anak" className="data-kependudukan-kpis">
          <Kpi label="Total Anak (0-2 Tahun)" nilai={angka.format(anakTampil.length)} utama />
          <Kpi label="Status Gizi Normal" nilai={angka.format(giziNormal)} kecil="Gizi baik" />
          <Kpi
            label="Risiko/Stunting"
            nilai={angka.format(giziRisiko)}
            kecil="Gizi kurang sampai stunting"
          />
          <Kpi
            label="Tingkat Konvergensi"
            nilai={persen(tingkatAnak?.persen ?? 0)}
            kecil={`${angka.format(tingkatAnak?.jumlah_diterima ?? 0)} dari ${angka.format(
              tingkatAnak?.jumlah_seharusnya ?? 0,
            )} indikator`}
          />
        </section>

        <section aria-label="Distribusi kategori usia anak" className={styles.distribusi}>
          <article className={`${styles.distribusiKartu} ${styles.distribusiBiru}`}>
            <span>0 - &lt; 6 Bulan</span>
            <strong>{angka.format(kategoriAnak.a)}</strong>
            <small>ASI eksklusif &amp; imunisasi dasar</small>
          </article>
          <article className={`${styles.distribusiKartu} ${styles.distribusiHijau}`}>
            <span>6 - 12 Bulan</span>
            <strong>{angka.format(kategoriAnak.b)}</strong>
            <small>MP-ASI &amp; penimbangan rutin</small>
          </article>
          <article className={`${styles.distribusiKartu} ${styles.distribusiKuning}`}>
            <span>&gt; 12 - &lt; 18 Bulan</span>
            <strong>{angka.format(kategoriAnak.c)}</strong>
            <small>Pola makan &amp; deteksi dini</small>
          </article>
          <article className={`${styles.distribusiKartu} ${styles.distribusiMerah}`}>
            <span>&gt; 18 - 23 Bulan</span>
            <strong>{angka.format(kategoriAnak.d)}</strong>
            <small>Puncak pencegahan stunting</small>
          </article>
        </section>

        <div className="table-scroll">
          <table className={`data-table ${styles.matrix}`}>
            <caption className={styles.matrixCaption}>
              Data rekapitulasi konvergensi stunting anak 0-2 tahun
            </caption>
            <thead>
              <tr>
                <th rowSpan={2}>No</th>
                <th rowSpan={2}>NO KIA</th>
                <th rowSpan={2}>Nama Anak</th>
                <th rowSpan={2}>Jenis Kelamin</th>
                <th colSpan={2}>Profil Anak</th>
                <th colSpan={INDIKATOR_ANAK_KEYS.length}>
                  Indikator Layanan Kesehatan &amp; Pengasuhan
                </th>
                <th colSpan={3}>Tingkat Konvergensi Indikator</th>
              </tr>
              <tr>
                <th>Umur &amp; Kategori</th>
                <th>Status Gizi</th>
                {INDIKATOR_ANAK_KEYS.map((key) => (
                  <th key={key}>{LABEL_INDIKATOR_ANAK[key] ?? key}</th>
                ))}
                <th>Diterima</th>
                <th>Seharusnya</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {anakTampil.length === 0 ? (
                <tr>
                  <td colSpan={4 + 2 + INDIKATOR_ANAK_KEYS.length + 3}>
                    Belum ada data rekapitulasi anak 0-2 tahun untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                anakTampil.map((row, index) => {
                  const kia = kiaNama.get(row.kiaId);
                  const profil = kia?.anakId == null ? undefined : pendudukDari.get(kia.anakId);
                  const konvergensi = hitungKonvergensiBaris(
                    row,
                    INDIKATOR_ANAK_KEYS,
                    KOLOM_INDIKATOR_ANAK,
                  );
                  const gizi = STATUS_GIZI_ANAK.find((item) => item.value === row.statusGizi);
                  return (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>{kia?.noKia ?? "—"}</td>
                      <td>{profil?.name ?? "—"}</td>
                      <td>
                        {profil
                          ? profil.gender === "male"
                            ? "LAKI-LAKI"
                            : "PEREMPUAN"
                          : "TIDAK DIKETAHUI"}
                      </td>
                      <td>
                        <strong>{row.umurBulan ?? "—"}</strong>
                        <br />
                        <small>{kategoriUsiaAnak(row.umurBulan)}</small>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            row.statusGizi === 1
                              ? styles.badgeHijau
                              : row.statusGizi === 4
                                ? styles.badgeMerah
                                : styles.badgeKuning
                          }`}
                        >
                          {gizi?.label ?? "—"}
                        </span>
                      </td>
                      {INDIKATOR_ANAK_KEYS.map((key) => {
                        const kolom = KOLOM_INDIKATOR_ANAK[key];
                        const nilai = kolom ? row[kolom] : null;
                        return (
                          <td key={key}>
                            <Penanda status={statusIndikator(nilai as boolean | null)} />
                          </td>
                        );
                      })}
                      <td>
                        <BadgeAngka hijau nilai={konvergensi.jumlah_diterima_lengkap} />
                      </td>
                      <td>
                        <BadgeAngka nilai={konvergensi.jumlah_seharusnya} />
                      </td>
                      <td>
                        <BatangPersen nilai={konvergensi.persen} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {anakTampil.length > 0 ? (
              <tfoot>
                <tr>
                  <th colSpan={4} rowSpan={3}>
                    Tingkat Capaian Konvergensi
                  </th>
                  <th colSpan={2}>Jumlah Diterima</th>
                  {INDIKATOR_ANAK_KEYS.map((key) => (
                    <td key={key}>
                      <BadgeAngka hijau nilai={balita[key]?.jumlah_diterima ?? 0} />
                    </td>
                  ))}
                  <td rowSpan={3}>
                    <BadgeAngka hijau nilai={tingkatAnak?.jumlah_diterima ?? 0} />
                  </td>
                  <td rowSpan={3}>
                    <BadgeAngka nilai={tingkatAnak?.jumlah_seharusnya ?? 0} />
                  </td>
                  <td rowSpan={3}>
                    <BatangPersen nilai={tingkatAnak?.persen ?? 0} />
                  </td>
                </tr>
                <tr>
                  <th colSpan={2}>Jumlah Seharusnya</th>
                  {INDIKATOR_ANAK_KEYS.map((key) => (
                    <td key={key}>
                      <BadgeAngka nilai={balita[key]?.jumlah_seharusnya ?? 0} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th colSpan={2}>%</th>
                  {INDIKATOR_ANAK_KEYS.map((key) => (
                    <td key={key}>{persen(balita[key]?.persen ?? 0)}</td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>
    </>
  );
}
