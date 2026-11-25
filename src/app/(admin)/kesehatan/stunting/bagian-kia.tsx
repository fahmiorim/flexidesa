import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import type { KiaRow } from "@/features/kesehatan/domain/kesehatan";

import { hapusKiaAction, simpanKiaAction } from "./actions";
import styles from "./stunting.module.css";

/**
 * Tab KIA — buku Kesehatan Ibu dan Anak.
 *
 * Field mengikuti form OpenSID (`kia_form.blade.php`): Nomor KIA, Nama Ibu,
 * Nama Anak, dan Hari Perkiraan Lahir. Ibu dan anak dipilih dari data penduduk
 * desa agar rujukannya tetap valid terhadap tenant.
 */
export function BagianKia({
  kia,
  penduduk,
  ubahId,
  bolehUbah,
  bolehHapus,
  ibuHamil,
  anak,
}: {
  kia: readonly KiaRow[];
  penduduk: readonly { id: number; name: string; nationalId: string | null }[];
  ubahId: number | null;
  bolehUbah: boolean;
  bolehHapus: boolean;
  ibuHamil: readonly { kiaId: number }[];
  anak: readonly { kiaId: number }[];
}) {
  const diubah = ubahId === null ? null : (kia.find((row) => row.id === ubahId) ?? null);
  const nama = new Map(penduduk.map((row) => [row.id, row.name]));
  const labelPenduduk = (row: { id: number; name: string; nationalId: string | null }) =>
    row.nationalId ? `${row.name} — ${row.nationalId}` : row.name;

  /** KIA yang sudah dipakai pemantauan tidak boleh dihapus (FK restrict). */
  const terpakai = new Set([...ibuHamil, ...anak].map((row) => row.kiaId));

  return (
    <section className="platform-card data-panel">
      <header className={styles.panelHead}>
        <h2>Kesehatan Ibu dan Anak (KIA)</h2>
        <p>Nomor buku KIA menghubungkan ibu dengan anak yang dipantau di posyandu.</p>
      </header>

      {bolehUbah ? (
        <details className={styles.formToggle} open={diubah !== null}>
          <summary>{diubah ? `Ubah KIA: ${diubah.noKia}` : "Tambah KIA"}</summary>
          <form action={simpanKiaAction} className="form-stack">
            {diubah ? <input name="id" type="hidden" value={diubah.id} /> : null}
            <div className="modul-form-grid">
              <label className="form-field">
                <span className="form-label">Nomor KIA</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.noKia ?? ""}
                  maxLength={30}
                  name="noKia"
                  placeholder="Masukkan nomor KIA"
                  required
                />
              </label>
              <label className="form-field">
                <span className="form-label">Nama Ibu</span>
                <select
                  className="form-input"
                  defaultValue={diubah?.ibuId ?? ""}
                  name="ibuId"
                  required
                >
                  <option value="">— Cari NIK / Nama Ibu —</option>
                  {penduduk.map((row) => (
                    <option key={row.id} value={row.id}>
                      {labelPenduduk(row)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="form-label">Nama Anak</span>
                <select className="form-input" defaultValue={diubah?.anakId ?? ""} name="anakId">
                  <option value="">— Belum ditentukan —</option>
                  {penduduk.map((row) => (
                    <option key={row.id} value={row.id}>
                      {labelPenduduk(row)}
                    </option>
                  ))}
                </select>
                <span className="form-help">Boleh dikosongkan bila anak belum lahir.</span>
              </label>
              <label className="form-field">
                <span className="form-label">Hari Perkiraan Lahir</span>
                <input
                  className="form-input"
                  defaultValue={diubah?.hariPerkiraanLahir ?? ""}
                  name="hariPerkiraanLahir"
                  type="date"
                />
              </label>
            </div>
            <div className="penduduk-heading-actions">
              <button className="button button-primary" type="submit">
                {diubah ? "Simpan Perubahan" : "Simpan KIA"}
              </button>
            </div>
          </form>
        </details>
      ) : null}

      {kia.length === 0 ? (
        <div className="modul-empty">
          <strong>Belum ada buku KIA.</strong>
          <p>Tambahkan KIA agar pemantauan ibu hamil dan anak dapat dicatat.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Aksi</th>
                <th>Nomor KIA</th>
                <th>Nama Ibu</th>
                <th>Nama Anak</th>
                <th>Perkiraan Lahir</th>
              </tr>
            </thead>
            <tbody>
              {kia.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className={styles.rowActions}>
                      {bolehUbah ? (
                        <a
                          className="button button-ghost"
                          href={`/kesehatan/stunting?tab=kia&ubah=${row.id}`}
                        >
                          Ubah
                        </a>
                      ) : null}
                      {bolehHapus && !terpakai.has(row.id) ? (
                        <form action={hapusKiaAction}>
                          <input name="id" type="hidden" value={row.id} />
                          <ConfirmSubmit
                            className="button button-danger"
                            message={`Hapus KIA ${row.noKia}?`}
                          >
                            Hapus
                          </ConfirmSubmit>
                        </form>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <strong>{row.noKia}</strong>
                  </td>
                  <td>{row.ibuName ?? nama.get(row.ibuId) ?? "—"}</td>
                  <td>{row.anakId === null ? "—" : (nama.get(row.anakId) ?? "—")}</td>
                  <td>{row.hariPerkiraanLahir ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
