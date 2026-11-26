"use client";

import { Field } from "./pengaturan-desa-field";
import type { FaqItem } from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

export function FaqEditor({
  judul,
  deskripsi,
  items,
  onChange,
}: {
  judul: string;
  deskripsi: string;
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}) {
  function ubah(index: number, field: "q" | "a", value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }
  return (
    <div className={styles.tabSection}>
      <div className={styles.sectionHeading}>
        <h3>{judul}</h3>
        <p>{deskripsi}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className={styles.formGrid}>
          <Field label="Pertanyaan">
            <input value={item.q} onChange={(e) => ubah(index, "q", e.target.value)} />
          </Field>
          <Field label="Jawaban">
            <textarea rows={3} value={item.a} onChange={(e) => ubah(index, "a", e.target.value)} />
          </Field>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.textDanger}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Hapus FAQ ini
            </button>
          </div>
        </div>
      ))}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => onChange([...items, { q: "", a: "" }])}
        >
          + Tambah FAQ
        </button>
      </div>
    </div>
  );
}
