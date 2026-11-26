"use client";

import Image from "next/image";

import { TabIntro } from "./identitas-desa-bagian";
import { Field } from "./pengaturan-desa-field";
import {
  mediaUrl,
  type Data,
  type MediaField,
  type ProfilForm,
  type Sebutan,
} from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

export function TabAdat({
  data,
  profile,
  setProfile,
  sebutan,
  upload,
  deleteMedia,
}: {
  data: Data;
  profile: ProfilForm;
  setProfile: (nilai: ProfilForm) => void;
  sebutan: Sebutan;
  upload: (field: MediaField, file?: File, ukuran?: string) => Promise<void>;
  deleteMedia: (field: MediaField) => Promise<void>;
}) {
  return (
    <>
      <TabIntro
        step="06"
        title="Status & adat"
        description="Status desa adat beserta kelembagaan, struktur, dan regulasinya."
      />
      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Status & kelembagaan</h3>
          <p>Data ini dipakai pada profil publik dan dokumen penetapan adat.</p>
        </div>
        <div className={styles.formGrid}>
          <Field label={`Status ${sebutan.desa}`}>
            <select
              value={profile.statusDesa}
              onChange={(e) => setProfile({ ...profile, statusDesa: e.target.value })}
            >
              <option value="">Belum ditentukan</option>
              <option value="Adat">Adat</option>
              <option value="Bukan Adat">Bukan Adat</option>
            </select>
          </Field>
          <Field label="Lembaga Adat">
            <input
              value={profile.lembagaAdat}
              onChange={(e) => setProfile({ ...profile, lembagaAdat: e.target.value })}
              placeholder="Majelis adat, dewan adat"
            />
          </Field>
          <div className={styles.fieldWide}>
            <Field label={`Regulasi Penetapan ${sebutan.desa} Adat`}>
              <input
                value={profile.regulasiPenetapanKampungAdat}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    regulasiPenetapanKampungAdat: e.target.value,
                  })
                }
                placeholder="Nomor SK/Perda"
              />
            </Field>
          </div>
        </div>

        <div className={styles.mediaRow}>
          {data.profil?.strukturAdat ? (
            <Image
              className={styles.officeThumb}
              src={mediaUrl(data.profil.strukturAdat)}
              alt="Struktur adat"
              width={148}
              height={84}
              unoptimized
            />
          ) : (
            <div className={styles.officePlaceholder}>Belum ada gambar</div>
          )}
          <div className={styles.mediaActions}>
            <label className={styles.uploadButton}>
              {data.profil?.strukturAdat ? "Ganti struktur adat" : "Unggah struktur adat"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void upload("struktur-adat", e.target.files?.[0])}
              />
            </label>
            {data.profil?.strukturAdat && (
              <button
                type="button"
                className={styles.textDanger}
                onClick={() => void deleteMedia("struktur-adat")}
              >
                Hapus gambar
              </button>
            )}
            <small>JPG, PNG, WEBP · Maks. 5 MB</small>
          </div>
        </div>

        <div className={styles.mediaRow}>
          {data.profil?.dokumenRegulasiPenetapanKampungAdat ? (
            <a
              className={styles.secondary}
              href={mediaUrl(data.profil.dokumenRegulasiPenetapanKampungAdat)}
              target="_blank"
              rel="noreferrer"
            >
              Lihat dokumen regulasi ↗
            </a>
          ) : (
            <span className={styles.officePlaceholder}>Belum ada PDF</span>
          )}
          <div className={styles.mediaActions}>
            <label className={styles.uploadButton}>
              {data.profil?.dokumenRegulasiPenetapanKampungAdat
                ? "Ganti dokumen PDF"
                : "Unggah dokumen PDF"}
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => void upload("dokumen-adat", e.target.files?.[0])}
              />
            </label>
            {data.profil?.dokumenRegulasiPenetapanKampungAdat && (
              <button
                type="button"
                className={styles.textDanger}
                onClick={() => void deleteMedia("dokumen-adat")}
              >
                Hapus PDF
              </button>
            )}
            <small>PDF · Maks. 20 MB</small>
          </div>
        </div>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Wilayah & aturan adat</h3>
          <p>Jelaskan wilayah adat dan aturan yang berlaku di dalamnya.</p>
        </div>
        <Field label="Wilayah Adat">
          <textarea
            rows={4}
            value={profile.wilayahAdat}
            onChange={(e) => setProfile({ ...profile, wilayahAdat: e.target.value })}
            placeholder="Deskripsi wilayah adat di desa"
          />
        </Field>
        <Field label="Peraturan Adat">
          <textarea
            rows={4}
            value={profile.peraturanAdat}
            onChange={(e) => setProfile({ ...profile, peraturanAdat: e.target.value })}
            placeholder="Deskripsi peraturan adat yang berlaku"
          />
        </Field>
      </div>
    </>
  );
}
