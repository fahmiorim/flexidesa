"use client";

import Image from "next/image";

import { mediaUrl, type TemaOpsi } from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

/**
 * Form opsi tema tenant dari `config.json` paket tema aktif (ala OpenSID).
 *
 * Field dirender dari definisi paket — bukan daftar hardcode di UI — sehingga
 * tema baru yang menambah opsi otomatis muncul di sini. Tipe yang didukung
 * sama dengan konfigurasi OpenSID: color-picker, select, input-number,
 * input-text, dan unggah (media tenant, bukan source paket).
 */
export function TabOpsiTema({
  busy,
  data,
  opsi,
  setOpsi,
  save,
  upload,
  hapus,
}: {
  busy: boolean;
  data: TemaOpsi;
  opsi: Record<string, unknown>;
  setOpsi: (next: Record<string, unknown>) => void;
  save: (section: string, payload: unknown) => Promise<boolean>;
  upload: (key: string, file?: File) => Promise<void>;
  hapus: (key: string) => Promise<void>;
}) {
  const grup = [...new Set(data.definisi.map((item) => item.group))];

  function ubah(key: string, value: unknown) {
    setOpsi({ ...opsi, [key]: value });
  }

  return (
    <section className={styles.panel}>
      <header>
        <h2>Opsi Tema</h2>
        <p>
          Pengaturan dari paket tema <strong>{data.slug}</strong> v{data.versi}. Nilai divalidasi
          terhadap schema tema di server; opsi yang tidak dikenal akan diabaikan.
        </p>
      </header>

      {data.peringatan.length ? (
        <div className={styles.notice} role="status">
          {data.peringatan.join(" ")}
        </div>
      ) : null}

      {grup.map((namaGrup) => (
        <div key={namaGrup}>
          <h3>{namaGrup}</h3>
          <div className={styles.formGrid}>
            {data.definisi
              .filter((item) => item.group === namaGrup)
              .map((item) => {
                const nilai = opsi[item.key];
                const label = (
                  <>
                    <strong>{item.label}</strong>
                    {item.description ? <small>{item.description}</small> : null}
                  </>
                );
                if (item.type === "color-picker") {
                  const warna =
                    typeof nilai === "string" && /^#[0-9a-fA-F]{6}$/.test(nilai)
                      ? nilai
                      : String(item.default ?? "#000000");
                  return (
                    <label className={styles.field} key={item.key}>
                      {label}
                      <span className={styles.templatePreview + " " + styles.colorRow}>
                        <input
                          aria-label={item.label}
                          type="color"
                          value={warna}
                          onChange={(event) => ubah(item.key, event.target.value)}
                        />
                        <input
                          maxLength={7}
                          value={warna}
                          onChange={(event) => ubah(item.key, event.target.value)}
                        />
                      </span>
                    </label>
                  );
                }
                if (item.type === "select") {
                  const pilihan = Object.entries(item.options ?? {});
                  return (
                    <label className={styles.field} key={item.key}>
                      {label}
                      <select
                        value={String(nilai ?? item.default ?? "")}
                        onChange={(event) => ubah(item.key, event.target.value)}
                      >
                        {pilihan.map(([value, text]) => (
                          <option key={value} value={value}>
                            {text}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                if (item.type === "input-number") {
                  const batas = item.attributes ?? {};
                  return (
                    <label className={styles.field} key={item.key}>
                      {label}
                      <input
                        max={batas.max}
                        min={batas.min}
                        step={batas.step ?? 1}
                        type="number"
                        value={String(nilai ?? item.default ?? "")}
                        onChange={(event) => ubah(item.key, Number(event.target.value))}
                      />
                    </label>
                  );
                }
                if (item.type === "unggah") {
                  const path = typeof nilai === "string" ? nilai : null;
                  return (
                    <div className={styles.field} key={item.key}>
                      {label}
                      <div className={styles.uploadCard}>
                        {path ? (
                          <Image
                            src={mediaUrl(path)}
                            alt={item.label}
                            width={96}
                            height={96}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.uploadPlaceholder}>Belum ada gambar</div>
                        )}
                        <label className={styles.uploadButton}>
                          ↑ Unggah gambar
                          <input
                            accept="image/png,image/jpeg,image/webp"
                            type="file"
                            onChange={(event) => void upload(item.key, event.target.files?.[0])}
                          />
                        </label>
                        {path ? (
                          <button
                            className={styles.textDanger}
                            type="button"
                            onClick={() => void hapus(item.key)}
                          >
                            Hapus gambar
                          </button>
                        ) : null}
                        <small>JPG/PNG/WEBP · Maks. 2 MB</small>
                      </div>
                    </div>
                  );
                }
                return (
                  <label className={styles.field} key={item.key}>
                    {label}
                    <input
                      readOnly={item.readonly}
                      value={String(nilai ?? item.default ?? "")}
                      onChange={(event) => ubah(item.key, event.target.value)}
                    />
                  </label>
                );
              })}
          </div>
        </div>
      ))}

      <div className={styles.actions}>
        <button
          className={styles.primary}
          disabled={busy}
          type="button"
          onClick={() => void save("opsi-tema", { opsi })}
        >
          Simpan Opsi Tema
        </button>
        <span>Opsi disimpan per desa dan langsung dipakai situs publik.</span>
      </div>
    </section>
  );
}
