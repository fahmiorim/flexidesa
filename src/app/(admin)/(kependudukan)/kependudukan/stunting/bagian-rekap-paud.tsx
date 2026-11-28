import { Button } from "@/components/ui/button";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  BULAN_PAUD,
  KATEGORI_USIA_PAUD,
  STATUS_PAUD,
  type PaudRow,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";

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
 * Ringkasan sasaran,
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
        <Button variant="secondary" type="submit">
          Terapkan
        </Button>
      </form>

      <StatGrid ariaLabel="Ringkasan sasaran PAUD" columns={4}>
        <StatCard
          label="Total Anak PAUD"
          note="Sasaran terdaftar"
          utama
          value={angka.format(baris.length)}
        />
        <StatCard label="Usia 2 - < 3 Tahun" note="Parenting" value={angka.format(kategori(1))} />
        <StatCard label="Usia 3 - 6 Tahun" note="Kelas PAUD" value={angka.format(kategori(2))} />
        <StatCard
          label="Laki-laki / Perempuan"
          note="Berdasarkan data penduduk"
          value={`${angka.format(lakiLaki)} / ${angka.format(baris.length - lakiLaki)}`}
        />
      </StatGrid>

      <TableScroll>
        <Table>
          <THead>
            <Row>
              <HeaderCell rowSpan={2}>No.</HeaderCell>
              <HeaderCell rowSpan={2}>No KIA</HeaderCell>
              <HeaderCell rowSpan={2}>Nama Anak</HeaderCell>
              <HeaderCell rowSpan={2}>Jenis Kelamin</HeaderCell>
              <HeaderCell colSpan={2}>Kategori Usia PAUD</HeaderCell>
              <HeaderCell colSpan={bulanTerpilih.length}>
                Status Kehadiran Layanan PAUD per Bulan
              </HeaderCell>
            </Row>
            <Row>
              <HeaderCell>2 - &lt; 3 Tahun</HeaderCell>
              <HeaderCell>3 - 6 Tahun</HeaderCell>
              {bulanTerpilih.map((item) => (
                <HeaderCell key={item.nama}>{NAMA_BULAN[item.nomor - 1]}</HeaderCell>
              ))}
            </Row>
          </THead>
          <TBody>
            {baris.length === 0 ? (
              <Row>
                <Cell colSpan={bulanTerpilih.length + 6}>
                  Belum ada data kehadiran PAUD untuk periode yang dipilih.
                </Cell>
              </Row>
            ) : (
              baris.map((item, index) => (
                <Row key={item.row.id}>
                  <Cell>{index + 1}</Cell>
                  <Cell>{item.kia?.noKia ?? "—"}</Cell>
                  <Cell>{item.anak?.name ?? "—"}</Cell>
                  <Cell>{labelGender(item.anak?.gender)}</Cell>
                  <Cell>{item.row.kategoriUsia === 1 ? "v" : "-"}</Cell>
                  <Cell>{item.row.kategoriUsia === 2 ? "v" : "-"}</Cell>
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
                      <Cell key={bulan.nama}>
                        <span className={`${styles.badge} ${kelas}`}>{tanda}</span>
                      </Cell>
                    );
                  })}
                </Row>
              ))
            )}
          </TBody>
        </Table>
      </TableScroll>

      <TableScroll>
        <Table>
          <caption style={{ captionSide: "top", textAlign: "left", padding: "0.75rem 0" }}>
            Ringkasan kehadiran PAUD per bulan
          </caption>
          <THead>
            <Row>
              <HeaderCell>Bulan</HeaderCell>
              <HeaderCell>Hadir</HeaderCell>
              <HeaderCell>Tidak Hadir</HeaderCell>
              <HeaderCell>Belum</HeaderCell>
              <HeaderCell>Persentase Hadir</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {statistik.map((item) => (
              <Row key={item.nama}>
                <Cell>
                  <strong>{item.nama}</strong>
                </Cell>
                <Cell>{angka.format(item.hadir)}</Cell>
                <Cell>{angka.format(item.tidakHadir)}</Cell>
                <Cell>{angka.format(item.belum)}</Cell>
                <Cell>{angka.format(item.persentase)}%</Cell>
              </Row>
            ))}
          </TBody>
        </Table>
      </TableScroll>

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
              <TableScroll>
                <Table>
                  <THead>
                    <Row>
                      <HeaderCell>Kategori</HeaderCell>
                      <HeaderCell>Layanan</HeaderCell>
                      <HeaderCell>Frekuensi</HeaderCell>
                      <HeaderCell>Durasi</HeaderCell>
                      <HeaderCell>Target bulanan</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {KATEGORI_USIA_PAUD.map((item) => (
                      <Row key={item.value}>
                        <Cell>{item.label}</Cell>
                        <Cell>{item.value === 1 ? "Parenting orang tua" : "Kelas PAUD"}</Cell>
                        <Cell>{item.value === 1 ? "1x per bulan" : "2x per bulan"}</Cell>
                        <Cell>{item.value === 1 ? "2-3 jam" : "3-4 jam"}</Cell>
                        <Cell>
                          {item.value === 1 ? "Min. 80% kehadiran" : "Min. 85% kehadiran"}
                        </Cell>
                      </Row>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>
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
