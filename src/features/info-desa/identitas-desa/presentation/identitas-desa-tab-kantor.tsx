"use client";

import Image from "next/image";
import Link from "next/link";

import { normalisasiTipePeta } from "@/features/info-desa/wilayah/domain/wilayah";
import { Field } from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa-field";
import {
  mediaUrl,
  type Data,
  type MediaField,
  type ProfilForm,
} from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa-types";
import styles from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa.module.css";

import { TabIntro } from "./identitas-desa-bagian";
import { PemilihKoordinatKantor } from "./pemilih-koordinat-kantor";

export function TabKantor({
  data,
  profile,
  setProfile,
  upload,
  deleteMedia,
}: {
  data: Data;
  profile: ProfilForm;
  setProfile: (nilai: ProfilForm) => void;
  upload: (field: MediaField, file?: File, ukuran?: string) => Promise<void>;
  deleteMedia: (field: MediaField) => Promise<void>;
}) {
  return (
    <>
      <TabIntro
        step="02"
        title="Kantor desa"
        description="Alamat, titik lokasi, dan foto kantor yang tampil di halaman kontak publik."
      />
      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Alamat & koordinat</h3>
          <p>Koordinat dipakai untuk peta lokasi kantor desa.</p>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.fieldWide}>
            <Field label="Alamat Kantor">
              <textarea
                rows={2}
                value={profile.alamat}
                onChange={(e) => setProfile({ ...profile, alamat: e.target.value })}
                placeholder="Jalan, nomor, dusun"
              />
            </Field>
          </div>
          <div className={styles.fieldWide}>
            <div className={styles.koordinatRow}>
              <Field label="Titik Koordinat Kantor">
                <input
                  value={profile.koordinat}
                  onChange={(e) => setProfile({ ...profile, koordinat: e.target.value })}
                  placeholder="-3.12345, 99.12345"
                />
              </Field>
              <div className={styles.koordinatAksi}>
                <PemilihKoordinatKantor
                  nilai={profile.koordinat}
                  onPilih={(koordinat) => setProfile({ ...profile, koordinat })}
                  onTipePetaChange={(mapTipe) => setProfile({ ...profile, mapTipe })}
                  tipePeta={normalisasiTipePeta(profile.mapTipe)}
                />
              </div>
            </div>
          </div>
        </div>
        <p className={styles.inputHint}>
          Format: latitude, longitude. Contoh: -7.66519, 111.31629. Bisa juga dipilih langsung lewat
          peta.
        </p>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Kontak kantor</h3>
          <p>Ditampilkan pada halaman kontak publik.</p>
        </div>
        <div className={styles.formGrid}>
          <Field label="E-Mail Desa">
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="desa@contoh.id"
            />
          </Field>
          <Field label="Nomor Telepon">
            <input
              type="tel"
              value={profile.telepon}
              onChange={(e) => setProfile({ ...profile, telepon: e.target.value })}
              placeholder="021-1234567"
            />
          </Field>
          <Field label="Nomor Ponsel / Operator">
            <input
              type="tel"
              value={profile.nomorOperator}
              onChange={(e) => setProfile({ ...profile, nomorOperator: e.target.value })}
              placeholder="0812xxxxxxx"
            />
          </Field>
          <Field label="Website Desa">
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://desa.contoh.id"
            />
          </Field>
        </div>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Kontak pemberitahuan</h3>
          <p>Penerima pesan penting dari aplikasi. Isi bila berbeda dari kontak kantor.</p>
        </div>
        <div className={styles.formGrid}>
          <Field label="Nama">
            <input
              value={profile.kontakPemberitahuanNama}
              onChange={(e) => setProfile({ ...profile, kontakPemberitahuanNama: e.target.value })}
              placeholder="Nama penerima pemberitahuan"
            />
          </Field>
          <Field label="No. HP/WA">
            <input
              type="tel"
              value={profile.kontakPemberitahuanTelepon}
              onChange={(e) =>
                setProfile({ ...profile, kontakPemberitahuanTelepon: e.target.value })
              }
              placeholder="0812xxxxxxx"
            />
          </Field>
          <Field label="Jabatan">
            <input
              value={profile.kontakPemberitahuanJabatan}
              onChange={(e) =>
                setProfile({ ...profile, kontakPemberitahuanJabatan: e.target.value })
              }
              placeholder="Kaur Umum"
            />
          </Field>
        </div>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Foto kantor</h3>
          <p>Tampil pada halaman kontak dan profil publik.</p>
        </div>
        <div className={styles.mediaRow}>
          {data.desa?.fotoKantor ? (
            <Image
              className={styles.officeThumb}
              src={mediaUrl(data.desa.fotoKantor)}
              alt="Foto kantor desa"
              width={148}
              height={84}
              unoptimized
            />
          ) : (
            <div className={styles.officePlaceholder}>Belum ada foto</div>
          )}
          <div className={styles.mediaActions}>
            <label className={styles.uploadButton}>
              Unggah foto kantor
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => void upload("foto-kantor", e.target.files?.[0])}
              />
            </label>
            {data.desa?.fotoKantor && (
              <button
                type="button"
                className={styles.textDanger}
                onClick={() => void deleteMedia("foto-kantor")}
              >
                Hapus foto
              </button>
            )}
            <small>JPG, PNG, GIF, WEBP · Maks. 5 MB</small>
          </div>
        </div>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Aset surat</h3>
          <p>Tanda tangan dan stempel yang dicantumkan pada PDF surat resmi.</p>
        </div>
        <div className={styles.mediaRow}>
          {data.desa?.tandaTangan ? (
            <Image
              className={styles.officeThumb}
              src={mediaUrl(data.desa.tandaTangan)}
              alt="Tanda tangan kepala desa"
              width={148}
              height={84}
              unoptimized
            />
          ) : (
            <div className={styles.officePlaceholder}>Belum ada tanda tangan</div>
          )}
          <div className={styles.mediaActions}>
            <label className={styles.uploadButton}>
              Unggah tanda tangan
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => void upload("tanda-tangan", e.target.files?.[0])}
              />
            </label>
            {data.desa?.tandaTangan && (
              <button
                type="button"
                className={styles.textDanger}
                onClick={() => void deleteMedia("tanda-tangan")}
              >
                Hapus tanda tangan
              </button>
            )}
            <small>JPG, PNG, GIF, WEBP · Maks. 5 MB</small>
          </div>
        </div>
        <div className={styles.mediaRow}>
          {data.desa?.stempel ? (
            <Image
              className={styles.officeThumb}
              src={mediaUrl(data.desa.stempel)}
              alt="Stempel desa"
              width={84}
              height={84}
              unoptimized
            />
          ) : (
            <div className={styles.officePlaceholder}>Belum ada stempel</div>
          )}
          <div className={styles.mediaActions}>
            <label className={styles.uploadButton}>
              Unggah stempel
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => void upload("stempel", e.target.files?.[0])}
              />
            </label>
            {data.desa?.stempel && (
              <button
                type="button"
                className={styles.textDanger}
                onClick={() => void deleteMedia("stempel")}
              >
                Hapus stempel
              </button>
            )}
            <small>JPG, PNG, GIF, WEBP · Maks. 5 MB</small>
          </div>
        </div>
      </div>

      <div className={styles.identityLinks}>
        <Link href="/pengaturan/desa?bagian=kontak">
          <strong>Kontak publik lainnya</strong>
          <small>WhatsApp, jam layanan, media sosial, dan tautan peta</small>
        </Link>
      </div>
    </>
  );
}
