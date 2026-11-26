"use client";

import Link from "next/link";

import { TabIntro } from "./identitas-desa-bagian";
import { InputBatasDesa } from "./input-batas-desa";
import { Field } from "./pengaturan-desa-field";
import { type ProfilForm, type Sebutan } from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

export function TabWilayah({
  profile,
  setProfile,
  sebutan,
}: {
  profile: ProfilForm;
  setProfile: (nilai: ProfilForm) => void;
  sebutan: Sebutan;
}) {
  return (
    <>
      <TabIntro
        step="03"
        title="Wilayah desa"
        description="Kondisi geografis, batas administratif, dan polygon peta wilayah desa."
      />
      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Kondisi geografis</h3>
          <p>Data ini tampil pada halaman wilayah publik.</p>
        </div>
        <div className={styles.formGrid}>
          <Field label="Luas Wilayah (Ha)">
            <input
              inputMode="decimal"
              value={profile.luasWilayah}
              onChange={(e) => setProfile({ ...profile, luasWilayah: e.target.value })}
            />
          </Field>
          <Field label="Ketinggian">
            <input
              value={profile.ketinggian}
              onChange={(e) => setProfile({ ...profile, ketinggian: e.target.value })}
              placeholder="25 mdpl"
            />
          </Field>
          <Field label="Suhu Rata-rata">
            <input
              value={profile.suhuRataRata}
              onChange={(e) => setProfile({ ...profile, suhuRataRata: e.target.value })}
              placeholder="27°C"
            />
          </Field>
          <Field label="Curah Hujan">
            <input
              value={profile.curahHujan}
              onChange={(e) => setProfile({ ...profile, curahHujan: e.target.value })}
              placeholder="2.000 mm/tahun"
            />
          </Field>
        </div>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Batas administratif desa</h3>
          <p>
            Isi nama wilayah tetangga di tiap arah mata angin. Ini berbeda dari polygon batas
            dusun/RW/RT yang dikelola per wilayah administratif.
          </p>
        </div>
        <div className={styles.formGrid}>
          <Field label="Batas Utara">
            <input
              value={profile.batasUtara}
              onChange={(e) => setProfile({ ...profile, batasUtara: e.target.value })}
            />
          </Field>
          <Field label="Batas Selatan">
            <input
              value={profile.batasSelatan}
              onChange={(e) => setProfile({ ...profile, batasSelatan: e.target.value })}
            />
          </Field>
          <Field label="Batas Timur">
            <input
              value={profile.batasTimur}
              onChange={(e) => setProfile({ ...profile, batasTimur: e.target.value })}
            />
          </Field>
          <Field label="Batas Barat">
            <input
              value={profile.batasBarat}
              onChange={(e) => setProfile({ ...profile, batasBarat: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className={styles.tabSection}>
        <div className={styles.sectionHeading}>
          <h3>Polygon batas {sebutan.desa.toLowerCase()}</h3>
          <p>
            Batas luar {sebutan.desa.toLowerCase()} ditampilkan sebagai batas desa utama. Ini
            terpisah dari batas tiap dusun/RW/RT di Wilayah Administratif; layer dan area GIS umum
            dikelola di Pemetaan Umum.
          </p>
        </div>
        <InputBatasDesa
          label={`GeoJSON Polygon Batas ${sebutan.desa}`}
          nilai={profile.batasDesa}
          onChange={(batasDesa) => setProfile({ ...profile, batasDesa })}
        />
        <div className={styles.tabActionsInline}>
          <Link className={styles.secondary} href="/pemetaan/peta">
            Kelola Layer & Area GIS Umum ↗
          </Link>
        </div>
      </div>
    </>
  );
}
