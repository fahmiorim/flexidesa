import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { formatRupiah } from "@/features/keuangan-desa/keuangan/domain/keuangan";
import { getInventarisTablePageData } from "@/features/pembangunan-aset/inventaris/application/inventaris-use-cases";
import {
  INVENTARIS_KATEGORI_LABELS,
  INVENTARIS_KONDISI_LABELS,
} from "@/features/pembangunan-aset/inventaris/domain/inventaris";

import { hapusKategoriInventarisAction } from "./actions";
import { simpanInventarisFormAction, simpanKategoriInventarisFormAction } from "./form-actions";
import styles from "./inventaris.module.css";

export const metadata = { title: "Daftar Inventaris" };
type Props = {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    lokasi?: string;
    kondisi?: string;
    page?: string;
  }>;
};

export default async function DaftarInventarisPage({ searchParams }: Props) {
  const p = await searchParams;
  const q = (p.q ?? "").trim().slice(0, 100);
  const pageRaw = Number(p.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 10;
  const kategoriId = p.kategori && /^\d+$/.test(p.kategori) ? Number(p.kategori) : undefined;
  const data = await getInventarisTablePageData({
    search: q,
    kategoriId,
    lokasi: p.lokasi,
    kondisi: p.kondisi,
    page,
    pageSize,
  });
  const pageCount = Math.max(1, Math.ceil(data.total / pageSize));
  const current = data.currentPage;
  const rows = data.rows;
  const totalUnit = data.summaryRows.reduce((s, x) => s + Number(x.jumlah), 0);
  const totalValue = data.summaryRows.reduce((s, x) => s + Number(x.nilaiAkhir ?? 0), 0);
  const count = (k: string) =>
    data.summaryRows.filter((x) => x.kondisi === k).reduce((s, x) => s + Number(x.jumlah), 0);
  const params = (n: number) =>
    new URLSearchParams({
      q,
      kategori: p.kategori ?? "",
      lokasi: p.lokasi ?? "",
      kondisi: p.kondisi ?? "",
      page: String(n),
    }).toString();

  const formInventaris = (
    <>
      <label>
        Nama Barang *<input name="namaBarang" required maxLength={200} />
      </label>
      <label>
        Nomor Inventaris
        <input name="nomorInventaris" maxLength={50} />
      </label>
      <label>
        Kategori
        <select name="kategoriId">
          <option value="">Tanpa kategori</option>
          {data.kategori.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </label>
      <label>
        Merk
        <input name="merk" maxLength={100} />
      </label>
      <label>
        Tipe
        <input name="tipe" maxLength={100} />
      </label>
      <label>
        Kode Barang
        <input name="kodeBarang" maxLength={50} />
      </label>
      <label>
        Jumlah *
        <input name="jumlah" type="number" min="0.01" step="0.01" defaultValue="1" required />
      </label>
      <label>
        Satuan
        <input name="satuan" defaultValue="unit" maxLength={20} />
      </label>
      <label>
        Harga Satuan (Rp)
        <input name="hargaSatuan" type="number" min="0" step="0.01" />
      </label>
      <label>
        Saldo Awal Penyusutan (Rp)
        <input name="akumulasiPenyusutan" type="number" min="0" step="0.01" defaultValue="0" />
      </label>
      <label>
        Umur Manfaat (bulan)
        <input name="umurManfaatBulan" type="number" min="1" max="1200" placeholder="Contoh: 60" />
      </label>
      <label>
        Nilai Residu (Rp)
        <input name="nilaiResidu" type="number" min="0" step="0.01" defaultValue="0" />
      </label>
      <label>
        Tanggal Mulai Penyusutan
        <input name="tanggalMulaiPenyusutan" type="date" />
      </label>
      <label>
        Tanggal Perolehan
        <input name="tanggalPembelian" type="date" />
      </label>
      <label>
        Tahun Perolehan
        <input name="tahunPembelian" type="number" min="1900" max="2100" />
      </label>
      <label>
        Asal Perolehan
        <select name="asal">
          <option value="">Pilih asal</option>
          <option value="pembelian">Pembelian</option>
          <option value="hibah">Hibah</option>
          <option value="bantuan_pemerintah">Bantuan Pemerintah</option>
          <option value="sumbangan">Sumbangan</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </label>
      <label>
        Donatur / Penyedia
        <input name="donatur" maxLength={150} />
      </label>
      <label>
        Penanggung Jawab
        <input name="penanggungJawab" maxLength={150} />
      </label>
      <label>
        Jabatan Penanggung Jawab
        <input name="jabatanPenanggungJawab" maxLength={100} />
      </label>
      <label>
        Telepon Penanggung Jawab
        <input name="teleponPenanggungJawab" maxLength={30} />
      </label>
      <label>
        Lokasi
        <input name="lokasi" maxLength={150} />
      </label>
      <label>
        Kondisi
        <select name="kondisi">
          <option value="baik">Baik</option>
          <option value="rusak_ringan">Rusak Ringan</option>
          <option value="rusak_berat">Rusak Berat</option>
          <option value="dalam_perbaikan">Dalam Perbaikan</option>
        </select>
      </label>
      <label>
        Spesifikasi
        <textarea name="spesifikasi" rows={2} />
      </label>
      <label>
        Keterangan
        <textarea name="keterangan" rows={2} />
      </label>
    </>
  );

  const formKategori = (kategori: (typeof data.kategori)[number] | null) => (
    <>
      {kategori ? <input type="hidden" name="id" value={kategori.id} /> : null}
      <label>
        Kode Kategori
        <input defaultValue={kategori?.kode ?? ""} name="kode" required maxLength={20} />
      </label>
      <label>
        Nama Kategori
        <input defaultValue={kategori?.nama ?? ""} name="nama" required maxLength={150} />
      </label>
      <label>
        Golongan
        <select defaultValue={kategori?.golongan ?? ""} name="golongan">
          {Object.entries(INVENTARIS_KATEGORI_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Keterangan
        <input name="keterangan" />
      </label>
    </>
  );

  return (
    <main className={styles.page}>
      <PageHeading
        judul={<>Daftar Inventaris</>}
        deskripsi={<>Data inventaris dan aset desa.</>}
        aksi={
          <div className={styles.actions}>
            <Link className={styles.secondary} href="/inventaris/dashboard">
              Dashboard Aset
            </Link>
            <Link className={styles.secondary} href="/inventaris/pengelolaan">
              Pengelolaan Aset
            </Link>
          </div>
        }
      />
      <section className={styles.metrics}>
        <article className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>Total Inventaris</span>
          <strong>{totalUnit.toLocaleString("id-ID")} Unit</strong>
          <small>{data.summaryRows.length} catatan barang aktif</small>
        </article>
        <article className={styles.metric}>
          <span>Baik</span>
          <strong>{count("baik").toLocaleString("id-ID")} Unit</strong>
          <small>{totalUnit ? ((count("baik") / totalUnit) * 100).toFixed(1) : "0"}%</small>
        </article>
        <article className={styles.metric}>
          <span>Perlu Perhatian</span>
          <strong>
            {(
              count("rusak_ringan") +
              count("rusak_berat") +
              count("dalam_perbaikan")
            ).toLocaleString("id-ID")}{" "}
            Unit
          </strong>
          <small>Rusak atau sedang diperbaiki</small>
        </article>
        <article className={styles.metric}>
          <span>Nilai Total Aset</span>
          <strong>{formatRupiah(totalValue.toFixed(2))}</strong>
          <small>Akumulasi nilai tercatat</small>
        </article>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>Data Inventaris</h2>
            <p>
              Gunakan filter untuk menemukan aset. Klik kode atau nama barang untuk melihat detail.
            </p>
          </div>
          <div className={styles.actions}>
            <ButtonLink variant="secondary" href="/inventaris/laporan/ekspor">
              Export CSV ↓
            </ButtonLink>
            {data.canCreate ? (
              <FormDialog
                aksi={simpanInventarisFormAction}
                deskripsi="Isi data barang, perolehan, kondisi, dan nilai aset."
                judul="Tambah Inventaris"
                label="＋ Tambah Inventaris"
                labelSimpan="Simpan Inventaris"
              >
                {formInventaris}
              </FormDialog>
            ) : null}
          </div>
        </div>
        <form method="get" className={styles.filters}>
          <input
            aria-label="Cari inventaris"
            name="q"
            placeholder="Cari kode, nama barang, atau merek..."
            defaultValue={q}
          />
          <select aria-label="Filter kategori" name="kategori" defaultValue={p.kategori ?? ""}>
            <option value="">Semua Kategori</option>
            {data.kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
          <select aria-label="Filter lokasi" name="lokasi" defaultValue={p.lokasi ?? ""}>
            <option value="">Semua Lokasi</option>
            {data.locations.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select aria-label="Filter kondisi" name="kondisi" defaultValue={p.kondisi ?? ""}>
            <option value="">Semua Kondisi</option>
            {Object.entries(INVENTARIS_KONDISI_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button type="submit">Filter</Button>
          <ButtonLink variant="secondary" href="/inventaris">
            Reset
          </ButtonLink>
        </form>
        <div className={styles.tableWrap}>
          <TableScroll>
            <Table className={styles.table}>
              <THead>
                <Row>
                  <HeaderCell>No.</HeaderCell>
                  <HeaderCell>Kode Inventaris</HeaderCell>
                  <HeaderCell>Nama Barang</HeaderCell>
                  <HeaderCell>Kategori</HeaderCell>
                  <HeaderCell>Lokasi</HeaderCell>
                  <HeaderCell>Kondisi</HeaderCell>
                  <HeaderCell>Jumlah</HeaderCell>
                  <HeaderCell>Nilai Satuan</HeaderCell>
                  <HeaderCell>Total Nilai</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((x, i) => (
                  <Row key={x.id}>
                    <Cell>{(current - 1) * pageSize + i + 1}</Cell>
                    <Cell>
                      <Link href={"/inventaris/" + x.id}>
                        {x.nomorInventaris ?? x.kodeBarang ?? "—"}
                      </Link>
                    </Cell>
                    <Cell>
                      <Link href={"/inventaris/" + x.id}>{x.namaBarang}</Link>
                      <small className={styles.muted} style={{ display: "block" }}>
                        {[x.merk, x.tipe].filter(Boolean).join(" ")}
                      </small>
                    </Cell>
                    <Cell>{x.kategoriNama ?? "Tanpa kategori"}</Cell>
                    <Cell>{x.lokasi ?? "—"}</Cell>
                    <Cell>
                      <span
                        className={`${styles.tag} ${
                          x.kondisi === "baik"
                            ? styles.good
                            : x.kondisi === "rusak_ringan"
                              ? styles.warn
                              : styles.bad
                        }`}
                      >
                        {INVENTARIS_KONDISI_LABELS[x.kondisi]}
                      </span>
                    </Cell>
                    <Cell>
                      {Number(x.jumlah).toLocaleString("id-ID")} {x.satuan}
                    </Cell>
                    <Cell>{formatRupiah(x.hargaSatuan ?? "0")}</Cell>
                    <Cell>{formatRupiah(x.nilaiAkhir ?? "0")}</Cell>
                    <Cell>
                      <div className={styles.actions}>
                        <Link href={"/inventaris/" + x.id}>Detail</Link>
                        {data.canUpdate ? (
                          <Link href={"/inventaris/" + x.id + "?edit=1"}>Edit</Link>
                        ) : null}
                        {data.canMutateCreate ? (
                          <Link href={"/inventaris/mutasi?inventarisId=" + x.id + "&jenis=hapus"}>
                            Ajukan Penghapusan
                          </Link>
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {rows.length === 0 ? (
            <p className={styles.empty}>Tidak ada inventaris yang sesuai filter.</p>
          ) : null}
        </div>
        <div className={styles.pagination}>
          <span>
            Menampilkan {data.total ? (current - 1) * pageSize + 1 : 0}–
            {Math.min(current * pageSize, data.total)} dari {data.total} data
          </span>
          <div className={styles.actions}>
            {current > 1 ? (
              <ButtonLink
                aria-label="Halaman sebelumnya"
                className={styles.secondary}
                href={"/inventaris?" + params(current - 1)}
                variant="ghost"
              >
                ←
              </ButtonLink>
            ) : null}
            <strong>
              {current} / {pageCount}
            </strong>
            {current < pageCount ? (
              <ButtonLink
                aria-label="Halaman berikutnya"
                className={styles.secondary}
                href={"/inventaris?" + params(current + 1)}
                variant="ghost"
              >
                →
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>
      {data.canWrite || data.canManage ? (
        <TableCard
          actions={
            data.canCreate ? (
              <FormDialog
                aksi={simpanKategoriInventarisFormAction}
                deskripsi="Tambahkan klasifikasi aset baru untuk desa ini."
                judul="Tambah Kategori"
                label="Tambah Kategori"
                labelSimpan="Tambah Kategori"
              >
                {formKategori(null)}
              </FormDialog>
            ) : null
          }
          description={`${data.kategori.length} kategori aset terdaftar.`}
          title="Kategori Inventaris"
        >
          {data.kategori.length === 0 ? (
            <p className={styles.empty}>Belum ada kategori inventaris.</p>
          ) : (
            <TableScroll>
              <Table>
                <THead>
                  <Row>
                    <HeaderCell scope="col">Kategori</HeaderCell>
                    <HeaderCell scope="col">Kode</HeaderCell>
                    <HeaderCell scope="col">Golongan</HeaderCell>
                    <HeaderCell scope="col">Aksi</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {data.kategori.map((k) => (
                    <Row key={k.id}>
                      <Cell>
                        <strong>{k.nama}</strong>
                      </Cell>
                      <Cell>{k.kode}</Cell>
                      <Cell>{INVENTARIS_KATEGORI_LABELS[k.golongan]}</Cell>
                      <Cell>
                        <div className={styles.actions}>
                          {data.canUpdate ? (
                            <FormDialog
                              aksi={simpanKategoriInventarisFormAction}
                              deskripsi={`Ubah kode, nama, dan golongan kategori ${k.nama}.`}
                              judul="Ubah Kategori"
                              label="Ubah"
                              labelSimpan="Simpan"
                              varian="secondary"
                            >
                              {formKategori(k)}
                            </FormDialog>
                          ) : null}
                          {data.canManage ? (
                            <DialogHapusForm
                              aksi={hapusKategoriInventarisAction}
                              id={k.id}
                              judul={`Hapus kategori "${k.nama}"?`}
                              keterangan="Kategori hanya dapat dihapus bila tidak dipakai barang inventaris."
                              labelAksi="Hapus kategori"
                            />
                          ) : null}
                        </div>
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          )}
        </TableCard>
      ) : null}
    </main>
  );
}
