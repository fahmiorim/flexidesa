import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { getInventarisPageData } from "@/features/pembangunan-aset/inventaris/application/inventaris-use-cases";
import { INVENTARIS_KONDISI_LABELS } from "@/features/pembangunan-aset/inventaris/domain/inventaris";

import styles from "../inventaris.module.css";

export const metadata = { title: "Pengelolaan Aset" };

export default async function PengelolaanAsetPage() {
  const data = await getInventarisPageData("");
  const total = data.rows.reduce((s, x) => s + Number(x.nilaiAkhir ?? 0), 0);
  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Pengelolaan Aset</>}
        deskripsi={<>Perolehan, nilai, dan riwayat aset desa.</>}
      />
      <section className={styles.metrics}>
        <article className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>Total Aset</span>
          <strong>{data.total} Barang</strong>
          <small>Catatan aset aktif</small>
        </article>
        <article className={styles.metric}>
          <span>Nilai Aset</span>
          <strong>{formatRupiah(total.toFixed(2))}</strong>
          <small>Nilai tercatat</small>
        </article>
        <article className={styles.metric}>
          <span>Penanggung Jawab</span>
          <strong>{data.rows.filter((x) => x.penanggungJawab).length}</strong>
          <small>Aset memiliki penanggung jawab</small>
        </article>
        <article className={styles.metric}>
          <span>Tanpa Penanggung Jawab</span>
          <strong>{data.rows.filter((x) => !x.penanggungJawab).length}</strong>
          <small>Perlu dilengkapi</small>
        </article>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>Detail Pengelolaan Aset</h2>
            <p>
              Pilih aset untuk memperbarui informasi perolehan, penanggung jawab, dokumen, dan
              riwayatnya.
            </p>
          </div>
          {data.canCreate ? (
            <Link className={styles.primary} href="/inventaris#tambah">
              ＋ Tambah Aset
            </Link>
          ) : null}
        </div>
        <div className={styles.tableWrap}>
          <TableScroll>
            <Table className={styles.table}>
              <THead>
                <Row>
                  <HeaderCell>Kode Inventaris</HeaderCell>
                  <HeaderCell>Nama Aset</HeaderCell>
                  <HeaderCell>Perolehan</HeaderCell>
                  <HeaderCell>Penanggung Jawab</HeaderCell>
                  <HeaderCell>Lokasi</HeaderCell>
                  <HeaderCell>Kondisi</HeaderCell>
                  <HeaderCell>Nilai Perolehan</HeaderCell>
                  <HeaderCell>Nilai Buku</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((x) => (
                  <Row key={x.id}>
                    <Cell>{x.nomorInventaris ?? "—"}</Cell>
                    <Cell>
                      <strong>{x.namaBarang}</strong>
                      <small style={{ display: "block" }} className={styles.muted}>
                        {x.merk ?? ""} {x.tipe ?? ""}
                      </small>
                    </Cell>
                    <Cell>{x.tanggalPembelian ?? x.tahunPembelian ?? "—"}</Cell>
                    <Cell>
                      {x.penanggungJawab ?? "Belum ditetapkan"}
                      <small style={{ display: "block" }} className={styles.muted}>
                        {x.jabatanPenanggungJawab ?? ""}
                      </small>
                    </Cell>
                    <Cell>{x.lokasi ?? "—"}</Cell>
                    <Cell>
                      <span
                        className={`${styles.tag} ${
                          x.kondisi === "baik"
                            ? styles.good
                            : x.kondisi === "rusak_berat"
                              ? styles.bad
                              : styles.warn
                        }`}
                      >
                        {INVENTARIS_KONDISI_LABELS[x.kondisi]}
                      </span>
                    </Cell>
                    <Cell>{formatRupiah(x.nilaiAkhir ?? "0")}</Cell>
                    <Cell>{formatRupiah(x.nilaiBuku ?? x.nilaiAkhir ?? "0")}</Cell>
                    <Cell>
                      <div className={styles.actions}>
                        <Link href={"/inventaris/" + x.id}>Detail</Link>
                        {data.canUpdate ? (
                          <Link href={"/inventaris/" + x.id + "?edit=1"}>Edit</Link>
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {data.rows.length === 0 ? (
            <p className={styles.empty}>Belum ada aset yang tercatat.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
