"use client";

import { FaqEditor } from "./pengaturan-desa-faq";
import { Field } from "./pengaturan-desa-field";
import type { FaqItem, Kontak } from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

export function TabKontak({
  contact,
  setContact,
  faqKontak,
  setFaqKontak,
  busy,
  save,
}: {
  contact: Kontak;
  setContact: (nilai: Kontak) => void;
  faqKontak: FaqItem[];
  setFaqKontak: (nilai: FaqItem[]) => void;
  busy: boolean;
  save: (section: string, payload: unknown) => Promise<boolean>;
}) {
  return (
    <section className={styles.panel}>
      <header>
        <h2>Kontak & Lokasi</h2>
        <p>
          Kanal kontak yang ditampilkan pada halaman kontak publik. Alamat dan koordinat kantor
          diatur di Identitas Desa.
        </p>
      </header>
      <div className={styles.formGrid}>
        <Field label="Telepon Kantor">
          <input
            value={contact.telepon}
            onChange={(e) => setContact({ ...contact, telepon: e.target.value })}
          />
        </Field>
        <Field label="Nomor WhatsApp">
          <input
            value={contact.whatsapp}
            onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
          />
        </Field>
        <Field label="Nomor Ponsel Operator">
          <input
            value={contact.nomorOperator}
            onChange={(e) => setContact({ ...contact, nomorOperator: e.target.value })}
            placeholder="Kontak operasional harian"
          />
        </Field>
        <Field label="Email Resmi">
          <input
            type="email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={contact.website}
            onChange={(e) => setContact({ ...contact, website: e.target.value })}
          />
        </Field>
        <Field label="Jam Pelayanan">
          <input
            value={contact.jamLayanan}
            onChange={(e) => setContact({ ...contact, jamLayanan: e.target.value })}
            placeholder="Senin–Jumat, 08.00–16.00"
          />
        </Field>
        <Field label="Tautan Google Maps">
          <input
            type="url"
            value={contact.tautanPeta}
            onChange={(e) => setContact({ ...contact, tautanPeta: e.target.value })}
          />
        </Field>
        <Field label="Instagram">
          <input
            value={contact.instagram}
            onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
          />
        </Field>
        <Field label="Facebook">
          <input
            value={contact.facebook}
            onChange={(e) => setContact({ ...contact, facebook: e.target.value })}
          />
        </Field>
        <Field label="YouTube">
          <input
            value={contact.youtube}
            onChange={(e) => setContact({ ...contact, youtube: e.target.value })}
          />
        </Field>
        <Field label="Nama Kontak Pemberitahuan">
          <input
            value={contact.kontakPemberitahuanNama}
            onChange={(e) => setContact({ ...contact, kontakPemberitahuanNama: e.target.value })}
            placeholder="Nama petugas yang dihubungi"
          />
        </Field>
        <Field label="HP/WA Kontak Pemberitahuan">
          <input
            value={contact.kontakPemberitahuanTelepon}
            onChange={(e) => setContact({ ...contact, kontakPemberitahuanTelepon: e.target.value })}
          />
        </Field>
        <Field label="Jabatan Kontak Pemberitahuan">
          <input
            value={contact.kontakPemberitahuanJabatan}
            onChange={(e) => setContact({ ...contact, kontakPemberitahuanJabatan: e.target.value })}
            placeholder="Contoh: Kasi Pemerintahan"
          />
        </Field>
      </div>
      <FaqEditor
        judul="FAQ Halaman Kontak"
        deskripsi="Pertanyaan umum yang tampil pada halaman kontak publik desa ini. Kosongkan semua baris bila FAQ tidak ingin ditampilkan."
        items={faqKontak}
        onChange={setFaqKontak}
      />
      <div className={styles.actions}>
        <button
          className={styles.primary}
          disabled={busy}
          onClick={() => void save("kontak", contact)}
        >
          Simpan Kontak & Lokasi
        </button>
        <button
          className={styles.secondary}
          disabled={busy}
          onClick={() => void save("faq-kontak", faqKontak)}
        >
          Simpan FAQ Kontak
        </button>
        {contact.tautanPeta && (
          <a
            className={styles.secondary}
            href={contact.tautanPeta}
            target="_blank"
            rel="noreferrer"
          >
            Lihat Peta ↗
          </a>
        )}
      </div>
    </section>
  );
}
