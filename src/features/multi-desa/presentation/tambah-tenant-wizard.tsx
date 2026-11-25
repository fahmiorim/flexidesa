"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { normalisasiDomain, POLA_DOMAIN } from "@/features/multi-desa/domain/desa-baru";
import { susunSubdomainPlatform } from "@/features/multi-desa/domain/jenis-domain";
import type { TokenTemplate } from "@/features/multi-desa/domain/template-website";
import type { Wilayah } from "@/features/wilayah/domain/data-wilayah";
import { PickerWilayah } from "@/features/wilayah/presentation/picker-wilayah";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { PlatformCard } from "./platform-ui";
import { TemplatePreview } from "./template-preview";

/**
 * Wizard pendaftaran tenant (desa) baru.
 *
 * Alurnya mengikuti percakapan langganan: desa didaftarkan dulu (identitas
 * wilayah), lalu domain dibuatkan, template dipilih, dan akun administrator
 * dibuat. Semua isian dikumpulkan dalam satu form dan dikirim sekali ke
 * `buatDesaAction`; provisioning (desa, domain, fondasi, akun admin) tetap
 * berjalan di server lewat use case yang sama dengan dialog Konsol Tenant.
 */

export interface PilihanTemplateTenant {
  id: number;
  slug: string;
  name: string;
  description: string;
  version: string;
  tokens: TokenTemplate;
}

export interface PilihanPaketTenant {
  planId: number;
  planSlug: string;
  planName: string;
  description: string | null;
  versionId: number;
  version: number;
  features: readonly { slug: string; name: string }[];
}

type JenisDomain = "subdomain" | "custom";

const LANGKAH = [
  { nomor: 1, judul: "Identitas Desa", keterangan: "Nama, kode, dan wilayah desa" },
  { nomor: 2, judul: "Domain", keterangan: "Alamat website desa" },
  { nomor: 3, judul: "Template", keterangan: "Tema website publik" },
  { nomor: 4, judul: "Paket", keterangan: "Langganan tenant baru" },
  { nomor: 5, judul: "Administrator", keterangan: "Akun admin desa pertama" },
  { nomor: 6, judul: "Ringkasan", keterangan: "Periksa lalu buat tenant" },
] as const;

const slugDariNama = (nama: string): string => {
  const dasar = nama
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return dasar || "desa";
};

export function TambahTenantWizard({
  baseDomain,
  templates,
  packages,
  aksiBuat,
}: {
  baseDomain: string | null;
  templates: readonly PilihanTemplateTenant[];
  packages: readonly PilihanPaketTenant[];
  aksiBuat: (
    state: ActionState<{ id: number }>,
    formData: FormData,
  ) => Promise<ActionState<{ id: number }>>;
}) {
  const [langkah, setLangkah] = useState(1);
  const [namaDesa, setNamaDesa] = useState("");
  const [kodeDesa, setKodeDesa] = useState("");
  const [kodeBps, setKodeBps] = useState("");
  const [kodePos, setKodePos] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [emailDesa, setEmailDesa] = useState("");
  const [slugManual, setSlugManual] = useState("");
  const [jenis, setJenis] = useState<JenisDomain>("subdomain");
  const [customInput, setCustomInput] = useState("");
  const [themeSlug, setThemeSlug] = useState("");
  const [planVersionId, setPlanVersionId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [kuotaMediaMb, setKuotaMediaMb] = useState("");
  const [headName, setHeadName] = useState("");

  const [formState, formAction, pending] = useActionState(
    aksiBuat,
    createIdleActionState<{ id: number }>(),
  );
  const selesai = formState.status === "success";
  const idFormTerpakai = useRef(0);

  // Nama dan kode desa diisi dari picker wilayah, tetapi tetap dapat diubah
  // manual seperti pada dialog Konsol Tenant.
  const otomatis = useRef<Wilayah | null>(null);

  useEffect(() => {
    if (formState.status !== "success") return;
    if (idFormTerpakai.current === formState.data.id) return;
    idFormTerpakai.current = formState.data.id;
    setLangkah(LANGKAH.length + 1);
  }, [formState]);

  function terapkanDesa(desa: Wilayah | null) {
    const sebelumnya = otomatis.current;
    otomatis.current = desa;

    if (desa) {
      setNamaDesa(desa.nama);
      setKodeDesa(desa.kode);
      setKodeBps(desa.kodeBps ?? "");
      setKodePos(desa.kodePos ?? "");
      return;
    }
    if (sebelumnya && namaDesa === sebelumnya.nama) setNamaDesa("");
    if (sebelumnya && kodeDesa === sebelumnya.kode) {
      setKodeDesa("");
      setKodeBps("");
      setKodePos("");
    }
  }

  const slugDesa = useMemo(() => slugDariNama(namaDesa), [namaDesa]);
  const slugEfektif = slugManual.trim() ? slugManual.trim().toLowerCase() : slugDesa;
  const hostSubdomain = useMemo(
    () => susunSubdomainPlatform(slugEfektif, baseDomain),
    [slugEfektif, baseDomain],
  );
  const customNormal = normalisasiDomain(customInput);
  const hostCustom = customNormal && POLA_DOMAIN.test(customNormal) ? customNormal : null;
  const hostTarget = jenis === "subdomain" ? hostSubdomain : hostCustom;
  const templateTerpilih = templates.find((item) => item.slug === themeSlug) ?? null;
  const paketTerpilih = packages.find((item) => String(item.versionId) === planVersionId) ?? null;

  const identitasValid =
    namaDesa.trim().length >= 3 && /^\d{10}$/.test(kodeDesa.trim().replaceAll(".", ""));
  const domainValid = jenis === "subdomain" ? hostSubdomain !== null : hostCustom !== null;
  const adminValid =
    adminName.trim().length >= 3 &&
    /^[a-z0-9._-]{3,50}$/i.test(adminUsername.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim()) &&
    adminPassword.length >= 8 &&
    adminPasswordConfirm === adminPassword;
  const emailDesaValid =
    emailDesa.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDesa.trim());

  const validPerLangkah: Record<number, boolean> = {
    1: identitasValid && emailDesaValid,
    2: domainValid,
    3: true,
    4: paketTerpilih !== null,
    5: adminValid,
    6: true,
  };

  function kembali() {
    setLangkah((sebelumnya) => Math.max(1, sebelumnya - 1));
  }

  function lanjut() {
    setLangkah((sebelumnya) => Math.min(LANGKAH.length, sebelumnya + 1));
  }

  function mulaiLagi() {
    setLangkah(1);
    setNamaDesa("");
    setKodeDesa("");
    setKodeBps("");
    setKodePos("");
    setOfficeAddress("");
    setPhone("");
    setEmailDesa("");
    setSlugManual("");
    setJenis("subdomain");
    setCustomInput("");
    setThemeSlug("");
    setPlanVersionId("");
    setAdminName("");
    setAdminUsername("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminPasswordConfirm("");
    setKuotaMediaMb("");
    setHeadName("");
    otomatis.current = null;
  }

  const langkahTampil = selesai ? LANGKAH.length + 1 : langkah;

  return (
    <div className="domain-wizard">
      <div className="domain-wizard-steps-wrap">
        <span aria-hidden="true" className="domain-wizard-track">
          <span
            className="domain-wizard-track-fill"
            style={{ width: `${((langkahTampil - 1) / LANGKAH.length) * 100}%` }}
          />
        </span>
        <ol aria-label="Langkah pendaftaran tenant" className="domain-wizard-steps">
          {LANGKAH.map((item) => {
            const selesaiLangkah = item.nomor < langkahTampil;
            const aktif = item.nomor === langkahTampil;
            return (
              <li
                aria-current={aktif ? "step" : undefined}
                className={aktif ? "is-active" : selesaiLangkah ? "is-done" : undefined}
                key={item.nomor}
              >
                <span className="domain-wizard-step-number" aria-hidden="true">
                  {selesaiLangkah ? "✓" : item.nomor}
                </span>
                <strong>{item.judul}</strong>
                <span>{item.keterangan}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <form action={formAction}>
        <div className="domain-wizard-layout">
          <div className="domain-wizard-main">
            <div hidden={langkah !== 1 || selesai}>
              <PlatformCard>
                <div className="domain-wizard-card-head">
                  <div>
                    <span className="domain-wizard-eyebrow">Langkah 1</span>
                    <h2>Desa apa yang didaftarkan?</h2>
                    <p>
                      Pilih lewat picker wilayah agar nama dan kode Kemendagri terisi otomatis, atau
                      isi manual. Kecamatan, kabupaten, dan provinsi ikut tercatat.
                    </p>
                  </div>
                </div>

                <div className="platform-form-grid">
                  <PickerWilayah onPilihDesa={terapkanDesa} />
                  <label className="form-field">
                    <span className="form-label">Nama desa</span>
                    <input
                      className="form-input"
                      name="name"
                      required
                      minLength={3}
                      maxLength={100}
                      value={namaDesa}
                      onChange={(event) => setNamaDesa(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Kode desa (10 digit)</span>
                    <input
                      className="form-input"
                      name="code"
                      required
                      inputMode="numeric"
                      pattern="[\d.]{10,13}"
                      maxLength={13}
                      value={kodeDesa}
                      onChange={(event) => setKodeDesa(event.target.value)}
                    />
                    <span className="form-help">
                      Boleh dengan titik (11.01.01.2001); titik dibuang saat disimpan.
                    </span>
                  </label>
                  <label className="form-field">
                    <span className="form-label">Kode BPS</span>
                    <input
                      className="form-input"
                      name="kodeBps"
                      inputMode="numeric"
                      maxLength={10}
                      value={kodeBps}
                      onChange={(event) => setKodeBps(event.target.value)}
                    />
                    <span className="form-help">
                      Terisi otomatis dari wilayah; kosongkan bila datanya belum tersedia.
                    </span>
                  </label>
                  <label className="form-field">
                    <span className="form-label">Kode pos</span>
                    <input
                      className="form-input"
                      name="kodePos"
                      inputMode="numeric"
                      maxLength={5}
                      value={kodePos}
                      onChange={(event) => setKodePos(event.target.value)}
                    />
                    <span className="form-help">Terisi otomatis dari wilayah.</span>
                  </label>
                  <label className="form-field">
                    <span className="form-label">Nama kepala desa (opsional)</span>
                    <input
                      className="form-input"
                      name="headName"
                      maxLength={100}
                      value={headName}
                      onChange={(event) => setHeadName(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Alamat kantor desa (opsional)</span>
                    <input
                      className="form-input"
                      name="officeAddress"
                      maxLength={255}
                      placeholder="Jl. Raya Desa No. 1"
                      value={officeAddress}
                      onChange={(event) => setOfficeAddress(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Telepon desa (opsional)</span>
                    <input
                      className="form-input"
                      name="phone"
                      maxLength={30}
                      inputMode="tel"
                      placeholder="0622-123456"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Email resmi desa (opsional)</span>
                    <input
                      className="form-input"
                      name="email"
                      type="email"
                      maxLength={100}
                      placeholder="pemdes@tanjungkubah.desa.id"
                      value={emailDesa}
                      onChange={(event) => setEmailDesa(event.target.value)}
                    />
                    <span className="form-help">
                      Dipakai sebagai kontak publik desa. Berbeda dari email admin di langkah 4.
                    </span>
                    {!emailDesaValid ? (
                      <span className="form-error" role="alert">
                        Format email desa tidak valid.
                      </span>
                    ) : null}
                  </label>
                </div>
              </PlatformCard>
            </div>

            <div hidden={langkah !== 2 || selesai}>
              <PlatformCard>
                <div className="domain-wizard-card-head">
                  <div>
                    <span className="domain-wizard-eyebrow">Langkah 2</span>
                    <h2>Domain untuk {namaDesa}</h2>
                    <p>
                      Subdomain platform dibuat otomatis dari nama desa; custom domain dipakai bila
                      desa sudah memiliki alamat sendiri.
                    </p>
                  </div>
                </div>

                <div className="domain-wizard-types">
                  <label
                    className={
                      jenis === "subdomain"
                        ? "domain-wizard-type is-selected"
                        : "domain-wizard-type"
                    }
                  >
                    <input
                      checked={jenis === "subdomain"}
                      className="sr-only"
                      disabled={!hostSubdomain}
                      onChange={() => setJenis("subdomain")}
                      type="radio"
                      value="subdomain"
                    />
                    <span className="domain-wizard-radio" aria-hidden="true" />
                    <strong>Subdomain Platform</strong>
                    <p>Menggunakan domain utama platform FlexiDesa.</p>
                    <span className="domain-wizard-example">
                      {hostSubdomain
                        ? `Contoh: ${hostSubdomain}`
                        : "Isi nama desa dan pastikan DESA_BASE_DOMAIN terkonfigurasi."}
                    </span>
                  </label>

                  <label
                    className={
                      jenis === "custom" ? "domain-wizard-type is-selected" : "domain-wizard-type"
                    }
                  >
                    <input
                      checked={jenis === "custom"}
                      className="sr-only"
                      onChange={() => setJenis("custom")}
                      type="radio"
                      value="custom"
                    />
                    <span className="domain-wizard-radio" aria-hidden="true" />
                    <strong>Custom Domain</strong>
                    <p>Menggunakan domain sendiri (mis. .go.id, .desa.id, .id).</p>
                    <span className="domain-wizard-example">
                      {hostCustom ? `Contoh: ${hostCustom}` : "Contoh: desatanjung.go.id"}
                    </span>
                  </label>
                </div>

                {jenis === "custom" ? (
                  <label className="form-field">
                    <span className="form-label">Nama domain</span>
                    <input
                      autoComplete="off"
                      className="form-input"
                      name="domainCustom"
                      maxLength={255}
                      placeholder="desa-sukamaju.go.id"
                      value={customInput}
                      onChange={(event) => setCustomInput(event.target.value)}
                    />
                    <span className="form-help">
                      Tanpa <code>https://</code> dan tanpa garis miring. Domain harus unik lintas
                      tenant.
                    </span>
                    {customInput.trim() && !hostCustom ? (
                      <span className="form-error" role="alert">
                        Format domain tidak valid (contoh: desa-sukamaju.id).
                      </span>
                    ) : null}
                  </label>
                ) : (
                  <label className="form-field">
                    <span className="form-label">Label subdomain</span>
                    <input
                      autoComplete="off"
                      className="form-input"
                      maxLength={50}
                      placeholder={slugDesa}
                      value={slugManual}
                      onChange={(event) => setSlugManual(event.target.value)}
                    />
                    <span className="form-help">
                      Kosongkan untuk memakai label dari nama desa. Hasil:{" "}
                      <strong>{hostSubdomain ?? "belum dapat disusun"}</strong>
                    </span>
                    {slugManual.trim() && !hostSubdomain ? (
                      <span className="form-error" role="alert">
                        Label subdomain hanya huruf kecil, angka, dan tanda hubung (3–50 karakter).
                      </span>
                    ) : null}
                  </label>
                )}
              </PlatformCard>
            </div>

            <div hidden={langkah !== 3 || selesai}>
              <PlatformCard>
                <div className="domain-wizard-card-head">
                  <div>
                    <span className="domain-wizard-eyebrow">Langkah 3</span>
                    <h2>Template website</h2>
                    <p>
                      Pilih tema publik untuk situs desa baru, atau tetap memakai tema bawaan
                      platform.
                    </p>
                  </div>
                </div>

                <div className="domain-wizard-types">
                  <label
                    className={
                      themeSlug === "" ? "domain-wizard-type is-selected" : "domain-wizard-type"
                    }
                  >
                    <input
                      checked={themeSlug === ""}
                      className="sr-only"
                      onChange={() => setThemeSlug("")}
                      type="radio"
                    />
                    <span className="domain-wizard-radio" aria-hidden="true" />
                    <strong>Tema bawaan platform</strong>
                    <p>Template fondasi yang disalin ke desa baru.</p>
                  </label>

                  {templates.map((item) => (
                    <label
                      className={
                        themeSlug === item.slug
                          ? "domain-wizard-type is-selected"
                          : "domain-wizard-type"
                      }
                      key={item.id}
                    >
                      <input
                        checked={themeSlug === item.slug}
                        className="sr-only"
                        onChange={() => setThemeSlug(item.slug)}
                        type="radio"
                      />
                      <span className="domain-wizard-radio" aria-hidden="true" />
                      <strong>{item.name}</strong>
                      <p>
                        {item.description} · v{item.version}
                      </p>
                      <TemplatePreview name={item.name} tokens={item.tokens} />
                    </label>
                  ))}
                </div>

                {templates.length === 0 ? (
                  <p className="form-help">
                    Belum ada template terbit di katalog. Desa baru memakai tema bawaan platform.
                  </p>
                ) : null}
              </PlatformCard>
            </div>

            <div hidden={langkah !== 4 || selesai}>
              <PlatformCard>
                <div className="domain-wizard-card-head">
                  <div>
                    <span className="domain-wizard-eyebrow">Langkah 4</span>
                    <h2>Paket langganan</h2>
                    <p>
                      Pilih paket terbit untuk tenant baru. Modul di luar paket akan dibatasi tanpa
                      menghapus datanya.
                    </p>
                  </div>
                </div>

                {packages.length === 0 ? (
                  <div className="form-stack">
                    <p className="form-help">Belum ada paket dengan versi terbit.</p>
                    <p>
                      <Link className="button button-secondary" href="/super-admin/paket">
                        Atur paket
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="domain-wizard-types">
                    {packages.map((item) => (
                      <label
                        className={
                          planVersionId === String(item.versionId)
                            ? "domain-wizard-type is-selected"
                            : "domain-wizard-type"
                        }
                        key={item.versionId}
                      >
                        <input
                          checked={planVersionId === String(item.versionId)}
                          className="sr-only"
                          onChange={() => setPlanVersionId(String(item.versionId))}
                          type="radio"
                        />
                        <span className="domain-wizard-radio" aria-hidden="true" />
                        <strong>
                          {item.planName} · v{item.version}
                        </strong>
                        {item.description ? <p>{item.description}</p> : null}
                        {item.features.length > 0 ? (
                          <p className="form-help">
                            {item.features.map((fitur) => fitur.name).join(", ")}
                          </p>
                        ) : null}
                      </label>
                    ))}
                  </div>
                )}
              </PlatformCard>
            </div>

            <div hidden={langkah !== 5 || selesai}>
              <PlatformCard>
                <div className="domain-wizard-card-head">
                  <div>
                    <span className="domain-wizard-eyebrow">Langkah 5</span>
                    <h2>Akun administrator pertama</h2>
                    <p>
                      Akun ini menjadi administrator desa baru dan dapat mengubah sandinya sendiri
                      setelah masuk.
                    </p>
                  </div>
                </div>

                <div className="platform-form-grid">
                  <label className="form-field">
                    <span className="form-label">Nama administrator</span>
                    <input
                      className="form-input"
                      name="adminName"
                      required
                      minLength={3}
                      maxLength={255}
                      value={adminName}
                      onChange={(event) => setAdminName(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Username administrator</span>
                    <input
                      className="form-input"
                      name="adminUsername"
                      required
                      minLength={3}
                      maxLength={50}
                      value={adminUsername}
                      onChange={(event) => setAdminUsername(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Email administrator</span>
                    <input
                      className="form-input"
                      name="adminEmail"
                      type="email"
                      required
                      maxLength={255}
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Sandi awal administrator</span>
                    <input
                      className="form-input"
                      name="adminPassword"
                      type="password"
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Ulangi sandi awal</span>
                    <input
                      className="form-input"
                      name="adminPasswordConfirm"
                      type="password"
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      value={adminPasswordConfirm}
                      onChange={(event) => setAdminPasswordConfirm(event.target.value)}
                    />
                    {adminPasswordConfirm.length > 0 && adminPasswordConfirm !== adminPassword ? (
                      <span className="form-error" role="alert">
                        Konfirmasi sandi belum sama.
                      </span>
                    ) : null}
                  </label>
                  <label className="form-field">
                    <span className="form-label">Kuota media (MB, kosong = tanpa batas)</span>
                    <input
                      className="form-input"
                      name="kuotaMediaMb"
                      type="number"
                      min={1}
                      step={1}
                      value={kuotaMediaMb}
                      onChange={(event) => setKuotaMediaMb(event.target.value)}
                    />
                  </label>
                </div>
              </PlatformCard>
            </div>

            <div hidden={langkah !== 6 || selesai}>
              <PlatformCard>
                <div className="domain-wizard-card-head">
                  <div>
                    <span className="domain-wizard-eyebrow">Langkah 6</span>
                    <h2>Ringkasan pendaftaran</h2>
                    <p>Periksa kembali sebelum tenant dibuat. Fondasi tenant disalin otomatis.</p>
                  </div>
                </div>

                <dl className="domain-wizard-finish-list">
                  <div>
                    <dt>Desa</dt>
                    <dd>
                      {namaDesa} · kode {kodeDesa}
                    </dd>
                  </div>
                  <div>
                    <dt>Domain</dt>
                    <dd>{hostTarget ?? "Belum diisi"}</dd>
                  </div>
                  <div>
                    <dt>Kontak desa</dt>
                    <dd>
                      {[officeAddress.trim(), phone.trim(), emailDesa.trim()]
                        .filter(Boolean)
                        .join(" · ") || "Belum diisi"}
                    </dd>
                  </div>
                  <div>
                    <dt>Template</dt>
                    <dd>
                      {templateTerpilih
                        ? `${templateTerpilih.name} · v${templateTerpilih.version}`
                        : "Tema bawaan platform"}
                    </dd>
                  </div>
                  <div>
                    <dt>Paket</dt>
                    <dd>
                      {paketTerpilih
                        ? `${paketTerpilih.planName} · v${paketTerpilih.version}`
                        : "Belum dipilih"}
                    </dd>
                  </div>
                  <div>
                    <dt>Administrator</dt>
                    <dd>
                      {adminName} · {adminUsername} · {adminEmail}
                    </dd>
                  </div>
                  <div>
                    <dt>Kuota media</dt>
                    <dd>{kuotaMediaMb.trim() ? `${kuotaMediaMb} MB` : "Tanpa batas"}</dd>
                  </div>
                </dl>

                {formState.status === "error" ? (
                  <p className="domain-wizard-note is-error" role="alert">
                    {formState.message}
                  </p>
                ) : null}
              </PlatformCard>
            </div>

            {selesai ? (
              <PlatformCard>
                <div className="domain-wizard-finish">
                  <span className="domain-wizard-finish-icon" aria-hidden="true">
                    ✓
                  </span>
                  <span className="domain-wizard-eyebrow">Selesai</span>
                  <h2>Tenant {namaDesa} berhasil dibuat</h2>
                  <p>
                    Fondasi tenant (role, modul, tema, menu publik) sudah disalin dan akun
                    administrator sudah siap dipakai.
                  </p>

                  <dl className="domain-wizard-finish-list">
                    <div>
                      <dt>Desa</dt>
                      <dd>
                        {namaDesa} · kode {kodeDesa}
                      </dd>
                    </div>
                    <div>
                      <dt>Domain</dt>
                      <dd>{hostTarget ?? "Belum diisi"}</dd>
                    </div>
                    <div>
                      <dt>Template</dt>
                      <dd>
                        {templateTerpilih
                          ? `${templateTerpilih.name} · v${templateTerpilih.version}`
                          : "Tema bawaan platform"}
                      </dd>
                    </div>
                    <div>
                      <dt>Paket</dt>
                      <dd>
                        {paketTerpilih
                          ? `${paketTerpilih.planName} · v${paketTerpilih.version}`
                          : "Belum dipilih"}
                      </dd>
                    </div>
                    <div>
                      <dt>Administrator</dt>
                      <dd>
                        {adminName} · {adminUsername}
                      </dd>
                    </div>
                  </dl>

                  <div className="domain-wizard-finish-actions">
                    <Link className="button button-primary" href="/super-admin/tenant">
                      Lihat Konsol Tenant
                    </Link>
                    <button className="button button-secondary" onClick={mulaiLagi} type="button">
                      Tambah Tenant Lain
                    </button>
                  </div>
                </div>
              </PlatformCard>
            ) : null}

            {/* Nilai akhir untuk Server Action: semua langkah dalam satu form. */}
            <input type="hidden" name="domain" value={hostTarget ?? ""} />
            <input type="hidden" name="slug" value={jenis === "subdomain" ? slugEfektif : ""} />
            <input type="hidden" name="themeSlug" value={themeSlug} />
            <input type="hidden" name="planVersionId" value={planVersionId} />
          </div>

          <aside className="domain-wizard-side">
            <PlatformCard title="Pratinjau Domain">
              <div className="domain-preview">
                <div className="domain-preview-browser">
                  <span className="domain-preview-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="domain-preview-url">{hostTarget ?? "domain-belum-dipilih"}</span>
                </div>
                <div className="domain-preview-nav">
                  <span className="domain-preview-brand">
                    <span aria-hidden="true">
                      {(namaDesa.trim().charAt(0) || "D").toUpperCase()}
                    </span>
                    {namaDesa.trim() || "Desa baru"}
                  </span>
                  <span>Beranda</span>
                  <span>Profil</span>
                  <span>Layanan</span>
                  <span>Berita</span>
                  <span>Kontak</span>
                </div>
                <div className="domain-preview-hero">
                  <div>
                    <strong>{namaDesa.trim() || "Desa baru"}</strong>
                    <span>Kode {kodeDesa.trim() || "—"}</span>
                  </div>
                </div>
                <p className="domain-preview-caption">
                  Pratinjau alamat dan identitas desa. Tampilan situs mengikuti tema terpilih.
                </p>
              </div>
            </PlatformCard>

            <PlatformCard title="Alur Pendaftaran Tenant">
              <ol className="domain-wizard-flow">
                {LANGKAH.map((item) => (
                  <li
                    className={
                      item.nomor < langkahTampil
                        ? "is-done"
                        : item.nomor === langkahTampil
                          ? "is-active"
                          : undefined
                    }
                    key={item.nomor}
                  >
                    <span aria-hidden="true">{item.nomor < langkahTampil ? "✓" : item.nomor}</span>
                    <div>
                      <strong>{item.judul}</strong>
                      <p>{item.keterangan}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </PlatformCard>
          </aside>
        </div>

        <div className="domain-wizard-footer">
          <Link className="button button-secondary domain-wizard-cancel" href="/super-admin/domain">
            <span aria-hidden="true">✕</span> Batal
          </Link>
          <div className="domain-wizard-footer-actions">
            {!selesai && langkah > 1 ? (
              <button className="button button-secondary" onClick={kembali} type="button">
                <span aria-hidden="true">‹</span> Sebelumnya
              </button>
            ) : null}
            {!selesai && langkah < LANGKAH.length ? (
              <button
                className="button button-primary"
                disabled={!validPerLangkah[langkah]}
                onClick={lanjut}
                type="button"
              >
                Selanjutnya <span aria-hidden="true">›</span>
              </button>
            ) : null}
            {!selesai && langkah === LANGKAH.length ? (
              <button className="button button-primary" disabled={pending} type="submit">
                {pending ? "Membuat..." : "Buat tenant"} <span aria-hidden="true">›</span>
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
