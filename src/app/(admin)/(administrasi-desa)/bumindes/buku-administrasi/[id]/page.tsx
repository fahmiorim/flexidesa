import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { getBukuDetailData } from "@/features/administrasi-desa/bumindes/application/buku-umum";
import { formatTanggalIndonesia } from "@/features/administrasi-desa/bumindes/domain/buku-resmi";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { todayIsoDate } from "@/lib/forms";

import { hapusItemBukuAction, simpanItemBukuAction } from "../actions";
import styles from "../bumindes.module.css";

export const metadata = { title: "Lembar Buku Administrasi" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; saved?: string; deleted?: string }>;
};

const tanggal = (value: string | null) => (value ? formatTanggalIndonesia(value) || value : "—");

export default async function DetailBukuAdministrasiPage({ params, searchParams }: Props) {
  const [{ id: idParam }, query] = await Promise.all([params, searchParams]);
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const user = await requirePermission(RESOURCES.bumindes, "read");
  const data = await getBukuDetailData(id);
  if (!data) notFound();

  const { buku, items, nomorUrutBerikutnya } = data;
  const bisaTambah = hasPermission(user.permissions, RESOURCES.bumindes, "create");
  const bisaUbah = hasPermission(user.permissions, RESOURCES.bumindes, "update");
  const bisaHapus = hasPermission(user.permissions, RESOURCES.bumindes, "delete");

  const editId = query.edit ? Number(query.edit) : null;
  const editItem =
    editId !== null && Number.isSafeInteger(editId)
      ? (items.find((item) => item.id === editId) ?? null)
      : null;
  const bisaIsi = editItem ? bisaUbah : bisaTambah;
  const nomorForm = editItem?.nomorUrut ?? nomorUrutBerikutnya;

  return (
    <main className={styles.page}>
      <nav className={styles.crumb} aria-label="Breadcrumb">
        <Link href="/bumindes/buku-administrasi">Buku Administrasi</Link>
        <span aria-hidden="true">/</span>
        <span>{buku.kodeBuku}</span>
      </nav>

      <PageHeading
        judul={<>{buku.namaBuku}</>}
        deskripsi={<>{buku.uraian ?? "Buku administrasi resmi desa."}</>}
        aksi={
          <>
            <div className="page-heading-actions">
              <Link className={styles.ghost} href="/bumindes/buku-administrasi">
                ← Daftar buku
              </Link>
              <a
                className={styles.secondary}
                href={`/bumindes/buku-administrasi/${buku.id}/ekspor`}
                download
              >
                Unduh CSV
              </a>
              <Link
                className={styles.primary}
                href={`/bumindes/buku-administrasi/${buku.id}/cetak`}
                target="_blank"
                rel="noreferrer"
              >
                Cetak buku
              </Link>
            </div>
          </>
        }
      />

      {query.saved ? <p className={styles.notice}>Catatan buku berhasil disimpan.</p> : null}
      {query.deleted ? <p className={styles.notice}>Catatan buku berhasil dihapus.</p> : null}

      <div className={styles.detailMeta}>
        <span className={styles.badge}>Kode {buku.kodeBuku}</span>
        <span className={`${styles.badge} ${styles.badgeNeutral}`}>{items.length} catatan</span>
        <span className={`${styles.badge} ${styles.badgeNeutral}`}>
          Nomor berikutnya {nomorUrutBerikutnya}
        </span>
      </div>

      <section className={styles.panel} aria-labelledby="daftar-catatan">
        <div className={styles.panelHead}>
          <div>
            <h2 id="daftar-catatan">Daftar catatan</h2>
            <p>
              Catatan disusun menurut nomor urut. Gunakan tombol ubah atau hapus pada setiap baris.
            </p>
          </div>
          {bisaTambah && !editItem ? (
            <a className={styles.secondary} href="#form-buku">
              ＋ Tambah catatan
            </a>
          ) : null}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No.</th>
                <th>Tanggal</th>
                <th>Uraian</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={5}>
                    Belum ada catatan pada buku ini.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.number}>{item.nomorUrut}</td>
                    <td>{tanggal(item.tanggal)}</td>
                    <td className={styles.uraian}>{item.uraian}</td>
                    <td className={styles.keterangan}>{item.keterangan ?? "—"}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {bisaUbah ? <Link href={`?edit=${item.id}#form-buku`}>Ubah</Link> : null}
                        {bisaHapus ? (
                          <details>
                            <summary className={styles.summaryDanger}>Hapus</summary>
                            <div className={styles.confirmBox}>
                              <form action={hapusItemBukuAction}>
                                <input name="id" type="hidden" value={item.id} />
                                <button className={styles.danger} type="submit">
                                  Ya, hapus
                                </button>
                              </form>
                              <small>Catatan yang dihapus tidak dapat dikembalikan.</small>
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} id="form-buku" aria-labelledby="judul-form">
        <div className={styles.panelHead}>
          <div>
            <h2 id="judul-form">
              {editItem ? `Ubah catatan nomor ${editItem.nomorUrut}` : "Tambah catatan"}
            </h2>
            <p>
              {editItem
                ? "Perubahan disimpan langsung ke buku desa."
                : "Nomor urut harus unik di dalam buku ini."}
            </p>
          </div>
        </div>

        {bisaIsi ? (
          <form action={simpanItemBukuAction} className={styles.form}>
            <input name="bukuId" type="hidden" value={buku.id} />
            {editItem ? <input name="id" type="hidden" value={editItem.id} /> : null}
            <div className={styles.formRow}>
              <label>
                Nomor urut
                <input defaultValue={nomorForm} min={1} name="nomorUrut" required type="number" />
              </label>
              <label>
                Tanggal
                <input
                  defaultValue={editItem ? (editItem.tanggal ?? "") : todayIsoDate()}
                  name="tanggal"
                  type="date"
                />
              </label>
            </div>
            <label>
              Uraian
              <textarea
                defaultValue={editItem?.uraian ?? ""}
                maxLength={500}
                name="uraian"
                placeholder="Tuliskan isi catatan buku..."
                required
                rows={3}
              />
            </label>
            <label>
              Keterangan
              <textarea
                defaultValue={editItem?.keterangan ?? ""}
                maxLength={2000}
                name="keterangan"
                placeholder="Keterangan tambahan (opsional)"
                rows={2}
              />
            </label>
            <div className={styles.formActions}>
              <button className={styles.primary} type="submit">
                {editItem ? "Simpan perubahan" : "Tambah catatan"}
              </button>
              {editItem ? (
                <Link className={styles.ghost} href={`/bumindes/buku-administrasi/${buku.id}`}>
                  Batal
                </Link>
              ) : null}
            </div>
          </form>
        ) : (
          <p className={styles.muted}>Anda hanya memiliki akses baca untuk buku ini.</p>
        )}
      </section>
    </main>
  );
}
