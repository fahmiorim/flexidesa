import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { getPemeliharaanPageData } from "@/features/pembangunan-aset/inventaris/application/inventaris-use-cases";
import {
  INVENTARIS_KONDISI_LABELS,
  MUTASI_JENIS_LABELS,
  MUTASI_STATUS_LABELS,
  MUTASI_STEP_LABELS,
  nextMutasiStep,
} from "@/features/pembangunan-aset/inventaris/domain/inventaris";

import {
  ajukanMutasiInventarisAction,
  buatJadwalPemeliharaanAction,
  hapusJadwalPemeliharaanAction,
  setujuiMutasiInventarisAction,
  tolakMutasiInventarisAction,
  ubahStatusPemeliharaanAction,
} from "../actions";
import styles from "../inventaris.module.css";

export const metadata = { title: "Mutasi & Pemeliharaan Aset" };
type Props = { searchParams: Promise<{ inventarisId?: string; jenis?: string }> };
const dateLabel = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(v + "T00:00:00Z"),
      )
    : "—";

export default async function MutasiPemeliharaanPage({ searchParams }: Props) {
  const p = await searchParams;
  const id = Number(p.inventarisId);
  const selected = Number.isSafeInteger(id) && id > 0 ? id : undefined;
  const data = await getPemeliharaanPageData();
  const selectedAsset = data.inventaris.find((x) => x.id === selected);
  const pending = data.mutasi.filter((x) => x.status === "diajukan").length;
  const scheduled = data.pemeliharaan.filter((x) => x.status === "terjadwal").length;
  const progress = data.pemeliharaan.filter((x) => x.status === "dalam_proses").length;
  const done = data.pemeliharaan.filter((x) => x.status === "selesai").length;
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Mutasi &amp; Pemeliharaan Aset</>}
        deskripsi={<>Perpindahan dan pemeliharaan aset desa.</>}
      />
      <section className={styles.metrics}>
        <article className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>Total Aset Aktif</span>
          <strong>{data.inventaris.length} jenis</strong>
          <small>Barang terdaftar</small>
        </article>
        <article className={styles.metric}>
          <span>Riwayat Mutasi</span>
          <strong>{data.mutasi.length} kejadian</strong>
          <small>{pending} menunggu persetujuan</small>
        </article>
        <article className={styles.metric}>
          <span>Pemeliharaan</span>
          <strong>{data.pemeliharaan.length} kegiatan</strong>
          <small>{progress} sedang dikerjakan</small>
        </article>
        <article className={styles.metric}>
          <span>Jadwal Terjadwal</span>
          <strong>{scheduled} agenda</strong>
          <small>Menunggu pelaksanaan</small>
        </article>
        <article className={styles.metric}>
          <span>Pemeliharaan Selesai</span>
          <strong>{done} kegiatan</strong>
          <small>Riwayat perawatan</small>
        </article>
      </section>
      <nav className={styles.tabs}>
        <a href="#riwayat-mutasi">Riwayat Mutasi</a>
        <a href="#pengajuan-mutasi">Mutasi Aset</a>
        <Link href="/inventaris/mutasi?jenis=hapus#pengajuan-mutasi">Penghapusan Aset</Link>
        <a href="#jadwal-pemeliharaan">Pemeliharaan Aset</a>
        <a href="#riwayat-pemeliharaan">Riwayat Pemeliharaan</a>
      </nav>
      <section className={styles.panel} id="riwayat-mutasi">
        <div className={styles.panelHead}>
          <div>
            <h2>Riwayat Mutasi Aset</h2>
            <p>
              Pengajuan pindah lokasi, perubahan kondisi, perbaikan, dan penghapusan dengan
              persetujuan berjenjang.
            </p>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <TableScroll>
            <Table className={styles.table}>
              <THead>
                <Row>
                  <HeaderCell>Tanggal</HeaderCell>
                  <HeaderCell>Kode Inventaris</HeaderCell>
                  <HeaderCell>Nama Aset</HeaderCell>
                  <HeaderCell>Jenis Mutasi</HeaderCell>
                  <HeaderCell>Detail</HeaderCell>
                  <HeaderCell>Pengaju</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Verifikasi / Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.mutasi.map((m) => {
                  const step = nextMutasiStep(m);
                  const allowed = step !== null && data.approverSteps.includes(step);
                  return (
                    <Row key={m.id}>
                      <Cell>{dateLabel(m.tanggalMutasi)}</Cell>
                      <Cell>{m.nomorInventaris ?? "—"}</Cell>
                      <Cell>{m.namaBarang ?? "Aset dihapus"}</Cell>
                      <Cell>{MUTASI_JENIS_LABELS[m.jenis]}</Cell>
                      <Cell>
                        {m.lokasiBaru ??
                          (m.kondisiBaru
                            ? INVENTARIS_KONDISI_LABELS[m.kondisiBaru]
                            : (m.alasan ?? "—"))}
                      </Cell>
                      <Cell>{m.diajukanOleh ?? "—"}</Cell>
                      <Cell>
                        <span
                          className={`${styles.tag} ${
                            m.status === "disetujui"
                              ? styles.good
                              : m.status === "ditolak"
                                ? styles.bad
                                : styles.warn
                          }`}
                        >
                          {MUTASI_STATUS_LABELS[m.status]}
                        </span>
                      </Cell>
                      <Cell>
                        {m.status === "diajukan" && allowed ? (
                          <div className={styles.actions}>
                            <form action={setujuiMutasiInventarisAction}>
                              <input type="hidden" name="id" value={m.id} />
                              <Button className={styles.primary} variant="primary">
                                Setujui · {MUTASI_STEP_LABELS[step]}
                              </Button>
                            </form>
                            <form action={tolakMutasiInventarisAction}>
                              <input type="hidden" name="id" value={m.id} />
                              <input
                                name="catatanPenolakan"
                                placeholder="Alasan penolakan"
                                required
                              />
                              <Button className={styles.secondary} variant="secondary">
                                Tolak
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <span className={styles.muted}>
                            {m.status === "diajukan"
                              ? "Menunggu " + (step ? MUTASI_STEP_LABELS[step] : "verifikasi")
                              : (m.disetujuiOleh ?? m.catatanPenolakan ?? "—")}
                          </span>
                        )}
                      </Cell>
                    </Row>
                  );
                })}
              </TBody>
            </Table>
          </TableScroll>
          {data.mutasi.length === 0 ? (
            <p className={styles.empty}>Belum ada riwayat mutasi aset.</p>
          ) : null}
        </div>
      </section>
      {data.canMutateCreate ? (
        <section className={styles.panel} id="pengajuan-mutasi">
          <div className={styles.panelHead}>
            <div>
              <h2>Ajukan Mutasi Aset / Penghapusan</h2>
              <p>Pengajuan akan melalui verifikasi operator, sekretaris desa, dan kepala desa.</p>
            </div>
          </div>
          <form action={ajukanMutasiInventarisAction} className={styles.form}>
            <label>
              Aset *
              <select name="inventarisId" required defaultValue={selected ?? ""}>
                <option value="">Pilih aset</option>
                {data.inventaris.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nomorInventaris ?? "INV-" + x.id} · {x.namaBarang} ({x.jumlah} {x.satuan})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jenis Mutasi *
              <select name="jenis" defaultValue={p.jenis === "hapus" ? "hapus" : "pindah"}>
                <option value="pindah">Pindah Lokasi</option>
                <option value="rusak">Perubahan Kondisi / Rusak</option>
                <option value="perbaikan">Perbaikan</option>
                <option value="hapus">Penghapusan</option>
              </select>
            </label>
            <label>
              Tanggal Mutasi *
              <input
                name="tanggalMutasi"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Jumlah Mutasi *
              <input
                name="jumlahMutasi"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={p.jenis === "hapus" && selectedAsset ? selectedAsset.jumlah : "1"}
                required
              />
            </label>
            <label>
              Lokasi Baru
              <input name="lokasiBaru" maxLength={150} />
            </label>
            <label>
              Kondisi Baru
              <select name="kondisiBaru">
                <option value="">Tidak berubah</option>
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
                <option value="dalam_perbaikan">Dalam Perbaikan</option>
              </select>
            </label>
            <label className={styles.wide}>
              Alasan Mutasi *<textarea name="alasan" rows={2} required />
            </label>
            <label className={styles.wide}>
              Keterangan Tambahan
              <textarea name="keterangan" rows={2} />
            </label>
            <Button className={styles.primary} variant="primary">
              Kirim Pengajuan
            </Button>
          </form>
        </section>
      ) : null}
      <section className={styles.panel} id="jadwal-pemeliharaan">
        <div className={styles.panelHead}>
          <div>
            <h2>Jadwal &amp; Pemeliharaan Aset</h2>
            <p>Kelola perawatan berkala, servis, perbaikan, biaya, dan hasil pekerjaan.</p>
          </div>
        </div>
        <div className={styles.grid}>
          <div>
            <h2 style={{ fontSize: 13, marginBottom: 10 }}>Jadwal Pemeliharaan</h2>
            {data.pemeliharaan.length ? (
              <div className={styles.timeline}>
                {data.pemeliharaan.map((x) => (
                  <article key={x.id}>
                    <strong>
                      {x.jenis} · {x.namaBarang ?? "Aset"}
                    </strong>
                    <small>
                      {dateLabel(x.tanggalRencana)} · {x.pelaksana ?? "Pelaksana belum ditentukan"}
                    </small>
                    <small>
                      {x.deskripsi ?? "Tidak ada deskripsi"} · Biaya {formatRupiah(x.biaya)}
                    </small>
                    <div className={styles.actions} style={{ marginTop: 8 }}>
                      {data.canWrite && x.status !== "selesai" && x.status !== "dibatalkan" ? (
                        <form action={ubahStatusPemeliharaanAction}>
                          <input type="hidden" name="id" value={x.id} />
                          <input
                            name="jenis"
                            aria-label="Jenis pemeliharaan"
                            defaultValue={x.jenis}
                          />
                          <input
                            type="date"
                            name="tanggalRencana"
                            aria-label="Tanggal rencana"
                            defaultValue={x.tanggalRencana}
                          />
                          <input
                            name="biaya"
                            type="number"
                            min="0"
                            step="0.01"
                            aria-label="Biaya"
                            defaultValue={x.biaya}
                          />
                          <input
                            name="pelaksana"
                            aria-label="Pelaksana"
                            defaultValue={x.pelaksana ?? ""}
                          />
                          <input
                            name="deskripsi"
                            aria-label="Deskripsi"
                            defaultValue={x.deskripsi ?? ""}
                          />
                          <select name="status" defaultValue={x.status}>
                            <option value="terjadwal">Terjadwal</option>
                            <option value="dalam_proses">Dalam Proses</option>
                            <option value="selesai">Selesai</option>
                            <option value="dibatalkan">Dibatalkan</option>
                          </select>
                          <input
                            type="date"
                            name="tanggalSelesai"
                            defaultValue={x.tanggalSelesai ?? ""}
                          />
                          <input
                            name="hasil"
                            placeholder="Hasil pekerjaan"
                            defaultValue={x.hasil ?? ""}
                          />
                          <select name="kondisiSetelah" defaultValue={x.kondisiSetelah ?? ""}>
                            <option value="">Pilih kondisi akhir (wajib jika selesai)</option>
                            <option value="baik">Baik</option>
                            <option value="rusak_ringan">Rusak Ringan</option>
                            <option value="rusak_berat">Rusak Berat</option>
                            <option value="dalam_perbaikan">Dalam Perbaikan</option>
                          </select>
                          <Button className={styles.secondary} variant="secondary">
                            Perbarui
                          </Button>
                        </form>
                      ) : null}
                      {data.canManage ? (
                        <DialogHapusForm
                          aksi={hapusJadwalPemeliharaanAction}
                          id={x.id}
                          judul={`Hapus jadwal pemeliharaan "${x.jenis} · ${x.namaBarang ?? "Aset"}"?`}
                          keterangan="Jadwal pemeliharaan akan dihapus permanen dari riwayat aset."
                          labelAksi="Hapus jadwal"
                        />
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Belum ada jadwal pemeliharaan.</p>
            )}
          </div>
          {data.canCreate ? (
            <div>
              <h2 style={{ fontSize: 13, marginBottom: 10 }}>Tambah Jadwal</h2>
              <form
                action={buatJadwalPemeliharaanAction}
                className={styles.form}
                style={{ gridTemplateColumns: "1fr" }}
              >
                <label>
                  Aset *
                  <select name="inventarisId" required>
                    <option value="">Pilih aset</option>
                    {data.inventaris.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.namaBarang}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Jenis Pemeliharaan *
                  <input name="jenis" required placeholder="Servis berkala / perawatan rutin" />
                </label>
                <label>
                  Tanggal Rencana *<input name="tanggalRencana" type="date" required />
                </label>
                <label>
                  Estimasi Biaya (Rp)
                  <input name="biaya" type="number" min="0" step="0.01" defaultValue="0" />
                </label>
                <label>
                  Pelaksana
                  <input name="pelaksana" />
                </label>
                <label>
                  Deskripsi
                  <textarea name="deskripsi" rows={3} />
                </label>
                <Button className={styles.primary} variant="primary">
                  Tambah Jadwal
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </section>
      <section className={styles.panel} id="riwayat-pemeliharaan">
        <div className={styles.panelHead}>
          <div>
            <h2>Riwayat Pemeliharaan</h2>
            <p>
              Jejak penambahan, perubahan status, pembaruan biaya, dan penghapusan jadwal beserta
              petugasnya.
            </p>
          </div>
        </div>
        {data.riwayatPemeliharaan.length ? (
          <div className={styles.timeline}>
            {data.riwayatPemeliharaan.map((h) => (
              <article key={h.id}>
                <strong>
                  {h.namaBarang ?? "Aset"} · {h.jenis ?? "Pemeliharaan"} ·{" "}
                  {h.aksi === "dibuat"
                    ? "Jadwal dibuat"
                    : h.aksi === "diperbarui"
                      ? "Jadwal diperbarui"
                      : "Jadwal dihapus"}
                </strong>
                <small>
                  {dateLabel(h.createdAt.toISOString().slice(0, 10))} · {h.dilakukanOleh}
                </small>
                <small>
                  {h.statusSebelum ?? "—"} → {h.statusSesudah ?? "—"} ·{" "}
                  {h.ringkasan ?? "Tidak ada catatan"}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Belum ada aktivitas pemeliharaan yang tercatat.</p>
        )}
      </section>
    </main>
  );
}
