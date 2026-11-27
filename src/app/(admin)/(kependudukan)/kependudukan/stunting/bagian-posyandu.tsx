import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import type { Posyandu } from "@/features/kependudukan/kesehatan/domain/kesehatan";

import { hapusPosyanduAction, simpanPosyanduAction } from "./actions";
import styles from "./stunting.module.css";

/**
 * Tab Posyandu — daftar posyandu desa.
 *
 * Field mengikuti form OpenSID (`posyandu_form.blade.php`): nama dan alamat.
 * Nama ketua dan nama bidan ditambahkan karena kolomnya sudah ada di FlexiDesa dan
 * dipakai sebagai kontak posyandu.
 */
export function BagianPosyandu({
  posyandu,
  ubahId,
  bolehUbah,
  bolehHapus,
}: {
  posyandu: readonly Posyandu[];
  ubahId: number | null;
  bolehUbah: boolean;
  bolehHapus: boolean;
}) {
  const diubah = ubahId === null ? null : (posyandu.find((row) => row.id === ubahId) ?? null);

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Posyandu</h2>
        <p>Daftar posyandu yang menjadi lokasi pemantauan ibu hamil dan anak.</p>
      </header>

      {bolehUbah ? (
        <details className={styles.formToggle} open={diubah !== null}>
          <summary>{diubah ? `Ubah posyandu: ${diubah.nama}` : "Tambah posyandu"}</summary>
          <form action={simpanPosyanduAction} className="form-stack">
            {diubah ? <input name="id" type="hidden" value={diubah.id} /> : null}
            <div className="modul-form-grid">
              <label className="form-field">
                <span className="form-label">Nama Posyandu</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.nama ?? ""}
                  maxLength={100}
                  name="nama"
                  placeholder="Masukkan nama posyandu"
                  required
                />
              </label>
              <label className="form-field">
                <span className="form-label">Alamat</span>
                <textarea
                  className="form-input"
                  defaultValue={diubah?.alamat ?? ""}
                  maxLength={200}
                  name="alamat"
                  placeholder="Masukkan alamat posyandu"
                  rows={3}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Nama Ketua</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.namaKetua ?? ""}
                  maxLength={100}
                  name="namaKetua"
                  placeholder="Nama ketua posyandu"
                />
              </label>
              <label className="form-field">
                <span className="form-label">Nama Bidan</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.namaBidan ?? ""}
                  maxLength={100}
                  name="namaBidan"
                  placeholder="Nama bidan desa"
                />
              </label>
            </div>
            <div className="penduduk-heading-actions">
              <Button variant="primary" type="submit">
                {diubah ? "Simpan Perubahan" : "Simpan Posyandu"}
              </Button>
            </div>
          </form>
        </details>
      ) : null}

      {posyandu.length === 0 ? (
        <div className="modul-empty">
          <strong>Belum ada posyandu.</strong>
          <p>Tambahkan posyandu sebelum mengisi pemantauan ibu hamil dan anak.</p>
        </div>
      ) : (
        <TableScroll>
          <Table>
            <THead>
              <Row>
                <HeaderCell>No.</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
                <HeaderCell>Nama Posyandu</HeaderCell>
                <HeaderCell>Alamat</HeaderCell>
                <HeaderCell>Ketua</HeaderCell>
                <HeaderCell>Bidan</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {posyandu.map((row, index) => (
                <Row key={row.id}>
                  <Cell>{index + 1}</Cell>
                  <Cell>
                    <div className={styles.rowActions}>
                      {bolehUbah ? (
                        <ButtonLink
                          variant="ghost"
                          href={`/kependudukan/stunting?tab=posyandu&ubah=${row.id}`}
                        >
                          Ubah
                        </ButtonLink>
                      ) : null}
                      {bolehHapus ? (
                        <DialogHapusForm
                          aksi={hapusPosyanduAction}
                          id={row.id}
                          judul={`Hapus posyandu "${row.nama}"?`}
                          keterangan="Posyandu akan dihapus permanen dari data kesehatan desa."
                          labelAksi="Hapus posyandu"
                        />
                      ) : null}
                    </div>
                  </Cell>
                  <Cell>
                    <strong>{row.nama}</strong>
                  </Cell>
                  <Cell>{row.alamat || "—"}</Cell>
                  <Cell>{row.namaKetua || "—"}</Cell>
                  <Cell>{row.namaBidan || "—"}</Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      )}
    </section>
  );
}
