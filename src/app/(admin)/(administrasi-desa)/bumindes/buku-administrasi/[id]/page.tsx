import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getBukuDetailData } from "@/features/administrasi-desa/bumindes/application/buku-umum";
import { formatTanggalIndonesia } from "@/features/administrasi-desa/bumindes/domain/buku-resmi";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { todayIsoDate } from "@/lib/forms";

import { hapusItemBukuAction } from "../actions";
import styles from "../bumindes.module.css";
import { simpanItemBukuFormAction } from "./form-actions";

export const metadata = { title: "Lembar Buku Administrasi" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string }>;
};

const tanggal = (value: string | null) => (value ? formatTanggalIndonesia(value) || value : "—");

type ItemRow =
  Awaited<ReturnType<typeof getBukuDetailData>> extends { items: (infer T)[] } | null ? T : never;

function formItem(bukuId: number, nomorDefault: number, item: ItemRow | null) {
  return (
    <div className="modul-form-grid">
      <input name="bukuId" type="hidden" value={bukuId} />
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <FormField
        defaultValue={item?.nomorUrut ?? nomorDefault}
        label="Nomor urut"
        min={1}
        name="nomorUrut"
        required
        type="number"
      />
      <FormField
        defaultValue={item ? (item.tanggal ?? "") : todayIsoDate()}
        label="Tanggal"
        name="tanggal"
        type="date"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={item?.uraian ?? ""}
        kind="textarea"
        label="Uraian"
        maxLength={500}
        name="uraian"
        placeholder="Tuliskan isi catatan buku..."
        required
        rows={3}
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={item?.keterangan ?? ""}
        kind="textarea"
        label="Keterangan"
        maxLength={2000}
        name="keterangan"
        placeholder="Keterangan tambahan (opsional)"
        rows={2}
      />
    </div>
  );
}

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

      <TableCard
        actions={
          bisaTambah ? (
            <FormDialog
              aksi={simpanItemBukuFormAction}
              deskripsi="Nomor urut harus unik di dalam buku ini."
              judul="Tambah catatan"
              label="＋ Tambah catatan"
              labelSimpan="Tambah catatan"
            >
              {formItem(buku.id, nomorUrutBerikutnya, null)}
            </FormDialog>
          ) : null
        }
        description="Catatan disusun menurut nomor urut."
        title="Daftar catatan"
      >
        <TableScroll className={styles.tableWrap}>
          <Table className={styles.table}>
            <THead>
              <Row>
                <HeaderCell>No.</HeaderCell>
                <HeaderCell>Tanggal</HeaderCell>
                <HeaderCell>Uraian</HeaderCell>
                <HeaderCell>Keterangan</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {items.length === 0 ? (
                <Row>
                  <Cell className={styles.empty} colSpan={5}>
                    Belum ada catatan pada buku ini.
                  </Cell>
                </Row>
              ) : (
                items.map((item) => (
                  <Row key={item.id}>
                    <Cell className={styles.number}>{item.nomorUrut}</Cell>
                    <Cell>{tanggal(item.tanggal)}</Cell>
                    <Cell className={styles.uraian}>{item.uraian}</Cell>
                    <Cell className={styles.keterangan}>{item.keterangan ?? "—"}</Cell>
                    <Cell>
                      <div className={styles.rowActions}>
                        {bisaUbah ? (
                          <FormDialog
                            aksi={simpanItemBukuFormAction}
                            deskripsi={`Ubah catatan nomor ${item.nomorUrut}.`}
                            judul="Ubah catatan"
                            label="Ubah"
                            labelSimpan="Simpan perubahan"
                            varian="secondary"
                          >
                            {formItem(buku.id, nomorUrutBerikutnya, item)}
                          </FormDialog>
                        ) : null}
                        {bisaHapus ? (
                          <DialogHapusForm
                            aksi={hapusItemBukuAction}
                            id={item.id}
                            judul={`Hapus catatan nomor ${item.nomorUrut}?`}
                            keterangan="Catatan yang dihapus tidak dapat dikembalikan."
                            labelAksi="Hapus catatan"
                          />
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))
              )}
            </TBody>
          </Table>
        </TableScroll>
        {!bisaUbah && !bisaHapus && !bisaTambah ? (
          <p className={styles.muted}>Anda hanya memiliki akses baca untuk buku ini.</p>
        ) : null}
      </TableCard>
    </main>
  );
}
