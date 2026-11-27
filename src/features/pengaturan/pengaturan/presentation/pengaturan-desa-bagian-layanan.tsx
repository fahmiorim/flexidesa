"use client";

import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";

import { FaqEditor } from "./pengaturan-desa-faq";
import { Field } from "./pengaturan-desa-field";
import { blankService, type Data, type FaqItem, type Layanan } from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

export function TabLayanan({
  data,
  service,
  setService,
  editingService,
  setEditingService,
  faqSurat,
  setFaqSurat,
  busy,
  save,
  saveService,
  removeService,
}: {
  data: Data;
  service: typeof blankService;
  setService: (nilai: typeof blankService) => void;
  editingService: number | null;
  setEditingService: (nilai: number | null) => void;
  faqSurat: FaqItem[];
  setFaqSurat: (nilai: FaqItem[]) => void;
  busy: boolean;
  save: (section: string, payload: unknown) => Promise<boolean>;
  saveService: () => Promise<void>;
  removeService: (item: Layanan) => Promise<void>;
}) {
  return (
    <section className={styles.panel}>
      <header>
        <h2>Layanan Desa</h2>
        <p>Kelola katalog layanan dan status tampilnya pada website publik.</p>
      </header>
      <div className={styles.serviceForm}>
        <Field label="Nama Layanan" required>
          <input
            value={service.nama}
            onChange={(e) => setService({ ...service, nama: e.target.value })}
          />
        </Field>
        <Field label="Kategori">
          <select
            value={service.kategori}
            onChange={(e) => setService({ ...service, kategori: e.target.value })}
          >
            <option value="administrasi">Administrasi</option>
            <option value="surat">Persuratan</option>
            <option value="sosial">Sosial</option>
            <option value="kependudukan">Kependudukan</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </Field>
        <Field label="Deskripsi">
          <input
            value={service.deskripsi}
            onChange={(e) => setService({ ...service, deskripsi: e.target.value })}
          />
        </Field>
        <Field label="Persyaratan">
          <input
            value={service.persyaratan}
            onChange={(e) => setService({ ...service, persyaratan: e.target.value })}
          />
        </Field>
        <Field label="Estimasi (hari)">
          <input
            type="number"
            min="0"
            max="365"
            value={service.estimasiHari}
            onChange={(e) => setService({ ...service, estimasiHari: Number(e.target.value) })}
          />
        </Field>
        <Field label="Biaya (Rp)">
          <input
            type="number"
            min="0"
            value={service.biaya}
            onChange={(e) => setService({ ...service, biaya: Number(e.target.value) })}
          />
        </Field>
        <Field label="Metode">
          <select
            value={service.metode}
            onChange={(e) => setService({ ...service, metode: e.target.value })}
          >
            <option value="online_dan_langsung">Online & Langsung</option>
            <option value="online">Online</option>
            <option value="langsung">Langsung</option>
          </select>
        </Field>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={service.aktif}
            onChange={(e) => setService({ ...service, aktif: e.target.checked })}
          />{" "}
          Aktif dan tampil publik
        </label>
        <div className={styles.actions}>
          <button
            className={styles.primary}
            disabled={busy || !service.nama.trim()}
            onClick={() => void saveService()}
          >
            {editingService ? "Simpan Perubahan" : "Tambah Layanan"}
          </button>
          {editingService && (
            <button
              className={styles.secondary}
              onClick={() => {
                setEditingService(null);
                setService({ ...blankService });
              }}
            >
              Batal
            </button>
          )}
        </div>
      </div>
      <TableScroll className={styles.tableWrap}>
        <Table>
          <THead>
            <Row>
              <HeaderCell>Nama Layanan</HeaderCell>
              <HeaderCell>Kategori</HeaderCell>
              <HeaderCell>Biaya</HeaderCell>
              <HeaderCell>Estimasi</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Aksi</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {data.layanan.map((item) => (
              <Row key={item.id}>
                <Cell>
                  <strong>{item.nama}</strong>
                  <small>{item.deskripsi}</small>
                </Cell>
                <Cell>{item.kategori}</Cell>
                <Cell>Rp {item.biaya.toLocaleString("id-ID")}</Cell>
                <Cell>{item.estimasiHari} hari</Cell>
                <Cell>
                  <span className={item.aktif ? styles.statusOn : styles.statusOff}>
                    {item.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </Cell>
                <Cell>
                  <button
                    onClick={() => {
                      setEditingService(item.id);
                      setService({
                        nama: item.nama,
                        kategori: item.kategori,
                        deskripsi: item.deskripsi ?? "",
                        persyaratan: item.persyaratan ?? "",
                        estimasiHari: item.estimasiHari,
                        biaya: item.biaya,
                        metode: item.metode,
                        aktif: item.aktif,
                      });
                    }}
                  >
                    Ubah
                  </button>{" "}
                  <button className={styles.textDanger} onClick={() => void removeService(item)}>
                    Nonaktifkan
                  </button>
                </Cell>
              </Row>
            ))}
          </TBody>
        </Table>
      </TableScroll>
      <p className={styles.muted}>
        Perubahan katalog layanan juga digunakan oleh modul Pelayanan Publik.
      </p>
      <FaqEditor
        judul="FAQ Layanan Surat"
        deskripsi="Pertanyaan umum yang tampil pada halaman layanan surat online desa ini. Kosongkan semua baris bila FAQ tidak ingin ditampilkan."
        items={faqSurat}
        onChange={setFaqSurat}
      />
      <div className={styles.actions}>
        <button
          className={styles.primary}
          disabled={busy}
          onClick={() => void save("faq-surat", faqSurat)}
        >
          Simpan FAQ Layanan Surat
        </button>
      </div>
    </section>
  );
}
