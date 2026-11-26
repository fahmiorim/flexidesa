"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeading } from "@/components/shell/page-heading";

import { IntegrationManager } from "./integration-manager";
import { TabKontak } from "./pengaturan-desa-bagian-kontak";
import { TabLayanan } from "./pengaturan-desa-bagian-layanan";
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
  type FaqItem,
  type Kontak,
  type Layanan,
  type MediaField,
  type Sebutan,
  type TabId,
  type Umum,
} from "./pengaturan-desa-types";
import styles from "./pengaturan-desa.module.css";

/**
 * Client Pengaturan Desa.
 *
 * Mengelola sebutan wilayah, kontak & FAQ, tampilan/tema, katalog layanan,
 * integrasi, backup, dan preferensi umum lewat `/api/pengaturan-desa`.
 * Identitas desa (profil, wilayah, media identitas) punya client sendiri di
 * `IdentitasDesaClient` agar dua menu itu tidak berbagi state dan endpoint.
 */
export function PengaturanDesaClient({ initialSection }: { initialSection?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<TabId>(
    () => settingsSections.find(([id]) => id === initialSection)?.[0] ?? "kontak",
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [faqKontak, setFaqKontak] = useState<FaqItem[]>([]);
  const [faqSurat, setFaqSurat] = useState<FaqItem[]>([]);
  const [contact, setContact] = useState<Kontak>(blankKontak);
  const [general, setGeneral] = useState<Umum>(blankUmum);
  const [sebutan, setSebutan] = useState<Sebutan>(blankSebutan);
  const [templateSlug, setTemplateSlug] = useState("");
  const [service, setService] = useState({ ...blankService });
  const [editingService, setEditingService] = useState<number | null>(null);

  const muatPengaturan = useCallback(async (): Promise<Data> => {
    const r = await fetch("/api/pengaturan-desa", { cache: "no-store" });
    const d = (await r.json()) as Data & { error?: string };
    if (!r.ok) throw new Error(d.error || "Gagal memuat pengaturan.");
    return d;
  }, []);

  function terapkanPengaturan(d: Data) {
    setData(d);
    setFaqKontak(d.faqKontak ?? []);
    setFaqSurat(d.faqSurat ?? []);
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
  }, [muatPengaturan]);

  async function save(section: string, payload: unknown): Promise<boolean> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/pengaturan-desa", {
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

  async function upload(field: MediaField, file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fd = new FormData();
      fd.set("field", field);
      fd.set("file", file);
      const r = await fetch("/api/pengaturan-desa/media", { method: "POST", body: fd });
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
    const r = await fetch("/api/pengaturan-desa/media?field=" + field, { method: "DELETE" });
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
      <PageHeading
        judul={<>Pengaturan Desa</>}
        deskripsi={
          <>
            Kelola sebutan wilayah, kontak, tampilan website, layanan, integrasi, backup, dan
            preferensi desa.
          </>
        }
        aksi={
          <>
            <Link href="/profil-desa/identitas-desa" className={styles.secondary}>
              ← Identitas Desa
            </Link>
          </>
        }
      />
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
            <TabKontak
              busy={busy}
              contact={contact}
              faqKontak={faqKontak}
              save={save}
              setContact={setContact}
              setFaqKontak={setFaqKontak}
            />
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
                      Template dipilih dari katalog platform. Perubahan token berlaku pada tampilan
                      publik yang mendukung token tema.
                    </span>
                  </div>
                )}
                <div className={styles.linkCard}>
                  <strong>Pengaturan branding lanjutan</strong>
                  <p>Atur warna utama, warna aksen, dan font tema aktif melalui editor website.</p>
                  <Link href="/profil-desa/website/pengaturan">Buka Pengaturan Website →</Link>
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
                    Template berasal dari katalog Super Admin. Tema yang tersedia dan dipublikasikan
                    dapat dipilih oleh tenant.
                  </p>
                </section>
              </aside>
            </div>
          )}
          {tab === "layanan" && (
            <TabLayanan
              busy={busy}
              data={data}
              editingService={editingService}
              faqSurat={faqSurat}
              removeService={removeService}
              save={save}
              saveService={saveService}
              service={service}
              setEditingService={setEditingService}
              setFaqSurat={setFaqSurat}
              setService={setService}
            />
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
                    Unduh identitas, profil publik, daftar layanan, tema, dan preferensi desa dalam
                    berkas JSON.
                  </p>
                  <a className={styles.primary} href="/api/pengaturan-desa/backup">
                    Unduh Backup JSON
                  </a>
                </article>
                <article>
                  <span>↥</span>
                  <h3>Pulihkan Konfigurasi</h3>
                  <p>
                    Pulihkan preferensi dan profil dari backup konfigurasi desa. Data transaksi dan
                    pengguna tidak ditimpa.
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
                  <small>Total seluruh berkas media desa, termasuk berkas publik dan privat</small>
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
                Backup ini khusus konfigurasi desa, bukan salinan penuh seluruh transaksi, dokumen,
                akun, dan media. Backup database penuh dan pemulihan seluruh sistem tetap dikelola
                Super Admin agar isolasi tenant dan konsistensi relasi tetap terjaga.
              </div>
              <div className={styles.linkCard}>
                <strong>Penggunaan penyimpanan media</strong>
                <p>Logo dan favicon tersimpan di penyimpanan media tenant.</p>
                <Link href="/profil-desa/website/pengaturan">Kelola media website →</Link>
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
                    <small>Izinkan pengunjung mengirim komentar pada halaman yang mendukung.</small>
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
                      Izinkan warga mengajukan akun. Pengajuan diverifikasi administrator desa; akun
                      baru aktif setelah disetujui.
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
    </div>
  );
}
