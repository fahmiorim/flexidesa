import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import {
  BULAN_PAUD,
  KATEGORI_USIA_PAUD,
  STATUS_PAUD,
  type PaudRow,
  type Posyandu,
} from "@/features/kependudukan/kesehatan/domain/kesehatan";

import { hapusPaudAction, simpanPaudAction } from "./actions";
import { formatTanggal, tanggalPeriksaEfektif } from "./label";
import styles from "./stunting.module.css";

type BarisPaud = PaudRow & { createdAt?: Date | string | null };

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Tab sasaran PAUD 2-6 tahun.
 *
 * Field: nomor KIA,
 * posyandu, kategori usia (2 - <3 tahun / 3 - 6 tahun), dan status keikutsertaan
 * PAUD setiap bulan (Belum / Mengikuti / Tidak Mengikuti).
 */
export function BagianPaud({
  data,
  posyandu,
  posyanduNama,
  kiaNama,
  ubahId,
  bolehUbah,
  bolehHapus,
}: {
  data: readonly BarisPaud[];
  posyandu: readonly Posyandu[];
  posyanduNama: ReadonlyMap<number, string>;
  kiaNama: ReadonlyMap<number, { noKia: string; ibuName: string | null }>;
  ubahId: number | null;
  bolehUbah: boolean;
  bolehHapus: boolean;
}) {
  const diubah = ubahId === null ? null : (data.find((row) => row.id === ubahId) ?? null);

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Sasaran PAUD 2-6 Tahun</h2>
        <p>
          Pemantauan keikutsertaan anak usia 2 sampai 6 tahun pada layanan PAUD sebagai bagian paket
          pencegahan stunting.
        </p>
      </header>

      {bolehUbah ? (
        <details className={styles.formToggle} open={diubah !== null}>
          <summary>{diubah ? "Ubah sasaran PAUD" : "Tambah sasaran PAUD"}</summary>
          <form action={simpanPaudAction} className="form-stack">
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
                <span className="form-help">
                  Hanya KIA dengan anak berumur 24 bulan ke atas yang ditampilkan.
                </span>
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
                <span className="form-label">Kategori Usia</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.kategoriUsia ?? ""}
                  name="kategoriUsia"
                  required
                >
                  <option value="">— Pilih kategori usia —</option>
                  {KATEGORI_USIA_PAUD.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <fieldset className="form-field">
              <legend className="form-label">Status Keikutsertaan PAUD per Bulan</legend>
              <div className={styles.checkGrid}>
                {BULAN_PAUD.map((nama, index) => (
                  <label className="form-field" key={nama}>
                    <span className="form-label">{NAMA_BULAN[index]}</span>
                    <select
                      className="form-input"
                      defaultValue={diubah ? diubah[nama] : 1}
                      name={nama}
                    >
                      {STATUS_PAUD.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="penduduk-heading-actions">
              <Button variant="primary" type="submit">
                {diubah ? "Simpan Perubahan" : "Simpan Sasaran PAUD"}
              </Button>
            </div>
          </form>
        </details>
      ) : null}

      {data.length === 0 ? (
        <div className="modul-empty">
          <strong>Belum ada sasaran PAUD.</strong>
          <p>Tambahkan sasaran PAUD untuk anak usia 2 sampai 6 tahun.</p>
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
                <HeaderCell rowSpan={2}>Kategori Usia</HeaderCell>
                <HeaderCell colSpan={12}>Mengikuti Layanan PAUD</HeaderCell>
              </Row>
              <Row>
                {NAMA_BULAN.map((bulan) => (
                  <HeaderCell key={bulan}>{bulan}</HeaderCell>
                ))}
              </Row>
            </THead>
            <TBody>
              {data.map((row, index) => {
                const kia = kiaNama.get(row.kiaId);
                return (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>
                      <div className={styles.rowActions}>
                        {bolehUbah ? (
                          <ButtonLink
                            variant="ghost"
                            href={`/kependudukan/stunting?tab=paud&ubah=${row.id}`}
                          >
                            Ubah
                          </ButtonLink>
                        ) : null}
                        {bolehHapus ? (
                          <DialogHapusForm
                            aksi={hapusPaudAction}
                            id={row.id}
                            judul="Hapus data sasaran PAUD ini?"
                            keterangan="Data pemantauan PAUD akan dihapus permanen."
                            labelAksi="Hapus data PAUD"
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
                    <Cell>
                      {KATEGORI_USIA_PAUD.find((item) => item.value === row.kategoriUsia)?.label ??
                        "—"}
                    </Cell>
                    {BULAN_PAUD.map((nama) => {
                      const status = STATUS_PAUD.find((item) => item.value === row[nama]);
                      return <Cell key={nama}>{status?.label ?? "—"}</Cell>;
                    })}
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
