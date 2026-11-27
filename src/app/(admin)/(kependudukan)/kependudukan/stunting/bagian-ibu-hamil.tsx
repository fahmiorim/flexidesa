import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  STATUS_KEHAMILAN,
  type IbuHamilRow,
  type Posyandu,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";

import { hapusIbuHamilAction, simpanIbuHamilAction } from "./actions";
import {
  cocokPeriode,
  formatTanggal,
  INDIKATOR_IBU_HAMIL as INDIKATOR,
  NAMA_BULAN,
  periodeTahun,
  tanggalPeriksaEfektif,
  type KiaRingkas,
} from "./label";
import styles from "./stunting.module.css";

/** Baris database memuat `created_at` sebagai tanggal periksa. */
type BarisIbu = IbuHamilRow & { createdAt?: Date | string | null };

/**
 * Tab pemantauan bulanan ibu hamil.
 *
 * Field mengikuti `pemantauan_ibu_hamil_form.blade.php` OpenSID: No Register
 * KIA, posyandu, status kehamilan, usia kehamilan, tanggal melahirkan, butir
 * pil Fe, dan delapan indikator layanan konvergensi.
 */
export function BagianIbuHamil({
  data,
  posyandu,
  posyanduNama,
  kiaNama,
  filterPosyandu,
  filterBulan,
  filterTahun,
  ubahId,
  bolehUbah,
  bolehHapus,
}: {
  data: readonly BarisIbu[];
  posyandu: readonly Posyandu[];
  posyanduNama: ReadonlyMap<number, string>;
  kiaNama: ReadonlyMap<number, KiaRingkas>;
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

  const labelKehamilan = (nilai: number | null) =>
    STATUS_KEHAMILAN.find((item) => item.value === nilai)?.label ?? "—";

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Bulanan Ibu Hamil</h2>
        <p>Pemantauan bulanan ibu hamil beserta indikator layanan pencegahan stunting.</p>
      </header>

      <form className={styles.filterBar} method="get">
        <input name="tab" type="hidden" value="ibu-hamil" />
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
        <Button variant="secondary" type="submit">
          Terapkan
        </Button>
      </form>

      {bolehUbah ? (
        <details className={styles.formToggle} open={diubah !== null}>
          <summary>{diubah ? "Ubah pemantauan ibu hamil" : "Tambah pemantauan ibu hamil"}</summary>
          <form action={simpanIbuHamilAction} className="form-stack">
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
                <span className="form-label">Status Kehamilan</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.statusKehamilan ?? ""}
                  name="statusKehamilan"
                >
                  <option value="">— Pilih status —</option>
                  {STATUS_KEHAMILAN.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Usia Kehamilan (Bulan)</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.usiaKehamilan ?? ""}
                  max={42}
                  min={0}
                  name="usiaKehamilan"
                  type="number"
                />
              </label>
              <label className="form-field">
                <span className="form-label">Tanggal Melahirkan</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.tanggalMelahirkan ?? ""}
                  name="tanggalMelahirkan"
                  type="date"
                />
              </label>
              <label className="form-field">
                <span className="form-label">Berapa Butir Pil Fe</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.butirPilFe ?? ""}
                  min={0}
                  name="butirPilFe"
                  type="number"
                />
              </label>
            </div>

            <fieldset className="form-field">
              <legend className="form-label">Status Penerimaan Indikator</legend>
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
              <Button variant="primary" type="submit">
                {diubah ? "Simpan Perubahan" : "Simpan Pemantauan"}
              </Button>
            </div>
          </form>
        </details>
      ) : null}

      {baris.length === 0 ? (
        <div className="modul-empty">
          <strong>Belum ada data pemantauan ibu hamil.</strong>
          <p>Pastikan posyandu dan KIA sudah diisi sebelum menambah pemantauan.</p>
        </div>
      ) : (
        <TableScroll>
          <Table>
            <THead>
              <Row>
                <HeaderCell rowSpan={2}>No.</HeaderCell>
                <HeaderCell rowSpan={2}>Aksi</HeaderCell>
                <HeaderCell rowSpan={2}>No KIA</HeaderCell>
                <HeaderCell rowSpan={2}>Nama Ibu</HeaderCell>
                <HeaderCell rowSpan={2}>Posyandu</HeaderCell>
                <HeaderCell rowSpan={2}>Tanggal Periksa</HeaderCell>
                <HeaderCell rowSpan={2}>Status Kehamilan</HeaderCell>
                <HeaderCell colSpan={2}>Usia Kehamilan dan Persalinan</HeaderCell>
                <HeaderCell colSpan={8}>Status Penerimaan Indikator</HeaderCell>
              </Row>
              <Row>
                <HeaderCell>Usia (Bulan)</HeaderCell>
                <HeaderCell>Tanggal Melahirkan</HeaderCell>
                {INDIKATOR.map((item) => (
                  <HeaderCell key={item.key}>{item.label}</HeaderCell>
                ))}
              </Row>
            </THead>
            <TBody>
              {baris.map((row, index) => {
                const kia = kiaNama.get(row.kiaId);
                return (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>
                      <div className={styles.rowActions}>
                        {bolehUbah ? (
                          <ButtonLink
                            variant="ghost"
                            href={`/kependudukan/stunting?tab=ibu-hamil&ubah=${row.id}`}
                          >
                            Ubah
                          </ButtonLink>
                        ) : null}
                        {bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusIbuHamilAction}
                            id={row.id}
                            judul="Hapus data pemantauan ibu hamil ini?"
                            keterangan="Data pemantauan ibu hamil akan dihapus permanen."
                            labelAksi="Hapus data"
                          />
                        ) : null}
                      </div>
                    </Cell>
                    <Cell>{kia?.noKia ?? "—"}</Cell>
                    <Cell>{kia?.ibuName ?? "—"}</Cell>
                    <Cell>{posyanduNama.get(row.posyanduId) ?? "—"}</Cell>
                    <Cell>
                      {formatTanggal(tanggalPeriksaEfektif(row.tanggalPeriksa, row.createdAt))}
                    </Cell>
                    <Cell>{labelKehamilan(row.statusKehamilan)}</Cell>
                    <Cell>{row.usiaKehamilan ?? "—"}</Cell>
                    <Cell>{row.tanggalMelahirkan ?? "—"}</Cell>
                    {INDIKATOR.map((item) => (
                      <Cell key={item.key}>{row[item.key] ? "Ya" : "Tidak"}</Cell>
                    ))}
                  </Row>
                );
              })}
            </TBody>
          </Table>
        </TableScroll>
      )}
    </section>
  );
}
