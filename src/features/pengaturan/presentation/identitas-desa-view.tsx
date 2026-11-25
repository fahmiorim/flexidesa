"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
  adaPerubahanBelumSimpan,
  indeksTabTujuan,
  pesanGalatBatasDesa,
} from "@/features/pengaturan/domain/identitas-form";
import { normalisasiTipePeta } from "@/features/wilayah/domain/wilayah";

import { InputBatasDesa } from "./input-batas-desa";
import { PemilihKoordinatKantor } from "./pemilih-koordinat-kantor";
import { Field } from "./pengaturan-desa-field";
import {
  mediaUrl,
  type Data,
  type MediaField,
  type ProfilForm,
  type Sebutan,
} from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

type Props = {
  data: Data;
  profile: ProfilForm;
  profileTersimpan: ProfilForm | null;
  setProfile: Dispatch<SetStateAction<ProfilForm>>;
  sebutan: Sebutan;
  busy: boolean;
  save: (section: string, payload: unknown) => Promise<boolean>;
  load: () => Promise<void>;
  upload: (field: MediaField, file?: File, ukuran?: string) => Promise<void>;
  deleteMedia: (field: MediaField) => Promise<void>;
};

const identityTabs = [
  { id: "identitas", label: "Identitas", hint: "Data pokok", icon: "building" },
  { id: "kantor", label: "Kantor", hint: "Alamat & foto", icon: "pin" },
  { id: "wilayah", label: "Wilayah", hint: "Batas & peta", icon: "map" },
  { id: "profil", label: "Profil", hint: "Visi & cerita", icon: "book" },
  { id: "lingkungan", label: "Lingkungan", hint: "Ekologi & internet", icon: "leaf" },
  { id: "adat", label: "Adat", hint: "Status & regulasi", icon: "shield" },
] as const;

type IdentityTabId = (typeof identityTabs)[number]["id"];
type IdentityTabIconName = (typeof identityTabs)[number]["icon"];

function IdentityTabIcon({ name }: { name: IdentityTabIconName }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  if (name === "building") {
    return (
      <svg {...common}>
        <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5" />
        <path d="M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg {...common}>
        <path d="M20 10c0 4.5-8 11-8 11S4 14.5 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  if (name === "map") {
    return (
      <svg {...common}>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
        <path d="M4 17.5h16M8 7h8M8 11h6" />
      </svg>
    );
  }
  if (name === "leaf") {
    return (
      <svg {...common}>
        <path d="M20 4c-9 0-14 4-14 10a6 6 0 0 0 6 6c6 0 8-8 8-16Z" />
        <path d="M4 21c2-5 5-8 10-10" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3 4.5 6v5.5c0 4.5 3 7.8 7.5 9.5 4.5-1.7 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  );
}

function TabIntro({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.tabIntro}>
      <span className={styles.tabStep}>{step}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function IdentitasDesaView({
  data,
  profile,
  profileTersimpan,
  setProfile,
  sebutan,
  busy,
  save,
  load,
  upload,
  deleteMedia,
}: Props) {
  const [activeTab, setActiveTab] = useState<IdentityTabId>("identitas");
  const [statusDetail, setStatusDetail] = useState<"idle" | "memuat" | "ok" | "kosong">("idle");
  // Opsi dimensi logo (persegi) hanya tampil bila diminta; kosong = dimensi bawaan.
  const [tampilOpsiLogo, setTampilOpsiLogo] = useState(false);
  const [ukuranLogo, setUkuranLogo] = useState("");
  const detailOtomatis = useRef<{ kodeBps: string; kodePos: string } | null>(null);
  const kodeDesaTerakhir = useRef("");
  const tombolTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const kodeDesaBersih = profile.kodeDesa.replace(/\D/g, "").slice(0, 10);

  const adaPerubahan =
    profileTersimpan !== null && adaPerubahanBelumSimpan(profileTersimpan, profile);
  // Polygon batas yang tidak valid menahan simpan: server akan menolak seluruh
  // payload, jadi lebih jelas dicegah di sini dengan pesan inline di isian.
  const galatBatasDesa = pesanGalatBatasDesa(profile.batasDesa);

  function resetDenganKonfirmasi() {
    // Form bersih langsung dimuat ulang; bila ada perubahan belum disimpan,
    // batal mempertahankan nilai yang sedang diedit. Unggahan/hapusan media
    // tidak dihitung sebagai perubahan tertunda (mutasinya langsung tersimpan).
    if (adaPerubahan) {
      const lanjut = window.confirm(
        "Ada perubahan yang belum disimpan. Reset akan memulihkan nilai tersimpan dan membuang perubahan. Lanjutkan?",
      );
      if (!lanjut) return;
    }
    void load();
  }

  function pilihTabLewatKeyboard(tombol: string) {
    const aktif = identityTabs.findIndex((tab) => tab.id === activeTab);
    const tujuan = indeksTabTujuan(tombol, aktif, identityTabs.length);
    const tab = identityTabs[tujuan];
    if (!tab) return;
    setActiveTab(tab.id);
    tombolTabRefs.current[tujuan]?.focus();
  }

  // Lengkapi BPS dan kode pos dari dataset wilayah setelah kode desa lengkap.
  // Nilai yang sudah diisi manual tidak ditimpa; nilai hasil autofill lama
  // diperbarui ketika kode desa diganti.
  useEffect(() => {
    if (kodeDesaBersih.length !== 10) {
      kodeDesaTerakhir.current = "";
      return;
    }
    if (kodeDesaTerakhir.current === kodeDesaBersih) return;
    // Kode yang sama dengan data tersimpan bukan perubahan pengguna: jangan
    // mengisi otomatis saat pemuatan, agar form tidak dianggap berubah dan
    // Reset tidak meminta konfirmasi tanpa ada yang diedit.
    const kodeTersimpan = (profileTersimpan?.kodeDesa ?? "").replace(/\D/g, "").slice(0, 10);
    if (kodeDesaBersih === kodeTersimpan) {
      kodeDesaTerakhir.current = kodeDesaBersih;
      return;
    }

    const kontrol = new AbortController();
    const timer = setTimeout(async () => {
      setStatusDetail("memuat");
      try {
        const res = await fetch(`/api/wilayah/detail?kode=${kodeDesaBersih}`, {
          signal: kontrol.signal,
        });
        if (!res.ok) {
          setStatusDetail("kosong");
          return;
        }
        const body = (await res.json()) as {
          data?: { kodeBps?: string; kodePos?: string };
        };
        const kodeBps = body.data?.kodeBps ?? "";
        const kodePos = body.data?.kodePos ?? "";
        if (!kodeBps && !kodePos) {
          setStatusDetail("kosong");
          return;
        }

        setProfile((sebelumnya) => {
          const berikutnya = { ...sebelumnya };
          if (
            kodeBps &&
            (!sebelumnya.kodeBps || sebelumnya.kodeBps === detailOtomatis.current?.kodeBps)
          ) {
            berikutnya.kodeBps = kodeBps;
          }
          if (
            kodePos &&
            (!sebelumnya.kodePos || sebelumnya.kodePos === detailOtomatis.current?.kodePos)
          ) {
            berikutnya.kodePos = kodePos;
          }
          return berikutnya;
        });
        detailOtomatis.current = { kodeBps, kodePos };
        kodeDesaTerakhir.current = kodeDesaBersih;
        setStatusDetail("ok");
      } catch {
        if (!kontrol.signal.aborted) setStatusDetail("kosong");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      kontrol.abort();
    };
  }, [kodeDesaBersih, setProfile, profileTersimpan]);

  const detailTampil = kodeDesaBersih.length === 10 ? statusDetail : "idle";

  const kelengkapanIdentitas = [
    profile.namaDesa,
    profile.kodeDesa,
    profile.namaKecamatan,
    profile.namaKabupaten,
    profile.namaPropinsi,
    profile.kodePos,
    profile.namaKepalaDesa,
    data.desa?.logo,
  ].filter(Boolean).length;
  const persenIdentitas = Math.round((kelengkapanIdentitas / 8) * 100);

  return (
    <div className={styles.identityLayout}>
      <section className={styles.panel}>
        <header className={styles.identityHeader}>
          <span className={styles.sectionKicker}>KELENGKAPAN DATA IDENTITAS</span>
          <span className={styles.completionBadge}>{persenIdentitas}% lengkap</span>
        </header>

        <div className={styles.identityHero}>
          <div className={styles.identityLogo}>
            {data.desa?.logo ? (
              <Image
                src={mediaUrl(data.desa.logo)}
                alt="Logo desa"
                width={74}
                height={74}
                unoptimized
              />
            ) : (
              <span>{(profile.namaDesa || "Desa").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.identityHeroText}>
            <strong>{profile.namaDesa || "Nama desa belum diisi"}</strong>
            <span>
              {[profile.namaKecamatan, profile.namaKabupaten, profile.namaPropinsi]
                .filter(Boolean)
                .join(" · ") || "Data wilayah belum lengkap"}
            </span>
            <div className={styles.identityMeta}>
              <span>
                Kode desa <b>{profile.kodeDesa || "—"}</b>
              </span>
              <span>
                Kode pos <b>{profile.kodePos || "—"}</b>
              </span>
              <span>
                Kepala desa <b>{profile.namaKepalaDesa || "—"}</b>
              </span>
            </div>
          </div>
          <div className={styles.identityHeroActions}>
            <div className={styles.identityHeroUploadRow}>
              <label className={styles.uploadButton}>
                {data.desa?.logo ? "Ganti logo" : "Unggah logo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => void upload("logo", e.target.files?.[0], ukuranLogo)}
                />
              </label>
              {data.desa?.logo && (
                <button
                  type="button"
                  className={styles.textDanger}
                  onClick={() => void deleteMedia("logo")}
                >
                  Hapus logo
                </button>
              )}
            </div>
            <small>JPG, PNG, GIF, WEBP, SVG · Maks. 2 MB</small>
            <button
              type="button"
              className={styles.logoOpsiToggle}
              aria-expanded={tampilOpsiLogo}
              onClick={() => setTampilOpsiLogo((aktif) => !aktif)}
            >
              {tampilOpsiLogo ? "Sembunyikan opsi dimensi" : "Atur dimensi persegi (opsional)"}
            </button>
            {tampilOpsiLogo && (
              <Field
                label="Dimensi logo (persegi, px)"
                hint="100–400 px. Kosongkan untuk dimensi bawaan."
              >
                <input
                  inputMode="numeric"
                  min={100}
                  max={400}
                  type="number"
                  value={ukuranLogo}
                  onChange={(e) => setUkuranLogo(e.target.value)}
                  placeholder="Contoh: 200"
                />
              </Field>
            )}
          </div>
        </div>

        <nav
          className={styles.identityTabs}
          role="tablist"
          aria-label="Bagian identitas desa"
          onKeyDown={(e) => {
            if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              pilihTabLewatKeyboard(e.key);
            }
          }}
        >
          {identityTabs.map((tab, index) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`identitas-tab-${tab.id}`}
                aria-selected={active}
                aria-controls="identitas-panel"
                tabIndex={active ? 0 : -1}
                ref={(el) => {
                  tombolTabRefs.current[index] = el;
                }}
                className={active ? styles.identityTabActive : styles.identityTab}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.identityTabIcon}>
                  <IdentityTabIcon name={tab.icon} />
                </span>
                <span className={styles.identityTabText}>
                  <strong>{tab.label}</strong>
                  <small>{tab.hint}</small>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Satu panel aktif dipakai bersama keenam tab: `aria-controls` setiap
            tab selalu menunjuk elemen yang ada, dan `aria-labelledby` mengikuti
            tab terpilih sehingga fokus, tab terpilih, dan panel tetap sinkron. */}
        <div
          className={styles.identityTabPanel}
          role="tabpanel"
          id="identitas-panel"
          aria-labelledby={`identitas-tab-${activeTab}`}
        >
          {activeTab === "identitas" && (
            <>
              <TabIntro
                step="01"
                title="Data pokok desa"
                description="Nama resmi, kode wilayah, dan pejabat yang tercetak pada dokumen desa."
              />
              <div className={styles.tabSection}>
                <div className={styles.sectionHeading}>
                  <h3>Data desa</h3>
                  <p>Gunakan nama dan kode sesuai data Kemendagri.</p>
                </div>
                <div className={styles.formGrid}>
                  <Field label={`Nama ${sebutan.desa}`} required>
                    <input
                      value={profile.namaDesa}
                      onChange={(e) => setProfile({ ...profile, namaDesa: e.target.value })}
                    />
                  </Field>
                  <Field label="Kode Desa (Kemendagri)" required>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      value={profile.kodeDesa}
                      onChange={(e) => setProfile({ ...profile, kodeDesa: e.target.value })}
                    />
                  </Field>
                  <Field label="Kode BPS">
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      value={profile.kodeBps}
                      onChange={(e) => setProfile({ ...profile, kodeBps: e.target.value })}
                      placeholder="10 digit, bila berbeda"
                    />
                  </Field>
                  <Field label="Kode Pos">
                    <input
                      inputMode="numeric"
                      maxLength={5}
                      value={profile.kodePos}
                      onChange={(e) => setProfile({ ...profile, kodePos: e.target.value })}
                    />
                  </Field>
                </div>
                {detailTampil === "memuat" ? (
                  <p className={styles.fieldHint}>Melengkapi kode BPS dan kode pos…</p>
                ) : detailTampil === "ok" ? (
                  <p className={styles.fieldHint}>
                    Kode BPS dan kode pos terisi otomatis dari kode desa.
                  </p>
                ) : detailTampil === "kosong" ? (
                  <p className={styles.fieldHint}>
                    Detail wilayah tidak ditemukan. Isi kode BPS dan kode pos secara manual.
                  </p>
                ) : null}
              </div>

              <div className={styles.tabSection}>
                <div className={styles.sectionHeading}>
                  <h3>Wilayah administratif</h3>
                  <p>Kode wilayah terisi otomatis dari data platform.</p>
                </div>
                <div className={styles.formGrid}>
                  <Field label={sebutan.kecamatan} required>
                    <input
                      value={profile.namaKecamatan}
                      onChange={(e) => setProfile({ ...profile, namaKecamatan: e.target.value })}
                    />
                  </Field>
                  <Field label="Kode Kecamatan (otomatis)">
                    <input
                      readOnly
                      value={data.desa?.kodeKecamatan ?? ""}
                      placeholder="Diisi dari data platform"
                    />
                  </Field>
                  <Field label={sebutan.kabupaten} required>
                    <input
                      value={profile.namaKabupaten}
                      onChange={(e) => setProfile({ ...profile, namaKabupaten: e.target.value })}
                    />
                  </Field>
                  <Field label="Kode Kabupaten (otomatis)">
                    <input
                      readOnly
                      value={data.desa?.kodeKabupaten ?? ""}
                      placeholder="Diisi dari data platform"
                    />
                  </Field>
                  <Field label="Provinsi" required>
                    <input
                      value={profile.namaPropinsi}
                      onChange={(e) => setProfile({ ...profile, namaPropinsi: e.target.value })}
                    />
                  </Field>
                  <Field label="Kode Provinsi (otomatis)">
                    <input
                      readOnly
                      value={data.desa?.kodePropinsi ?? ""}
                      placeholder="Diisi dari data platform"
                    />
                  </Field>
                </div>
              </div>

              <div className={styles.tabSection}>
                <div className={styles.sectionHeading}>
                  <h3>Pejabat wilayah</h3>
                  <p>Nama dan NIP kepala desa mengikuti data perangkat desa yang aktif.</p>
                </div>
                <div className={styles.formGrid}>
                  <Field label={`Kepala ${sebutan.desa}`}>
                    <input
                      readOnly
                      value={profile.namaKepalaDesa}
                      placeholder="Belum ada kepala desa aktif"
                    />
                  </Field>
                  <Field label={`NIP Kepala ${sebutan.desa}`}>
                    <input readOnly value={profile.nipKepalaDesa} placeholder="Belum ada NIP" />
                  </Field>
                  <Field label={`Nama ${sebutan.camat}`}>
                    <input
                      value={profile.namaCamat}
                      onChange={(e) => setProfile({ ...profile, namaCamat: e.target.value })}
                    />
                  </Field>
                  <Field label={`NIP ${sebutan.camat}`}>
                    <input
                      value={profile.nipCamat}
                      onChange={(e) => setProfile({ ...profile, nipCamat: e.target.value })}
                    />
                  </Field>
                </div>
                <div className={styles.formNote}>
                  <span>Kepala desa diambil dari perangkat desa dengan jabatan kades aktif.</span>
                  <Link href="/pemerintah-desa">Kelola perangkat desa ↗</Link>
                </div>
              </div>
            </>
          )}

          {activeTab === "kantor" && (
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
                  Format: latitude, longitude. Contoh: -7.66519, 111.31629. Bisa juga dipilih
                  langsung lewat peta.
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
                      onChange={(e) =>
                        setProfile({ ...profile, kontakPemberitahuanNama: e.target.value })
                      }
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

              <div className={styles.identityLinks}>
                <Link href="/pengaturan/desa?bagian=kontak">
                  <strong>Kontak publik lainnya</strong>
                  <small>WhatsApp, jam layanan, media sosial, dan tautan peta</small>
                </Link>
              </div>
            </>
          )}

          {activeTab === "wilayah" && (
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
                    Isi nama wilayah tetangga di tiap arah mata angin. Ini berbeda dari polygon
                    batas dusun/RW/RT yang dikelola per wilayah administratif.
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
                    Batas luar {sebutan.desa.toLowerCase()} ditampilkan sebagai batas desa utama.
                    Ini terpisah dari batas tiap dusun/RW/RT di Wilayah Administratif; layer dan
                    area GIS umum dikelola di Pemetaan Umum.
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
          )}

          {activeTab === "profil" && (
            <>
              <TabIntro
                step="04"
                title="Profil publik"
                description="Narasi desa yang tampil pada halaman profil dan sambutan website."
              />
              <div className={`${styles.formGrid} ${styles.narrativeGrid}`}>
                <Field label="Visi Desa">
                  <textarea
                    rows={5}
                    value={profile.visi}
                    onChange={(e) => setProfile({ ...profile, visi: e.target.value })}
                  />
                </Field>
                <Field label="Sambutan Kepala Desa">
                  <textarea
                    rows={5}
                    value={profile.sambutan}
                    onChange={(e) => setProfile({ ...profile, sambutan: e.target.value })}
                  />
                </Field>
                <Field label="Misi Desa">
                  <textarea
                    rows={8}
                    value={profile.misi}
                    onChange={(e) => setProfile({ ...profile, misi: e.target.value })}
                    placeholder="Satu misi per baris"
                  />
                </Field>
                <Field label="Sejarah Desa">
                  <textarea
                    rows={8}
                    value={profile.sejarah}
                    onChange={(e) => setProfile({ ...profile, sejarah: e.target.value })}
                  />
                </Field>
              </div>
            </>
          )}

          {activeTab === "lingkungan" && (
            <>
              <TabIntro
                step="05"
                title="Ekologi & internet"
                description="Kondisi lingkungan, sumber daya, dan konektivitas wilayah desa."
              />
              <div className={styles.tabSection}>
                <div className={styles.sectionHeading}>
                  <h3>Ekologi</h3>
                  <p>Kondisi tanah, sumber daya alam, dan kearifan lokal desa.</p>
                </div>
                <div className={styles.formGrid}>
                  <Field label="Jenis Tanah">
                    <input
                      value={profile.jenisTanah}
                      onChange={(e) => setProfile({ ...profile, jenisTanah: e.target.value })}
                      placeholder="Sawah, kering, hutan"
                    />
                  </Field>
                  <Field label="Topografi">
                    <input
                      value={profile.topografi}
                      onChange={(e) => setProfile({ ...profile, topografi: e.target.value })}
                      placeholder="Datar, perbukitan, pegunungan"
                    />
                  </Field>
                  <Field label="Rawan Bencana">
                    <input
                      value={profile.rawanBencana}
                      onChange={(e) => setProfile({ ...profile, rawanBencana: e.target.value })}
                      placeholder="Banjir, tanah longsor, gempa"
                    />
                  </Field>
                  <div className={styles.fieldWide}>
                    <Field label="Sumber Daya Alam">
                      <textarea
                        rows={3}
                        value={profile.sumberDayaAlam}
                        onChange={(e) => setProfile({ ...profile, sumberDayaAlam: e.target.value })}
                        placeholder="Air, mineral, energi, hutan"
                      />
                    </Field>
                  </div>
                  <div className={styles.fieldWide}>
                    <Field label="Flora & Fauna">
                      <textarea
                        rows={3}
                        value={profile.floraFauna}
                        onChange={(e) => setProfile({ ...profile, floraFauna: e.target.value })}
                        placeholder="Jenis tumbuhan dan hewan yang ada di desa"
                      />
                    </Field>
                  </div>
                  <div className={styles.fieldWide}>
                    <Field label="Kearifan Lokal">
                      <textarea
                        rows={3}
                        value={profile.kearifanLokal}
                        onChange={(e) => setProfile({ ...profile, kearifanLokal: e.target.value })}
                        placeholder="Tradisi, budaya, pengetahuan lokal"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className={styles.tabSection}>
                <div className={styles.sectionHeading}>
                  <h3>Jaringan internet</h3>
                  <p>Ketersediaan dan kualitas jaringan internet di wilayah desa.</p>
                </div>
                <div className={styles.formGrid}>
                  <Field label="Jenis Jaringan">
                    <input
                      value={profile.jenisJaringan}
                      onChange={(e) => setProfile({ ...profile, jenisJaringan: e.target.value })}
                      placeholder="Fiber optik, 4G, satelit"
                    />
                  </Field>
                  <Field label="Provider Internet">
                    <input
                      value={profile.providerInternet}
                      onChange={(e) => setProfile({ ...profile, providerInternet: e.target.value })}
                      placeholder="Telkomsel, XL, Indosat"
                    />
                  </Field>
                  <Field label="Kecepatan Internet">
                    <input
                      value={profile.kecepatanInternet}
                      onChange={(e) =>
                        setProfile({ ...profile, kecepatanInternet: e.target.value })
                      }
                      placeholder="10 Mbps"
                    />
                  </Field>
                  <div className={styles.fieldWide}>
                    <Field label="Cakupan Wilayah">
                      <textarea
                        rows={3}
                        value={profile.cakupanWilayah}
                        onChange={(e) => setProfile({ ...profile, cakupanWilayah: e.target.value })}
                        placeholder="Deskripsi cakupan jaringan internet di desa"
                      />
                    </Field>
                  </div>
                  <div className={styles.fieldWide}>
                    <Field label="Akses Publik">
                      <textarea
                        rows={3}
                        value={profile.aksesPublik}
                        onChange={(e) => setProfile({ ...profile, aksesPublik: e.target.value })}
                        placeholder="Deskripsi akses publik terhadap jaringan internet"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "adat" && (
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
          )}
        </div>

        <div className={styles.identitySaveBar}>
          <div className={styles.identitySaveNote}>
            <strong>Simpan perubahan identitas</strong>
            <span>Semua isian pada tab mana pun disimpan bersama.</span>
          </div>
          <div className={styles.identitySaveActions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={resetDenganKonfirmasi}
              disabled={busy}
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={busy || galatBatasDesa !== null}
              onClick={() => void save("profil", profile)}
            >
              {busy ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
