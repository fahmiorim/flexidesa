import {
  BULAN_PAUD,
  KATEGORI_USIA_PAUD,
  STATUS_PAUD,
  type PaudRow,
} from "@/features/kesehatan/domain/kesehatan";

import { DialogPanduan } from "./dialog-panduan";
import { NAMA_BULAN, type KiaRingkas, type PendudukRingkas } from "./label";
import styles from "./stunting.module.css";

const angka = new Intl.NumberFormat("id-ID");

function persen(bagian: number, total: number): number {
  return total === 0 ? 0 : Math.round((bagian / total) * 1000) / 10;
}

function labelGender(gender: "male" | "female" | undefined): string {
  if (gender === undefined) return "—";
  return gender === "male" ? "Laki-laki" : "Perempuan";
}

/**
 * Rekapitulasi layanan PAUD 2-6 tahun.
 *
 * Meniru `rekapitulasi-bulanan-balita.blade.php` OpenSID: ringkasan sasaran,
 * matriks status kehadiran per bulan, tabel statistik kehadiran bulanan, dan
 * panduan layanan PAUD.
 */
export function BagianRekapPaud({
  paud,
  kiaNama,
  penduduk,
  awalBulan,
  akhirBulan,
}: {
  paud: readonly PaudRow[];
  kiaNama: ReadonlyMap<number, KiaRingkas>;
  penduduk: readonly PendudukRingkas[];
  awalBulan: number;
  akhirBulan: number;
}) {
  const pendudukDari = new Map(penduduk.map((row) => [row.id, row]));
  const baris = paud.map((row) => {
    const kia = kiaNama.get(row.kiaId);
    const anak = kia?.anakId == null ? undefined : pendudukDari.get(kia.anakId);
    return { row, kia, anak };
  });

  const kategori = (nilai: number) =>
    baris.filter((item) => item.row.kategoriUsia === nilai).length;
  const lakiLaki = baris.filter((item) => item.anak?.gender === "male").length;

  const bulanTerpilih = BULAN_PAUD.map((nama, index) => ({ nama, nomor: index + 1 })).filter(
    (item) => item.nomor >= awalBulan && item.nomor <= akhirBulan,
  );

  const statistik = bulanTerpilih.map((item) => {
    const hadir = baris.filter((row) => row.row[item.nama] === 2).length;
    const tidakHadir = baris.filter((row) => row.row[item.nama] === 3).length;
    const belum = baris.filter((row) => row.row[item.nama] === 1).length;
    return {
      nama: NAMA_BULAN[item.nomor - 1] ?? item.nama,
      hadir,
      tidakHadir,
      belum,
      persentase: persen(hadir, baris.length),
    };
  });

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Rekapitulasi Layanan PAUD Anak 2-6 Tahun</h2>
        <p>Status kehadiran layanan PAUD per bulan bagi sasaran anak usia 2 sampai 6 tahun.</p>
      </header>

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
        <button className="button button-secondary" type="submit">
          Terapkan
        </button>
      </form>

      <section aria-label="Ringkasan sasaran PAUD" className="data-kependudukan-kpis">
        <article className="data-kpi data-kpi-primary">
          <span>Total Anak PAUD</span>
          <strong>{angka.format(baris.length)}</strong>
          <small>Sasaran terdaftar</small>
        </article>
        <article className="data-kpi">
          <span>Usia 2 - &lt; 3 Tahun</span>
          <strong>{angka.format(kategori(1))}</strong>
          <small>Parenting</small>
        </article>
        <article className="data-kpi">
          <span>Usia 3 - 6 Tahun</span>
          <strong>{angka.format(kategori(2))}</strong>
          <small>Kelas PAUD</small>
        </article>
        <article className="data-kpi">
          <span>Laki-laki / Perempuan</span>
          <strong>
            {angka.format(lakiLaki)} / {angka.format(baris.length - lakiLaki)}
          </strong>
          <small>Berdasarkan data penduduk</small>
        </article>
      </section>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th rowSpan={2}>No.</th>
              <th rowSpan={2}>No KIA</th>
              <th rowSpan={2}>Nama Anak</th>
              <th rowSpan={2}>Jenis Kelamin</th>
              <th colSpan={2}>Kategori Usia PAUD</th>
              <th colSpan={bulanTerpilih.length}>Status Kehadiran Layanan PAUD per Bulan</th>
            </tr>
            <tr>
              <th>2 - &lt; 3 Tahun</th>
              <th>3 - 6 Tahun</th>
              {bulanTerpilih.map((item) => (
                <th key={item.nama}>{NAMA_BULAN[item.nomor - 1]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 ? (
              <tr>
                <td colSpan={bulanTerpilih.length + 6}>
                  Belum ada data kehadiran PAUD untuk periode yang dipilih.
                </td>
              </tr>
            ) : (
              baris.map((item, index) => (
                <tr key={item.row.id}>
                  <td>{index + 1}</td>
                  <td>{item.kia?.noKia ?? "—"}</td>
                  <td>{item.anak?.name ?? "—"}</td>
                  <td>{labelGender(item.anak?.gender)}</td>
                  <td>{item.row.kategoriUsia === 1 ? "v" : "-"}</td>
                  <td>{item.row.kategoriUsia === 2 ? "v" : "-"}</td>
                  {bulanTerpilih.map((bulan) => {
                    const status = item.row[bulan.nama];
                    const tanda = status === 2 ? "v" : status === 1 ? "-" : "x";
                    const kelas =
                      status === 2
                        ? styles.badgeHijau
                        : status === 1
                          ? styles.badgeKuning
                          : styles.badgeMerah;
                    return (
                      <td key={bulan.nama}>
                        <span className={`${styles.badge} ${kelas}`}>{tanda}</span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <caption style={{ captionSide: "top", textAlign: "left", padding: "0.75rem 0" }}>
            Ringkasan kehadiran PAUD per bulan
          </caption>
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Hadir</th>
              <th>Tidak Hadir</th>
              <th>Belum</th>
              <th>Persentase Hadir</th>
            </tr>
          </thead>
          <tbody>
            {statistik.map((item) => (
              <tr key={item.nama}>
                <td>
                  <strong>{item.nama}</strong>
                </td>
                <td>{angka.format(item.hadir)}</td>
                <td>{angka.format(item.tidakHadir)}</td>
                <td>{angka.format(item.belum)}</td>
                <td>{angka.format(item.persentase)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.panduanAksi}>
        <DialogPanduan
          judul="Panduan Layanan PAUD & Pengembangan Anak Usia Dini"
          label="Panduan PAUD"
          ringkas="Kategori layanan, jadwal, status kehadiran, dan manfaat program PAUD."
        >
          <div className={styles.panduanSeksi}>
            <section>
              <h3>Tentang layanan PAUD</h3>
              <p>PAUD adalah bagian pencegahan stunting untuk anak usia 2–6 tahun.</p>
            </section>

            <section>
              <h3>Jadwal, frekuensi, dan target</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Layanan</th>
                    <th>Frekuensi</th>
                    <th>Durasi</th>
                    <th>Target bulanan</th>
                  </tr>
                </thead>
                <tbody>
                  {KATEGORI_USIA_PAUD.map((item) => (
                    <tr key={item.value}>
                      <td>{item.label}</td>
                      <td>{item.value === 1 ? "Parenting orang tua" : "Kelas PAUD"}</td>
                      <td>{item.value === 1 ? "1x per bulan" : "2x per bulan"}</td>
                      <td>{item.value === 1 ? "2-3 jam" : "3-4 jam"}</td>
                      <td>{item.value === 1 ? "Min. 80% kehadiran" : "Min. 85% kehadiran"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3>Status kehadiran bulanan</h3>
              <ul>
                <li>v = hadir, mengikuti kegiatan</li>
                <li>x = tidak hadir tanpa keterangan, perlu kunjungan rumah</li>
                <li>- = belum berlaku / belum masuk periode kategori</li>
              </ul>
              <p>
                Status yang dipakai:{" "}
                {STATUS_PAUD.map((item) => `${item.value} = ${item.label}`).join(", ")}.
              </p>
              <p className="form-help">
                Anak dengan kehadiran di bawah 60% perlu pendampingan intensif dan evaluasi bersama
                orang tua.
              </p>
            </section>

            <section>
              <h3>Manfaat program</h3>
              <ul>
                <li>Perkembangan kognitif: daya ingat, problem solving, kesiapan sekolah</li>
                <li>Sosial emosional: sosialisasi, kontrol emosi, kepercayaan diri</li>
                <li>Fisik motorik: motorik halus, keseimbangan, kebiasaan hidup sehat</li>
              </ul>
            </section>
          </div>
        </DialogPanduan>
      </div>
    </section>
  );
}
