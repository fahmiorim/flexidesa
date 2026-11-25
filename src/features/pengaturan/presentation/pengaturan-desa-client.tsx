"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeading } from "@/components/shell/page-heading";
import { validasiUkuranLogo } from "@/features/pengaturan/domain/identitas-form";
import { TIPE_PETA_DEFAULT } from "@/features/wilayah/domain/wilayah";

import { IdentitasDesaView } from "./identitas-desa-view";
import { IntegrationManager } from "./integration-manager";
import { Field } from "./pengaturan-desa-field";
import {
  blankKontak,
  blankSebutan,
  blankService,
  blankUmum,
  formatBytes,
  mediaUrl,
  settingsSections,
  type Data,
  type Kontak,
  type Layanan,
  type MediaField,
  type ProfilForm,
  type Sebutan,
  type TabId,
  type Umum,
} from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

export function PengaturanDesaClient({
  mode = "identitas",
  initialSection,
}: {
  mode?: "identitas" | "pengaturan";
  initialSection?: string;
}) {
  const pengaturanMode = mode === "pengaturan";
  const [data, setData] = useState<Data | null>(null),
    [tab, setTab] = useState<TabId>(() =>
      pengaturanMode
        ? (settingsSections.find(([id]) => id === initialSection)?.[0] ?? "kontak")
        : "profil",
    ),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  // Snapshot profil terakhir tersimpan: acuan penanda perubahan belum
  // tersimpan untuk konfirmasi Reset di Identitas Desa.
  const [profileTersimpan, setProfileTersimpan] = useState<ProfilForm | null>(null);
  const [profile, setProfile] = useState<ProfilForm>({
    namaDesa: "",
    kodeDesa: "",
    kodeBps: "",
    namaKecamatan: "",
    namaCamat: "",
    nipCamat: "",
    namaKabupaten: "",
    namaPropinsi: "",
    kodePos: "",
    namaKepalaDesa: "",
    nipKepalaDesa: "",
    visi: "",
    misi: "",
    sejarah: "",
    sambutan: "",
    alamat: "",
    email: "",
    telepon: "",
    nomorOperator: "",
    website: "",
    kontakPemberitahuanNama: "",
    kontakPemberitahuanTelepon: "",
    kontakPemberitahuanJabatan: "",
    koordinat: "",
    mapTipe: TIPE_PETA_DEFAULT,
    luasWilayah: "",
    batasUtara: "",
    batasSelatan: "",
    batasTimur: "",
    batasBarat: "",
    ketinggian: "",
    suhuRataRata: "",
    curahHujan: "",
    topografi: "",
    jenisTanah: "",
    sumberDayaAlam: "",
    floraFauna: "",
    rawanBencana: "",
    kearifanLokal: "",
    jenisJaringan: "",
    providerInternet: "",
    cakupanWilayah: "",
    kecepatanInternet: "",
    aksesPublik: "",
    statusDesa: "",
    lembagaAdat: "",
    strukturAdat: "",
    wilayahAdat: "",
    peraturanAdat: "",
    regulasiPenetapanKampungAdat: "",
    dokumenRegulasiPenetapanKampungAdat: "",
    batasDesa: "",
  });
  const [contact, setContact] = useState<Kontak>(blankKontak),
    [general, setGeneral] = useState<Umum>(blankUmum),
    [sebutan, setSebutan] = useState<Sebutan>(blankSebutan);
  const [templateSlug, setTemplateSlug] = useState(""),
    [service, setService] = useState({ ...blankService }),
    [editingService, setEditingService] = useState<number | null>(null);
  async function muatPengaturan(): Promise<Data> {
    if (!pengaturanMode) {
      const r = await fetch("/api/identitas-desa", { cache: "no-store" });
      const d = (await r.json()) as Pick<Data, "desa" | "profil" | "sebutan"> & {
        error?: string;
      };
      if (!r.ok) throw new Error(d.error || "Gagal memuat identitas desa.");
      return {
        desa: d.desa,
        profil: d.profil,
        kontak: {},
        favicon: null,
        templates: [],
        temaAktif: null,
        umum: { ...blankUmum },
        sebutan: d.sebutan,
        layanan: [],
        media: { usedBytes: 0, quotaMb: null },
      };
    }
    const r = await fetch("/api/pengaturan-desa", { cache: "no-store" });
    const d = (await r.json()) as Data & { error?: string };
    if (!r.ok) throw new Error(d.error || "Gagal memuat pengaturan.");
    return d;
  }
  function terapkanPengaturan(d: Data) {
    setData(d);
    const profil = {
      namaDesa: d.desa?.namaDesa ?? "",
      kodeDesa: d.desa?.kodeDesa ?? "",
      kodeBps: d.desa?.kodeBps ?? "",
      namaKecamatan: d.desa?.namaKecamatan ?? "",
      namaCamat: d.desa?.namaCamat ?? "",
      nipCamat: d.desa?.nipCamat ?? "",
      namaKabupaten: d.desa?.namaKabupaten ?? "",
      namaPropinsi: d.desa?.namaPropinsi ?? "",
      kodePos: d.desa?.kodePos ?? "",
      namaKepalaDesa: d.desa?.namaKepalaDesa ?? "",
      nipKepalaDesa: d.desa?.nipKepalaDesa ?? "",
      visi: d.profil?.visi ?? "",
      misi: d.profil?.misi ?? "",
      sejarah: d.profil?.sejarah ?? "",
      sambutan: d.profil?.sambutan ?? "",
      alamat: d.desa?.alamat ?? "",
      email: d.desa?.email ?? d.kontak?.email ?? "",
      telepon: d.desa?.telepon ?? d.kontak?.telepon ?? "",
      nomorOperator: d.desa?.nomorOperator ?? d.kontak?.nomorOperator ?? "",
      website: d.desa?.website ?? d.kontak?.website ?? "",
      kontakPemberitahuanNama:
        d.desa?.kontakPemberitahuanNama ?? d.kontak?.kontakPemberitahuanNama ?? "",
      kontakPemberitahuanTelepon:
        d.desa?.kontakPemberitahuanTelepon ?? d.kontak?.kontakPemberitahuanTelepon ?? "",
      kontakPemberitahuanJabatan:
        d.desa?.kontakPemberitahuanJabatan ?? d.kontak?.kontakPemberitahuanJabatan ?? "",
      koordinat: d.profil?.koordinat ?? d.kontak?.koordinat ?? "",
      mapTipe: d.profil?.mapTipe ?? TIPE_PETA_DEFAULT,
      luasWilayah: d.profil?.luasWilayah ?? "",
      batasUtara: d.profil?.batasUtara ?? "",
      batasSelatan: d.profil?.batasSelatan ?? "",
      batasTimur: d.profil?.batasTimur ?? "",
      batasBarat: d.profil?.batasBarat ?? "",
      ketinggian: d.profil?.ketinggian ?? "",
      suhuRataRata: d.profil?.suhuRataRata ?? "",
      curahHujan: d.profil?.curahHujan ?? "",
      topografi: d.profil?.topografi ?? "",
      jenisTanah: d.profil?.jenisTanah ?? "",
      sumberDayaAlam: d.profil?.sumberDayaAlam ?? "",
      floraFauna: d.profil?.floraFauna ?? "",
      rawanBencana: d.profil?.rawanBencana ?? "",
      kearifanLokal: d.profil?.kearifanLokal ?? "",
      jenisJaringan: d.profil?.jenisJaringan ?? "",
      providerInternet: d.profil?.providerInternet ?? "",
      cakupanWilayah: d.profil?.cakupanWilayah ?? "",
      kecepatanInternet: d.profil?.kecepatanInternet ?? "",
      aksesPublik: d.profil?.aksesPublik ?? "",
      statusDesa: d.profil?.statusDesa ?? "",
      lembagaAdat: d.profil?.lembagaAdat ?? "",
      strukturAdat: d.profil?.strukturAdat ?? "",
      wilayahAdat: d.profil?.wilayahAdat ?? "",
      peraturanAdat: d.profil?.peraturanAdat ?? "",
      regulasiPenetapanKampungAdat: d.profil?.regulasiPenetapanKampungAdat ?? "",
      dokumenRegulasiPenetapanKampungAdat: d.profil?.dokumenRegulasiPenetapanKampungAdat ?? "",
      batasDesa: d.profil?.batasDesa ?? "",
    };
    setProfile(profil);
    setProfileTersimpan(profil);
    setSebutan({ ...blankSebutan, ...d.sebutan });
    setContact({
      ...blankKontak,
      ...d.kontak,
      telepon: d.kontak?.telepon ?? d.desa?.telepon ?? "",
      nomorOperator: d.kontak?.nomorOperator ?? d.desa?.nomorOperator ?? "",
      kontakPemberitahuanNama:
        d.kontak?.kontakPemberitahuanNama ?? d.desa?.kontakPemberitahuanNama ?? "",
      kontakPemberitahuanTelepon:
        d.kontak?.kontakPemberitahuanTelepon ?? d.desa?.kontakPemberitahuanTelepon ?? "",
      kontakPemberitahuanJabatan:
        d.kontak?.kontakPemberitahuanJabatan ?? d.desa?.kontakPemberitahuanJabatan ?? "",
      email: d.kontak?.email ?? d.desa?.email ?? "",
      alamat: d.kontak?.alamat ?? d.desa?.alamat ?? "",
      website: d.kontak?.website ?? d.desa?.website ?? "",
      whatsapp: d.kontak?.whatsapp ?? d.desa?.telepon ?? "",
      koordinat: d.kontak?.koordinat ?? d.profil?.koordinat ?? "",
    });
    setGeneral({ ...blankUmum, ...d.umum });
    setTemplateSlug(d.temaAktif?.slug ?? d.templates?.[0]?.slug ?? "");
  }
  async function load() {
    setLoading(true);
    try {
      terapkanPengaturan(await muatPengaturan());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  }
  // Pemuatan pertama memakai rantai promise agar setState terjadi setelah await,
  // bukan sinkron di dalam effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    let aktif = true;
    muatPengaturan()
      .then((d) => {
        if (aktif) terapkanPengaturan(d);
      })
      .catch((e: unknown) => {
        if (aktif) setError(e instanceof Error ? e.message : "Gagal memuat pengaturan.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);
  async function save(section: string, payload: unknown): Promise<boolean> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const endpoint = section === "profil" ? "/api/identitas-desa" : "/api/pengaturan-desa";
      const r = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data: payload }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal menyimpan.");
      setMessage(d.message || "Perubahan berhasil disimpan.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan pengaturan.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(field: MediaField, file?: File, ukuran?: string) {
    if (!file) return;
    // Dimensi logo (paritas OpenSID): kosong = bawaan; 100–400 = persegi.
    let ukuranLogo: number | null = null;
    if (field === "logo" && ukuran !== undefined && ukuran.trim() !== "") {
      const cek = validasiUkuranLogo(ukuran);
      if (!cek.ok) {
        setError(cek.pesan);
        return;
      }
      ukuranLogo = cek.ukuran;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.set("field", field);
      fd.set("file", file);
      if (ukuranLogo !== null) fd.set("ukuran", String(ukuranLogo));
      const endpoint =
        field === "favicon" ? "/api/pengaturan-desa/media" : "/api/identitas-desa/media";
      const r = await fetch(endpoint, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unggah gagal.");
      setMessage(d.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unggah gagal.");
    } finally {
      setBusy(false);
    }
  }
  async function deleteMedia(field: MediaField) {
    if (!window.confirm("Hapus file " + field + " yang sedang digunakan?")) return;
    const endpoint =
      field === "favicon" ? "/api/pengaturan-desa/media" : "/api/identitas-desa/media";
    const r = await fetch(endpoint + "?field=" + field, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || "Gagal menghapus media.");
      return;
    }
    setMessage(d.message);
    await load();
  }
  async function saveService() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const url = "/api/pengaturan-desa/layanan",
        r = await fetch(url, {
          method: editingService ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingService ? { id: editingService, data: service } : service),
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal menyimpan layanan.");
      setMessage(d.message);
      setService({ ...blankService });
      setEditingService(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan layanan.");
    } finally {
      setBusy(false);
    }
  }
  async function removeService(item: Layanan) {
    if (!window.confirm("Nonaktifkan layanan " + item.nama + "?")) return;
    const r = await fetch("/api/pengaturan-desa/layanan?id=" + item.id, { method: "DELETE" }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error || "Gagal menghapus layanan.");
      return;
    }
    setMessage(d.message);
    await load();
  }
  const selectedTemplate = useMemo(
    () => data?.templates.find((t) => t.slug === templateSlug),
    [data, templateSlug],
  );
  async function restoreBackup(file?: File) {
    if (!file) return;
    const text = await file.text();
    if (
      !window.confirm(
        "Pulihkan konfigurasi dari file ini? Preferensi profil dan konfigurasi desa akan ditimpa.",
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/pengaturan-desa/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: text,
        }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "Pemulihan gagal.");
      setMessage(d.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pemulihan gagal.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <div className={styles.loading}>Memuat pengaturan desa…</div>;
  if (!data)
    return (
      <div className={styles.panel}>
        <p>Pengaturan tidak dapat dimuat.</p>
        <button onClick={() => void load()}>Coba lagi</button>
      </div>
    );
  return (
    <div className={styles.page}>
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>{pengaturanMode ? "Pengaturan Desa" : `Identitas ${sebutan.desa}`}</h1>
            <p>
              {pengaturanMode
                ? "Kelola sebutan wilayah, kontak, tampilan website, layanan, integrasi, backup, dan preferensi desa."
                : `Identitas resmi yang dipakai pada website, surat, dan dokumen ${sebutan.desa.toLowerCase()}.`}
            </p>
          </div>
          {pengaturanMode ? (
            <Link href="/identitas-desa" className={styles.secondary}>
              ← Identitas Desa
            </Link>
          ) : null}
        </header>
      </PageHeading>
      {message && (
        <div className={styles.success} role="status">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {!pengaturanMode && (
        <IdentitasDesaView
          data={data}
          profile={profile}
          profileTersimpan={profileTersimpan}
          setProfile={setProfile}
          sebutan={sebutan}
          busy={busy}
          save={save}
          load={load}
          upload={upload}
          deleteMedia={deleteMedia}
        />
      )}
      {pengaturanMode && (
        <div className={styles.settingsBody}>
          <nav className={styles.settingsNav} aria-label="Bagian pengaturan desa">
            <span className={styles.settingsNavLabel}>PENGATURAN</span>
            {settingsSections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? styles.activeTab : ""}
                onClick={() => {
                  setTab(id);
                  setMessage("");
                  setError("");
                }}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className={styles.settingsContent}>
            {tab === "sebutan" && (
              <section className={styles.panel}>
                <header>
                  <h2>Sebutan Wilayah</h2>
                  <p>
                    Ubah sebutan yang dipakai pada label dan dokumen, misalnya Desa menjadi Nagari.
                  </p>
                </header>
                <div className={styles.formGrid}>
                  <Field label="Sebutan Desa / Nagari">
                    <input
                      value={sebutan.desa}
                      onChange={(e) => setSebutan({ ...sebutan, desa: e.target.value })}
                    />
                  </Field>
                  <Field label="Sebutan Singkat Desa">
                    <input
                      value={sebutan.desaSingkat}
                      onChange={(e) => setSebutan({ ...sebutan, desaSingkat: e.target.value })}
                    />
                  </Field>
                  <Field label="Sebutan Kecamatan">
                    <input
                      value={sebutan.kecamatan}
                      onChange={(e) => setSebutan({ ...sebutan, kecamatan: e.target.value })}
                    />
                  </Field>
                  <Field label="Sebutan Singkat Kecamatan">
                    <input
                      value={sebutan.kecamatanSingkat}
                      onChange={(e) => setSebutan({ ...sebutan, kecamatanSingkat: e.target.value })}
                    />
                  </Field>
                  <Field label="Sebutan Camat">
                    <input
                      value={sebutan.camat}
                      onChange={(e) => setSebutan({ ...sebutan, camat: e.target.value })}
                    />
                  </Field>
                  <Field label="Sebutan Kabupaten">
                    <input
                      value={sebutan.kabupaten}
                      onChange={(e) => setSebutan({ ...sebutan, kabupaten: e.target.value })}
                    />
                  </Field>
                  <Field label="Sebutan Singkat Kabupaten">
                    <input
                      value={sebutan.kabupatenSingkat}
                      onChange={(e) => setSebutan({ ...sebutan, kabupatenSingkat: e.target.value })}
                    />
                  </Field>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    disabled={busy}
                    onClick={() => void save("sebutan", sebutan)}
                  >
                    Simpan Sebutan
                  </button>
                  <button
                    className={styles.secondary}
                    type="button"
                    disabled={busy}
                    onClick={() => setSebutan({ ...blankSebutan, ...data.sebutan })}
                  >
                    Batal
                  </button>
                </div>
              </section>
            )}
            {tab === "kontak" && (
              <section className={styles.panel}>
                <header>
                  <h2>Kontak & Lokasi</h2>
                  <p>
                    Kanal kontak yang ditampilkan pada halaman kontak publik. Alamat dan koordinat
                    kantor diatur di Identitas Desa.
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
                      onChange={(e) =>
                        setContact({ ...contact, kontakPemberitahuanNama: e.target.value })
                      }
                      placeholder="Nama petugas yang dihubungi"
                    />
                  </Field>
                  <Field label="HP/WA Kontak Pemberitahuan">
                    <input
                      value={contact.kontakPemberitahuanTelepon}
                      onChange={(e) =>
                        setContact({ ...contact, kontakPemberitahuanTelepon: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Jabatan Kontak Pemberitahuan">
                    <input
                      value={contact.kontakPemberitahuanJabatan}
                      onChange={(e) =>
                        setContact({ ...contact, kontakPemberitahuanJabatan: e.target.value })
                      }
                      placeholder="Contoh: Kasi Pemerintahan"
                    />
                  </Field>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    disabled={busy}
                    onClick={() => void save("kontak", contact)}
                  >
                    Simpan Kontak & Lokasi
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
            )}
            {tab === "tampilan" && (
              <div className={styles.layout}>
                <section className={styles.panel}>
                  <header>
                    <h2>Tampilan Website</h2>
                    <p>Pilih template dari katalog resmi dan atur identitas visual desa.</p>
                  </header>
                  <div className={styles.uploadGrid}>
                    <div className={styles.uploadCard}>
                      <strong>Favicon Website</strong>
                      {data.favicon ? (
                        <Image
                          src={mediaUrl(data.favicon)}
                          alt="Favicon"
                          width={82}
                          height={82}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.uploadPlaceholder}>Belum ada favicon</div>
                      )}
                      <label className={styles.uploadButton}>
                        ↑ Upload Favicon
                        <input
                          type="file"
                          accept="image/png"
                          onChange={(e) => void upload("favicon", e.target.files?.[0])}
                        />
                      </label>
                      {data.favicon && (
                        <button
                          className={styles.textDanger}
                          onClick={() => void deleteMedia("favicon")}
                        >
                          Hapus favicon
                        </button>
                      )}
                      <small>PNG · Maks. 1 MB</small>
                    </div>
                  </div>
                  {data.templates.length ? (
                    <div className={styles.templateGrid}>
                      {data.templates.map((t) => (
                        <button
                          type="button"
                          key={t.slug}
                          className={
                            templateSlug === t.slug ? styles.templateSelected : styles.templateCard
                          }
                          onClick={() => setTemplateSlug(t.slug)}
                        >
                          <div
                            className={styles.templatePreview}
                            style={{
                              background: t.tokens.background ?? "#f4f7ff",
                              color: t.tokens.text ?? "#182344",
                            }}
                          >
                            <span style={{ background: t.tokens.primary ?? "#175de8" }} />
                            <span style={{ background: t.tokens.secondary ?? "#7b36ef" }} />
                            <b>{t.nama}</b>
                            <small>
                              {t.kategori} · v{t.versi}
                            </small>
                          </div>
                          <strong>{t.nama}</strong>
                          <small>{t.deskripsi}</small>
                          {templateSlug === t.slug && <em>✓ Dipilih</em>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>
                      Belum ada template yang diterbitkan oleh Super Admin.
                    </div>
                  )}
                  {selectedTemplate && (
                    <div className={styles.actions}>
                      <button
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => void save("tampilan", { templateSlug })}
                      >
                        Terapkan Template
                      </button>
                      <span>
                        Template dipilih dari katalog platform. Perubahan token berlaku pada
                        tampilan publik yang mendukung token tema.
                      </span>
                    </div>
                  )}
                  <div className={styles.linkCard}>
                    <strong>Pengaturan branding lanjutan</strong>
                    <p>
                      Atur warna utama, warna aksen, dan font tema aktif melalui editor website.
                    </p>
                    <Link href="/website/pengaturan">Buka Pengaturan Website →</Link>
                  </div>
                </section>
                <aside className={styles.side}>
                  <section className={styles.panel}>
                    <h2>Pratinjau Website</h2>
                    <div className={styles.preview}>
                      <div>
                        <strong>{data.desa?.namaDesa}</strong>
                        <small>{data.temaAktif?.nama ?? "Tema belum diterapkan"}</small>
                      </div>
                      <h3>Website Resmi Desa</h3>
                      <p>Informasi, pelayanan, dan transparansi pemerintahan desa.</p>
                    </div>
                    <p className={styles.muted}>
                      Template berasal dari katalog Super Admin. Tema yang tersedia dan
                      dipublikasikan dapat dipilih oleh tenant.
                    </p>
                  </section>
                </aside>
              </div>
            )}
            {tab === "layanan" && (
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
                      onChange={(e) =>
                        setService({ ...service, estimasiHari: Number(e.target.value) })
                      }
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
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nama Layanan</th>
                        <th>Kategori</th>
                        <th>Biaya</th>
                        <th>Estimasi</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.layanan.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.nama}</strong>
                            <small>{item.deskripsi}</small>
                          </td>
                          <td>{item.kategori}</td>
                          <td>Rp {item.biaya.toLocaleString("id-ID")}</td>
                          <td>{item.estimasiHari} hari</td>
                          <td>
                            <span className={item.aktif ? styles.statusOn : styles.statusOff}>
                              {item.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td>
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
                            <button
                              className={styles.textDanger}
                              onClick={() => void removeService(item)}
                            >
                              Nonaktifkan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className={styles.muted}>
                  Perubahan katalog layanan juga digunakan oleh modul Pelayanan Publik.
                </p>
              </section>
            )}
            {tab === "integrasi" && <IntegrationManager />}
            {tab === "backup" && (
              <section className={styles.panel}>
                <header>
                  <h2>Backup & Data</h2>
                  <p>Cadangkan dan pulihkan konfigurasi desa.</p>
                </header>
                <div className={styles.backupGrid}>
                  <article>
                    <span>↓</span>
                    <h3>Backup Konfigurasi</h3>
                    <p>
                      Unduh identitas, profil publik, daftar layanan, tema, dan preferensi desa
                      dalam berkas JSON.
                    </p>
                    <a className={styles.primary} href="/api/pengaturan-desa/backup">
                      Unduh Backup JSON
                    </a>
                  </article>
                  <article>
                    <span>↥</span>
                    <h3>Pulihkan Konfigurasi</h3>
                    <p>
                      Pulihkan preferensi dan profil dari backup konfigurasi desa. Data transaksi
                      dan pengguna tidak ditimpa.
                    </p>
                    <label className={styles.uploadButton}>
                      Pilih File Backup
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={(e) => void restoreBackup(e.target.files?.[0])}
                      />
                    </label>
                  </article>
                </div>
                <div className={styles.storageCard}>
                  <div>
                    <strong>Penyimpanan Media Desa</strong>
                    <small>
                      Total seluruh berkas media desa, termasuk berkas publik dan privat
                    </small>
                  </div>
                  <b>
                    {formatBytes(data.media.usedBytes)} /{" "}
                    {data.media.quotaMb === null
                      ? "Tanpa batas"
                      : formatBytes(data.media.quotaMb * 1024 * 1024)}
                  </b>
                  <progress
                    max="100"
                    value={
                      data.media.quotaMb
                        ? Math.min(
                            100,
                            (data.media.usedBytes / (data.media.quotaMb * 1024 * 1024)) * 100,
                          )
                        : 0
                    }
                  />
                </div>
                <div className={styles.notice}>
                  Backup ini khusus konfigurasi desa, bukan salinan penuh seluruh transaksi,
                  dokumen, akun, dan media. Backup database penuh dan pemulihan seluruh sistem tetap
                  dikelola Super Admin agar isolasi tenant dan konsistensi relasi tetap terjaga.
                </div>
                <div className={styles.linkCard}>
                  <strong>Penggunaan penyimpanan media</strong>
                  <p>Logo dan favicon tersimpan di penyimpanan media tenant.</p>
                  <Link href="/website/pengaturan">Kelola media website →</Link>
                </div>
              </section>
            )}
            {tab === "umum" && (
              <section className={styles.panel}>
                <header>
                  <h2>Pengaturan Umum</h2>
                  <p>Atur preferensi publik, pendaftaran warga, dan penomoran surat.</p>
                </header>
                <div className={styles.preferences}>
                  <label>
                    <span>
                      <strong>Aktifkan komentar publik</strong>
                      <small>
                        Izinkan pengunjung mengirim komentar pada halaman yang mendukung.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={general.komentarAktif}
                      onChange={(e) => setGeneral({ ...general, komentarAktif: e.target.checked })}
                    />
                  </label>
                  <label>
                    <span>
                      <strong>Pendaftaran akun warga</strong>
                      <small>
                        Izinkan warga mengajukan akun. Pengajuan diverifikasi administrator desa;
                        akun baru aktif setelah disetujui.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={general.pendaftaranWargaAktif}
                      onChange={(e) =>
                        setGeneral({ ...general, pendaftaranWargaAktif: e.target.checked })
                      }
                    />
                  </label>
                  <Field label="Jumlah berita pada beranda">
                    <select
                      value={general.beritaBeranda}
                      onChange={(e) =>
                        setGeneral({ ...general, beritaBeranda: Number(e.target.value) })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} berita
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Mode Penomoran Surat">
                    <select
                      value={general.penomoranSurat}
                      onChange={(e) =>
                        setGeneral({ ...general, penomoranSurat: Number(e.target.value) })
                      }
                    >
                      <option value={1}>Nomor global per tahun</option>
                      <option value={2}>Per jenis surat</option>
                      <option value={3}>Gabungan surat layanan dan agenda masuk/keluar</option>
                      <option value={4}>Per klasifikasi surat</option>
                    </select>
                  </Field>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.primary}
                    disabled={busy}
                    onClick={() => void save("umum", general)}
                  >
                    Simpan Pengaturan Umum
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
