"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldShell } from "@/components/ui/form-field";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import type { KonfigurasiTtePageData } from "@/features/pelayanan-persuratan/surat/application/tte-use-cases";
import {
  FIELD_PENDUDUK_LUAR,
  FORMAT_TANGGAL_SURAT,
  LABEL_FIELD_PENDUDUK_LUAR,
  LABEL_FORMAT_TANGGAL,
  LABEL_POSISI_LOGO,
} from "@/features/pelayanan-persuratan/surat/domain/pengaturan-surat";
import {
  POSISI_LOGO_SURAT,
  type Pengaturan,
} from "@/features/pengaturan/pengaturan/domain/pengaturan";
import { mediaUrl } from "@/features/pengaturan/pengaturan/presentation/pengaturan-desa-types";
import { createIdleActionState } from "@/lib/action-state";

import { simpanPengaturanSuratAction, simpanTteSuratAction } from "./actions";

const TAB = [
  { kunci: "kop", label: "Header & Footer" },
  { kunci: "alur", label: "Alur Verifikasi" },
  { kunci: "tte", label: "TTE" },
  { kunci: "luar", label: "Penduduk Luar" },
  { kunci: "lainnya", label: "Lainnya" },
] as const;

type KunciTab = (typeof TAB)[number]["kunci"];

/** Placeholder yang tersedia pada template header/footer surat. */
const TOKEN_HEADER = [
  "nama_desa",
  "nama_kecamatan",
  "nama_kabupaten",
  "nama_propinsi",
  "alamat_kantor",
  "telepon_desa",
  "email_desa",
  "kode_desa",
] as const;

function Field({
  label,
  hint,
  galat,
  children,
}: {
  label: string;
  hint?: string;
  galat?: string;
  children: React.ReactNode;
}) {
  return (
    <FieldShell label={label} helpText={hint} error={galat}>
      {children}
    </FieldShell>
  );
}

export function PengaturanSuratForm({
  pengaturan,
  canManage,
  tte,
}: {
  pengaturan: Pengaturan;
  canManage: boolean;
  tte: KonfigurasiTtePageData | null;
}) {
  const [tab, setTab] = useState<KunciTab>("kop");
  const [state, formAction, pending] = useActionState(
    simpanPengaturanSuratAction,
    createIdleActionState<null>(),
  );
  const [stateTte, formActionTte, pendingTte] = useActionState(
    simpanTteSuratAction,
    createIdleActionState<null>(),
  );
  const galat = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <div className="modul-card" style={{ padding: 22, display: "grid", gap: 18 }}>
      <div className="website-settings-tabs" role="tablist" aria-label="Bagian pengaturan surat">
        {TAB.map((item) => (
          <button
            key={item.kunci}
            aria-selected={tab === item.kunci}
            className={tab === item.kunci ? "is-active" : undefined}
            onClick={() => setTab(item.kunci)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "tte" ? (
        <form action={formActionTte} className="form-stack">
          <PesanDialog state={stateTte} />
          <p className="modul-muted">
            Passphrase TTE tidak disimpan; atur lewat variabel lingkungan platform.
          </p>

          {tte === null ? (
            <p className="modul-muted">
              Role Anda tidak berwenang mengelola TTE. Hubungi administrator desa untuk mengaturnya.
            </p>
          ) : (
            <>
              {tte.masalah.length > 0 ? (
                <ul className="modul-muted" style={{ margin: 0, paddingLeft: 18 }}>
                  {tte.masalah.map((pesan) => (
                    <li key={pesan}>{pesan}</li>
                  ))}
                </ul>
              ) : null}

              <div className="modul-form-grid">
                <Field label="Mode TTE" hint="Mode BSrE menandatangani surat otomatis saat terbit.">
                  <select className="form-input" defaultValue={tte.tersimpan.mode} name="mode">
                    <option value="nonaktif">Nonaktif</option>
                    <option value="manual">Manual (unggah berkas sendiri)</option>
                    <option value="bsre">BSrE (otomatis)</option>
                  </select>
                </Field>
                <Field label="URL API provider" hint="Harus memakai host yang diizinkan platform.">
                  <input
                    className="form-input"
                    defaultValue={tte.tersimpan.api}
                    maxLength={300}
                    name="api"
                    placeholder="https://"
                  />
                </Field>
                <Field label="Username / NIK penanda tangan">
                  <input
                    className="form-input"
                    defaultValue={tte.tersimpan.username}
                    maxLength={150}
                    name="username"
                  />
                </Field>
                <Field label="NIK penanda tangan" hint="16 digit, kosongkan bila tidak dipakai.">
                  <input
                    className="form-input"
                    defaultValue={tte.tersimpan.nik}
                    inputMode="numeric"
                    maxLength={16}
                    name="nik"
                  />
                </Field>
              </div>

              <label className="modul-inline-check">
                <input defaultChecked={tte.tersimpan.aktif} name="aktif" type="checkbox" />
                <span>Aktifkan TTE untuk surat desa</span>
              </label>

              <div className="penduduk-heading-actions">
                <Button variant="primary" disabled={!tte.canManage || pendingTte} type="submit">
                  {pendingTte ? "Menyimpan…" : "Simpan Konfigurasi TTE"}
                </Button>
              </div>
            </>
          )}
        </form>
      ) : (
        <form action={formAction} className="form-stack">
          <PesanDialog state={state} />

          <fieldset
            disabled={!canManage}
            hidden={tab !== "kop"}
            style={{ border: 0, margin: 0, padding: 0 }}
          >
            <div className="modul-form-grid">
              <Field
                label="Tinggi header (cm)"
                galat={galat("suratTinggiHeader")}
                hint="Ruang kop surat. Isi 0 bila surat tanpa header."
              >
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratTinggiHeader}
                  min={0}
                  name="suratTinggiHeader"
                  step="0.1"
                  type="number"
                />
              </Field>
              <Field
                label="Tinggi footer (cm)"
                galat={galat("suratTinggiFooter")}
                hint="Ruang footer cetak."
              >
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratTinggiFooter}
                  min={0}
                  name="suratTinggiFooter"
                  step="0.1"
                  type="number"
                />
              </Field>
            </div>
            <div className="modul-form-grid" style={{ marginTop: 14 }}>
              <Field
                label="Template header"
                galat={galat("suratTemplateHeader")}
                hint="Kosongkan untuk memakai kop otomatis dari identitas desa. Satu baris satu baris teks."
              >
                <textarea
                  className="form-input"
                  defaultValue={pengaturan.suratTemplateHeader}
                  maxLength={4000}
                  name="suratTemplateHeader"
                  placeholder={"PEMERINTAH KABUPATEN …\nKECAMATAN …\nDESA …"}
                  rows={5}
                />
              </Field>
              <Field
                label="Template footer"
                galat={galat("suratTemplateFooter")}
                hint="Dicetak di bawah tautan verifikasi surat."
              >
                <textarea
                  className="form-input"
                  defaultValue={pengaturan.suratTemplateFooter}
                  maxLength={4000}
                  name="suratTemplateFooter"
                  placeholder="Contoh: Dokumen ini sah tanpa tanda tangan basah."
                  rows={5}
                />
              </Field>
            </div>
            <div className="modul-form-grid" style={{ marginTop: 14 }}>
              <Field
                label="Logo kop surat"
                galat={galat("logo")}
                hint="JPG, PNG, GIF, WEBP, atau SVG maksimal 2 MB. Kosong = memakai logo identitas desa."
              >
                <input
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  className="form-input"
                  name="logo"
                  type="file"
                />
              </Field>
              {pengaturan.suratLogo ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Pratinjau logo kop surat"
                    src={mediaUrl(pengaturan.suratLogo)}
                    style={{
                      height: 64,
                      width: "auto",
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "#fff",
                      padding: 4,
                    }}
                  />
                  <label className="modul-inline-check">
                    <input name="hapusLogo" type="checkbox" value="1" /> Hapus logo kop
                  </label>
                </div>
              ) : null}
            </div>

            <div className="modul-form-grid" style={{ marginTop: 14 }}>
              <Field
                label="Lebar logo (%)"
                galat={galat("suratLogoLebar")}
                hint="Persentase terhadap lebar isi surat (5–30%). Bawaan 10% seperti OpenSID."
              >
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratLogoLebar}
                  max={30}
                  min={5}
                  name="suratLogoLebar"
                  type="number"
                />
              </Field>
              <Field label="Posisi logo" galat={galat("suratLogoPosisi")}>
                <select
                  className="form-input"
                  defaultValue={pengaturan.suratLogoPosisi}
                  name="suratLogoPosisi"
                >
                  {POSISI_LOGO_SURAT.map((posisi) => (
                    <option key={posisi} value={posisi}>
                      {LABEL_POSISI_LOGO[posisi]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="modul-inline-check" style={{ marginTop: 14 }}>
              <input
                defaultChecked={pengaturan.suratGarisGanda}
                name="suratGarisGanda"
                type="checkbox"
              />
              Garis ganda di bawah kop surat
            </label>

            <p className="modul-muted" style={{ marginTop: 10 }}>
              Token yang bisa dipakai: {TOKEN_HEADER.map((token) => `[${token}]`).join(", ")}
            </p>
          </fieldset>

          <fieldset
            disabled={!canManage}
            hidden={tab !== "alur"}
            style={{ border: 0, margin: 0, padding: 0 }}
          >
            <div className="modul-form-checks">
              <label>
                <input
                  defaultChecked={pengaturan.suratVerifikasiSekdes}
                  name="suratVerifikasiSekdes"
                  type="checkbox"
                />
                <span>
                  <strong>Sekretaris Desa memverifikasi</strong>
                  <span className="modul-muted">
                    Bila dimatikan, surat langsung menuju Kepala Desa setelah operator.
                  </span>
                </span>
              </label>
              <label>
                <input
                  defaultChecked={pengaturan.suratVerifikasiKades}
                  name="suratVerifikasiKades"
                  type="checkbox"
                />
                <span>
                  <strong>Kepala Desa menandatangani</strong>
                  <span className="modul-muted">
                    Bila dimatikan, surat terbit dan bernomor setelah tahap terakhir yang aktif.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset
            disabled={!canManage}
            hidden={tab !== "luar"}
            style={{ border: 0, margin: 0, padding: 0 }}
          >
            <p className="modul-muted">
              Pilih isian yang diminta ketika surat memakai data penduduk dari luar desa. Nama
              selalu diminta.
            </p>
            <div className="modul-form-checks">
              {FIELD_PENDUDUK_LUAR.map((field) => (
                <label key={field}>
                  <input
                    defaultChecked={pengaturan.suratPendudukLuarField.includes(field)}
                    name="suratPendudukLuarField"
                    type="checkbox"
                    value={field}
                  />
                  <span>{LABEL_FIELD_PENDUDUK_LUAR[field]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset
            disabled={!canManage}
            hidden={tab !== "lainnya"}
            style={{ border: 0, margin: 0, padding: 0 }}
          >
            <div className="modul-form-grid">
              <Field
                label="Teks isian kosong"
                galat={galat("suratGantiDataKosong")}
                hint="Pengganti kode isian yang tidak terisi, mis. “-”."
              >
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratGantiDataKosong}
                  maxLength={20}
                  name="suratGantiDataKosong"
                />
              </Field>
              <Field label="Format tanggal surat" galat={galat("suratFormatTanggal")}>
                <select
                  className="form-input"
                  defaultValue={pengaturan.suratFormatTanggal}
                  name="suratFormatTanggal"
                >
                  {FORMAT_TANGGAL_SURAT.map((format) => (
                    <option key={format} value={format}>
                      {LABEL_FORMAT_TANGGAL[format]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Panjang nomor urut"
                galat={galat("suratPanjangNomor")}
                hint="Jumlah digit dengan nol di depan. Isi 0 untuk 3 digit bawaan."
              >
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratPanjangNomor}
                  max={10}
                  min={0}
                  name="suratPanjangNomor"
                  type="number"
                />
              </Field>
            </div>

            <h3 className="beranda-card-title" style={{ marginTop: 18 }}>
              Margin kertas global
            </h3>
            <p className="modul-muted">
              Dipakai jenis surat yang tidak mengatur margin sendiri (satuan cm).
            </p>
            <div className="modul-form-grid">
              <Field label="Kiri" galat={galat("suratMarginKiri")}>
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratMarginKiri}
                  max={10}
                  min={0}
                  name="suratMarginKiri"
                  step="0.1"
                  type="number"
                />
              </Field>
              <Field label="Atas" galat={galat("suratMarginAtas")}>
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratMarginAtas}
                  max={10}
                  min={0}
                  name="suratMarginAtas"
                  step="0.1"
                  type="number"
                />
              </Field>
              <Field label="Kanan" galat={galat("suratMarginKanan")}>
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratMarginKanan}
                  max={10}
                  min={0}
                  name="suratMarginKanan"
                  step="0.1"
                  type="number"
                />
              </Field>
              <Field label="Bawah" galat={galat("suratMarginBawah")}>
                <input
                  className="form-input"
                  defaultValue={pengaturan.suratMarginBawah}
                  max={10}
                  min={0}
                  name="suratMarginBawah"
                  step="0.1"
                  type="number"
                />
              </Field>
            </div>
          </fieldset>

          <div className="penduduk-heading-actions">
            <ButtonLink variant="secondary" href="/layanan-surat/persuratan/jenis-surat">
              Kembali
            </ButtonLink>
            <Button variant="primary" disabled={!canManage || pending} type="submit">
              {pending ? "Menyimpan…" : "Simpan Pengaturan"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
