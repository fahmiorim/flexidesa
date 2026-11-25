import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  STATUS_GIZI_ANAK,
  STATUS_TIKAR_ANAK,
  type BulananAnakRow,
  type Posyandu,
} from "@/features/kesehatan/domain/kesehatan";

import { hapusAnakAction, simpanAnakAction } from "./actions";
import {
  cocokPeriode,
  formatTanggal,
  formatTanggalLahir,
  INDIKATOR_ANAK as INDIKATOR,
  NAMA_BULAN,
  periodeTahun,
  tanggalPeriksaEfektif,
  type KiaRingkas,
  type PendudukRingkas,
} from "./label";
import styles from "./stunting.module.css";

/** Baris database memuat `created_at` sebagai tanggal periksa. */
type BarisAnak = BulananAnakRow & { createdAt?: Date | string | null };

function labelTikar(nilai: number): { label: string; kelas: string | undefined } {
  if (nilai === 4) return { label: "Hijau", kelas: styles.badgeHijau };
  if (nilai === 3) return { label: "Kuning", kelas: styles.badgeKuning };
  if (nilai === 2) return { label: "Merah", kelas: styles.badgeMerah };
  return { label: "Tidak diukur", kelas: styles.badgeNetral };
}

/**
 * Tab pemantauan bulanan anak 0-2 tahun.
 *
 * Field mengikuti `pemantauan_anak_form.blade.php` OpenSID: No Register KIA,
 * posyandu, status gizi, umur (bulan), status tikar, imunisasi campak, berat
 * dan tinggi badan, serta sebelas indikator layanan.
 */
export function BagianAnak({
  data,
  posyandu,
  posyanduNama,
  kiaNama,
  filterPosyandu,
  filterBulan,
  filterTahun,
  penduduk,
  ubahId,
  bolehUbah,
  bolehHapus,
}: {
  data: readonly BarisAnak[];
  posyandu: readonly Posyandu[];
  posyanduNama: ReadonlyMap<number, string>;
  kiaNama: ReadonlyMap<number, KiaRingkas>;
  penduduk: readonly PendudukRingkas[];
  filterPosyandu: string;
  filterBulan: string;
  filterTahun: string;
  ubahId: number | null;
  bolehUbah: boolean;
  bolehHapus: boolean;
}) {
  const diubah = ubahId === null ? null : (data.find((row) => row.id === ubahId) ?? null);
  const baris = data.filter(
    (row) =>
      (filterPosyandu === "" || String(row.posyanduId) === filterPosyandu) &&
      cocokPeriode(
        tanggalPeriksaEfektif(row.tanggalPeriksa, row.createdAt),
        filterBulan,
        filterTahun,
      ),
  );
  const tahunTersedia = [
    ...new Set(
      data.map((row) => periodeTahun(tanggalPeriksaEfektif(row.tanggalPeriksa, row.createdAt))),
    ),
  ]
    .filter((nilai): nilai is number => nilai !== null)
    .sort((a, b) => b - a);
  const anakDari = new Map(penduduk.map((row) => [row.id, row]));

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Bulanan Anak 0-2 Tahun</h2>
        <p>Pemantauan tumbuh kembang anak lewat tikar pertumbuhan dan indikator layanan.</p>
      </header>

      <form className={styles.filterBar} method="get">
        <input name="tab" type="hidden" value="anak" />
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
        <label>
          Bulan
          <select className="form-input" defaultValue={filterBulan} name="bulan">
            <option value="">Semua bulan</option>
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
        <button className="button button-secondary" type="submit">
          Terapkan
        </button>
      </form>

      {bolehUbah ? (
        <details className={styles.formToggle} open={diubah !== null}>
          <summary>{diubah ? "Ubah pemantauan anak" : "Tambah pemantauan anak"}</summary>
          <form action={simpanAnakAction} className="form-stack">
            {diubah ? <input name="id" type="hidden" value={diubah.id} /> : null}
            <div className="modul-form-grid">
              <label className="form-field">
                <span className="form-label">No Register KIA</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.kiaId ?? ""}
                  name="kiaId"
                  required
                >
                  <option value="">— Pilih nomor KIA —</option>
                  {[...kiaNama.entries()].map(([id, item]) => (
                    <option key={id} value={id}>
                      {item.noKia}
                      {item.ibuName ? ` — ${item.ibuName}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Posyandu</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.posyanduId ?? ""}
                  name="posyanduId"
                  required
                >
                  <option value="">— Pilih posyandu —</option>
                  {posyandu.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.nama}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Tanggal Periksa</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.tanggalPeriksa ?? ""}
                  name="tanggalPeriksa"
                  type="date"
                />
                <span className="form-help">Kosongkan untuk memakai tanggal pencatatan.</span>
              </label>
              <label className="form-field">
                <span className="form-label">Status Gizi Anak</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.statusGizi ?? ""}
                  name="statusGizi"
                  required
                >
                  <option value="">— Pilih status gizi —</option>
                  {STATUS_GIZI_ANAK.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Umur (Bulan)</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.umurBulan ?? ""}
                  max={60}
                  min={0}
                  name="umurBulan"
                  required
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="form-label">Hasil Status Tikar</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.statusTikar ?? ""}
                  name="statusTikar"
                  required
                >
                  <option value="">— Pilih status tikar —</option>
                  {STATUS_TIKAR_ANAK.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Imunisasi Campak</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.pemberianImunisasiCampak ? "ya" : "tidak"}
                  name="pemberianImunisasiCampak"
                >
                  <option value="tidak">Tidak</option>
                  <option value="ya">Ya</option>
                </select>
                <span className="form-help">Hanya untuk anak berumur 6 bulan ke atas.</span>
              </label>
              <label className="form-field">
                <span className="form-label">Berat Badan (kg)</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.beratBadan ?? ""}
                  min={0}
                  name="beratBadan"
                  step="0.1"
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="form-label">Tinggi Badan (cm)</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.tinggiBadan ?? ""}
                  min={0}
                  name="tinggiBadan"
                  step="0.1"
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="form-label">Keterangan</span>
                <textarea
                  className="form-input"
                  defaultValue={diubah?.keterangan ?? ""}
                  maxLength={500}
                  name="keterangan"
                  placeholder="Masukkan keterangan"
                  rows={3}
                />
              </label>
            </div>

            <fieldset className="form-field">
              <legend className="form-label">Indikator Layanan</legend>
              <div className={styles.checkGrid}>
                {INDIKATOR.map((item) => (
                  <label className={styles.checkItem} key={item.key}>
                    <input
                      defaultChecked={diubah ? Boolean(diubah[item.key]) : false}
                      name={item.key}
                      type="checkbox"
                      value="ya"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="penduduk-heading-actions">
              <button className="button button-primary" type="submit">
                {diubah ? "Simpan Perubahan" : "Simpan Pemantauan"}
              </button>
            </div>
          </form>
        </details>
      ) : null}

      {baris.length === 0 ? (
        <div className="modul-empty">
          <strong>Belum ada data pemantauan anak.</strong>
          <p>Pastikan posyandu dan KIA sudah diisi sebelum menambah pemantauan anak.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan={2}>No.</th>
                <th rowSpan={2}>Aksi</th>
                <th rowSpan={2}>No KIA</th>
                <th rowSpan={2}>Nama Anak</th>
                <th rowSpan={2}>Jenis Kelamin</th>
                <th rowSpan={2}>Tanggal Lahir</th>
                <th rowSpan={2}>Posyandu</th>
                <th rowSpan={2}>Tanggal Periksa</th>
                <th rowSpan={2}>Status Gizi</th>
                <th rowSpan={2}>BB (kg)</th>
                <th rowSpan={2}>TB (cm)</th>
                <th rowSpan={2}>Keterangan</th>
                <th colSpan={2}>Umur dan Status Tikar</th>
                <th colSpan={11}>Indikator Layanan</th>
              </tr>
              <tr>
                <th>Umur (Bulan)</th>
                <th>Hasil (M/K/H)</th>
                {INDIKATOR.map((item) => (
                  <th key={item.key}>{item.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map((row, index) => {
                const kia = kiaNama.get(row.kiaId);
                const anakRow = kia?.anakId == null ? undefined : anakDari.get(kia.anakId);
                const tikar = labelTikar(row.statusTikar);
                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {bolehUbah ? (
                          <a
                            className="button button-ghost"
                            href={`/kesehatan/stunting?tab=anak&ubah=${row.id}`}
                          >
                            Ubah
                          </a>
                        ) : null}
                        {bolehHapus ? (
                          <form action={hapusAnakAction}>
                            <input name="id" type="hidden" value={row.id} />
                            <ConfirmSubmit
                              className="button button-danger"
                              message="Hapus data pemantauan anak ini?"
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                    <td>{kia?.noKia ?? "—"}</td>
                    <td>{anakRow?.name ?? "—"}</td>
                    <td>
                      {anakRow === undefined
                        ? "—"
                        : anakRow.gender === "male"
                          ? "Laki-laki"
                          : "Perempuan"}
                    </td>
                    <td>{formatTanggalLahir(anakRow?.birthDate)}</td>
                    <td>{posyanduNama.get(row.posyanduId) ?? "—"}</td>
                    <td>
                      {formatTanggal(tanggalPeriksaEfektif(row.tanggalPeriksa, row.createdAt))}
                    </td>
                    <td>
                      {STATUS_GIZI_ANAK.find((item) => item.value === row.statusGizi)?.label ?? "—"}
                    </td>
                    <td>{row.beratBadan ?? "—"}</td>
                    <td>{row.tinggiBadan ?? "—"}</td>
                    <td>{row.keterangan || "—"}</td>
                    <td>{row.umurBulan}</td>
                    <td>
                      <span className={`${styles.badge} ${tikar.kelas}`}>{tikar.label}</span>
                    </td>
                    {INDIKATOR.map((item) => (
                      <td key={item.key}>{row[item.key] ? "Ya" : "Tidak"}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
