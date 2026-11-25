"use client";

import { useMemo, useState } from "react";

import type { SyaratSuratDTO } from "@/features/surat/domain/isian";
import {
  DEFAULT_NUMBER_FORMAT,
  HEADER_SURAT,
  MARGIN_SURAT_DEFAULT,
  ORIENTASI_SURAT,
  parseDaftarLampiran,
  SATUAN_MASA_BERLAKU,
  SURAT_PLACEHOLDERS,
  UKURAN_SURAT,
  type JenisSuratDTO,
  type KlasifikasiSuratDTO,
} from "@/features/surat/domain/surat";

import { hapusJenisSuratAction, simpanJenisSuratAction } from "./actions";

/** Baca `layout_config` tersimpan sebagai objek; nilai rusak dianggap kosong. */
function layoutTersimpan(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** Baca margin tersimpan (JSON cm) dengan nilai bawaan OpenSID. */
function marginTersimpan(raw: string | null | undefined) {
  if (!raw) return { ...MARGIN_SURAT_DEFAULT };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return { ...MARGIN_SURAT_DEFAULT };
    const nilai = parsed as Record<string, unknown>;
    const ambil = (kunci: keyof typeof MARGIN_SURAT_DEFAULT) => {
      const isi = Number(nilai[kunci]);
      return Number.isFinite(isi) ? isi : MARGIN_SURAT_DEFAULT[kunci];
    };
    return {
      kiri: ambil("kiri"),
      atas: ambil("atas"),
      kanan: ambil("kanan"),
      bawah: ambil("bawah"),
    };
  } catch {
    return { ...MARGIN_SURAT_DEFAULT };
  }
}

type Props = {
  jenis: JenisSuratDTO | null;
  klasifikasi: KlasifikasiSuratDTO[];
  syarat: SyaratSuratDTO[];
  canDelete?: boolean;
};
const CONTOH = [
  { key: "nomor", label: "Nomor surat" },
  { key: "kode_surat", label: "Kode jenis" },
  { key: "kode_desa", label: "Kode desa" },
  { key: "tahun", label: "Tahun" },
  { key: "bulan_romawi", label: "Bulan Romawi" },
];
export function JenisSuratForm({ jenis, klasifikasi, syarat, canDelete = false }: Props) {
  const [template, setTemplate] = useState(
    jenis?.templateBody ??
      "Yang bertanda tangan di bawah ini, Kepala Desa [nama_desa], menerangkan bahwa:\n\nNama: [nama]\nNIK: [nik]\nAlamat: [alamat]\n\nDemikian surat keterangan ini dibuat untuk [keperluan].",
  );
  const [fields, setFields] = useState(jenis?.formIsian ?? "[]");
  const [selectedSyarat, setSelectedSyarat] = useState<number[]>(() => {
    try {
      const value: unknown = JSON.parse(jenis?.syaratSurat ?? "[]");
      return Array.isArray(value)
        ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0)
        : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState("");
  const margin = marginTersimpan(jenis?.margin);
  const [marginGlobal, setMarginGlobal] = useState(
    layoutTersimpan(jenis?.layoutConfig).marginGlobal !== false,
  );
  const [fieldDraft, setFieldDraft] = useState({
    kode: "",
    label: "",
    tipe: "text",
    required: false,
    opsi: "",
  });
  const parsedFields = useMemo(() => {
    try {
      const value: unknown = JSON.parse(fields);
      return Array.isArray(value)
        ? (value as Array<{
            kode: string;
            label: string;
            tipe: string;
            required: boolean;
            opsi?: string[];
          }>)
        : [];
    } catch {
      return [];
    }
  }, [fields]);
  function insertToken(token: string) {
    setTemplate((current) => current + `[${token}]`);
  }
  function addField() {
    if (!fieldDraft.kode.trim() || !fieldDraft.label.trim()) {
      setError("Kode dan label isian harus diisi.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(fieldDraft.kode)) {
      setError("Kode hanya boleh huruf kecil, angka, dan garis bawah.");
      return;
    }
    if (parsedFields.some((item) => item.kode === fieldDraft.kode)) {
      setError("Kode isian sudah ada.");
      return;
    }
    const next = [
      ...parsedFields,
      {
        kode: fieldDraft.kode,
        label: fieldDraft.label,
        tipe: fieldDraft.tipe,
        required: fieldDraft.required,
        opsi:
          fieldDraft.tipe === "select"
            ? fieldDraft.opsi
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
      },
    ];
    setFields(JSON.stringify(next, null, 2));
    setFieldDraft({ kode: "", label: "", tipe: "text", required: false, opsi: "" });
    setError("");
  }
  return (
    <form
      action={simpanJenisSuratAction}
      className="modul-form"
      onSubmit={(event) => {
        const parsed = (() => {
          try {
            return JSON.parse(fields);
          } catch {
            return null;
          }
        })();
        if (!Array.isArray(parsed)) {
          event.preventDefault();
          setError("Format isian dinamis harus berupa JSON array yang valid.");
        }
      }}
    >
      {jenis ? <input type="hidden" name="id" value={jenis.id} /> : null}
      <div className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Identitas jenis surat</h2>
            <p className="modul-muted">Kode, klasifikasi, dan pengaturan dasar.</p>
          </div>
        </div>
        <div className="modul-form-grid">
          <label>
            Kode surat
            <input
              name="code"
              required
              maxLength={30}
              defaultValue={jenis?.code ?? ""}
              placeholder="SKTM"
            />
          </label>
          <label>
            Nama jenis surat
            <input
              name="name"
              required
              maxLength={150}
              defaultValue={jenis?.name ?? ""}
              placeholder="Surat Keterangan Tidak Mampu"
            />
          </label>
          <label>
            Klasifikasi
            <select name="classificationId" defaultValue={jenis?.classificationId ?? "none"}>
              <option value="none">Tanpa klasifikasi</option>
              {klasifikasi.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Urutan tampil
            <input
              name="sortOrder"
              type="number"
              min="0"
              max="9999"
              defaultValue={jenis?.sortOrder ?? 0}
            />
          </label>
          <label>
            Masa berlaku default (0 = tidak dibatasi)
            <input
              name="validityMonths"
              type="number"
              min="0"
              max="31"
              defaultValue={jenis?.validityMonths ?? 1}
            />
          </label>
          <label>
            Satuan masa berlaku
            <select name="satuanMasaBerlaku" defaultValue={jenis?.satuanMasaBerlaku ?? "M"}>
              {SATUAN_MASA_BERLAKU.map((item) => (
                <option key={item.nilai} value={item.nilai}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Varian template
            <input
              name="templateVariant"
              maxLength={50}
              defaultValue={jenis?.templateVariant ?? "default"}
            />
          </label>
        </div>
        <div className="modul-form-checks">
          <label>
            <input
              type="checkbox"
              name="requiresResident"
              defaultChecked={jenis?.requiresResident ?? true}
            />{" "}
            Wajib memilih penduduk
          </label>
          <label>
            <input type="checkbox" name="isActive" defaultChecked={jenis?.isActive ?? true} /> Aktif
            digunakan
          </label>
          <label>
            <input
              type="checkbox"
              name="sumberPendudukBerulang"
              defaultChecked={jenis?.sumberPendudukBerulang ?? false}
            />{" "}
            Butuh data penduduk lain
          </label>
          <label>
            <input type="checkbox" name="mandiri" defaultChecked={jenis?.mandiri ?? true} />{" "}
            Sediakan di layanan mandiri
          </label>
        </div>
      </div>
      <div className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Editor template surat</h2>
            <p className="modul-muted">
              Gunakan placeholder dalam tanda kurung siku. Nilainya akan diisi otomatis saat surat
              dibuat.
            </p>
          </div>
          <span className="beranda-chip" data-tone="ungu">
            Template utama
          </span>
        </div>
        <div className="template-token-groups">
          <strong>Data otomatis</strong>
          <div className="template-token-list">
            {SURAT_PLACEHOLDERS.map((item) => (
              <button
                type="button"
                key={item.key}
                className="template-token"
                onClick={() => insertToken(item.key)}
                title={item.label}
              >
                [{item.key}]
              </button>
            ))}
          </div>
          <strong>Penomoran</strong>
          <div className="template-token-list">
            {CONTOH.map((item) => (
              <button
                type="button"
                key={item.key}
                className="template-token"
                onClick={() => insertToken(item.key)}
                title={item.label}
              >
                [{item.key}]
              </button>
            ))}
          </div>
        </div>
        <label className="template-editor-label">
          Isi template
          <textarea
            name="templateBody"
            required
            maxLength={20000}
            rows={15}
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            spellCheck={false}
          />
        </label>
        <label className="template-editor-label">
          Template alternatif (opsional)
          <textarea
            name="templateBodyAlt"
            maxLength={20000}
            rows={5}
            defaultValue={jenis?.templateBodyAlt ?? ""}
          />
        </label>
      </div>
      <div className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Tampilan cetak</h2>
            <p className="modul-muted">
              Orientasi, ukuran kertas, margin, header/footer, QR, dan logo pada surat hasil cetak.
            </p>
          </div>
        </div>
        <div className="modul-form-grid">
          <label>
            Orientasi kertas
            <select name="orientasi" defaultValue={jenis?.orientasi ?? "potrait"}>
              {ORIENTASI_SURAT.map((item) => (
                <option key={item.nilai} value={item.nilai}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ukuran kertas
            <select name="ukuran" defaultValue={jenis?.ukuran ?? "F4"}>
              {UKURAN_SURAT.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tampilkan header
            <select name="header" defaultValue={String(jenis?.header ?? 1)}>
              {HEADER_SURAT.map((item) => (
                <option key={item.nilai} value={item.nilai}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modul-form-checks">
          <label>
            <input
              defaultChecked={(jenis?.footer ?? 1) === 1}
              name="footer"
              type="checkbox"
              value="1"
            />{" "}
            Tampilkan footer halaman
          </label>
          <label>
            <input defaultChecked={jenis?.logoGaruda ?? false} name="logoGaruda" type="checkbox" />{" "}
            Logo burung garuda
          </label>
          <label>
            <input defaultChecked={jenis?.qrCode ?? false} name="qrCode" type="checkbox" />{" "}
            Tampilkan QR code
          </label>
          <label>
            <input defaultChecked={jenis?.qrCodeTte ?? false} name="qrCodeTte" type="checkbox" /> QR
            code TTE
          </label>
          <label>
            <input defaultChecked={jenis?.kecamatan ?? false} name="kecamatan" type="checkbox" />{" "}
            Kirim ke kecamatan
          </label>
        </div>
        <label className="modul-inline-check">
          <input
            checked={marginGlobal}
            name="marginGlobal"
            onChange={(event) => setMarginGlobal(event.target.checked)}
            type="checkbox"
            value="1"
          />{" "}
          Gunakan margin kertas global
        </label>
        <div className="modul-form-grid">
          {(
            [
              { kunci: "kiri", label: "Margin kiri" },
              { kunci: "atas", label: "Margin atas" },
              { kunci: "kanan", label: "Margin kanan" },
              { kunci: "bawah", label: "Margin bawah" },
            ] as const
          ).map((item) => (
            <label key={item.kunci}>
              {item.label} (cm)
              <input
                defaultValue={margin[item.kunci]}
                max="10"
                min="0"
                name={`margin${item.kunci.charAt(0).toUpperCase()}${item.kunci.slice(1)}`}
                readOnly={marginGlobal}
                step="0.1"
                type="number"
              />
            </label>
          ))}
        </div>
        <p className="modul-muted">
          Margin kiri {margin.kiri} cm, atas {margin.atas} cm, kanan {margin.kanan} cm, bawah{" "}
          {margin.bawah} cm. Isian margin diabaikan bila margin global dipakai.
        </p>
      </div>
      <div className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Formulir isian dinamis</h2>
            <p className="modul-muted">
              Tambahkan data khusus yang perlu diisi petugas untuk jenis surat ini.
            </p>
          </div>
        </div>
        <div className="modul-form-grid">
          <label>
            Kode isian
            <input
              value={fieldDraft.kode}
              onChange={(e) => setFieldDraft((v) => ({ ...v, kode: e.target.value }))}
              placeholder="nama_usaha"
            />
          </label>
          <label>
            Label pada formulir
            <input
              value={fieldDraft.label}
              onChange={(e) => setFieldDraft((v) => ({ ...v, label: e.target.value }))}
              placeholder="Nama usaha"
            />
          </label>
          <label>
            Tipe isian
            <select
              value={fieldDraft.tipe}
              onChange={(e) => setFieldDraft((v) => ({ ...v, tipe: e.target.value }))}
            >
              <option value="text">Teks pendek</option>
              <option value="textarea">Teks panjang</option>
              <option value="number">Angka</option>
              <option value="date">Tanggal</option>
              <option value="select">Pilihan</option>
              <option value="checkbox">Centang</option>
            </select>
          </label>
          <label className="modul-inline-check">
            <input
              type="checkbox"
              checked={fieldDraft.required}
              onChange={(e) => setFieldDraft((v) => ({ ...v, required: e.target.checked }))}
            />{" "}
            Wajib diisi
          </label>
        </div>
        {fieldDraft.tipe === "select" ? (
          <label>
            Opsi pilihan (satu per baris)
            <textarea
              rows={3}
              value={fieldDraft.opsi}
              onChange={(e) => setFieldDraft((v) => ({ ...v, opsi: e.target.value }))}
            />
          </label>
        ) : null}
        <button type="button" className="button button-secondary" onClick={addField}>
          ＋ Tambahkan isian
        </button>
        <div className="template-field-list">
          {parsedFields.map((item) => (
            <div className="template-field-row" key={item.kode}>
              <span>
                <strong>{item.label}</strong>
                <small>
                  [{item.kode}] · {item.tipe}
                  {item.required ? " · wajib" : ""}
                </small>
              </span>
              <button
                type="button"
                className="button button-ghost"
                onClick={() =>
                  setFields(
                    JSON.stringify(
                      parsedFields.filter((field) => field.kode !== item.kode),
                      null,
                      2,
                    ),
                  )
                }
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
        <details>
          <summary>Pengaturan lanjutan JSON</summary>
          <textarea
            value={fields}
            onChange={(event) => setFields(event.target.value)}
            rows={6}
            spellCheck={false}
          />
        </details>
        <input type="hidden" name="formIsian" value={fields} />
      </div>
      <div className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Persyaratan & penomoran</h2>
            <p className="modul-muted">
              Persyaratan ini menjadi acuan pemeriksaan sebelum verifikasi.
            </p>
          </div>
        </div>
        <div className="template-requirements">
          {syarat.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                name="syaratSurat"
                value={item.id}
                checked={selectedSyarat.includes(item.id)}
                onChange={(event) =>
                  setSelectedSyarat((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id),
                  )
                }
              />
              <span>
                <strong>{item.name}</strong>
                <small>{item.description ?? "Persyaratan dokumen"}</small>
              </span>
            </label>
          ))}
        </div>
        <label>
          Lampiran surat (satu per baris)
          <textarea
            defaultValue={parseDaftarLampiran(jenis?.lampiran).join("\n")}
            maxLength={2000}
            name="lampiran"
            placeholder={"Fotokopi KTP\nFotokopi Kartu Keluarga"}
            rows={3}
          />
        </label>
        <p className="modul-muted">
          Nama lampiran ini tercetak pada surat melalui token [lampiran] dan tampil sebagai kolom
          Lampiran di daftar surat.
        </p>
        <label className="modul-inline-check">
          <input
            type="checkbox"
            name="formatNomorGlobal"
            value="1"
            defaultChecked={jenis?.formatNomorGlobal === 1}
          />{" "}
          Gunakan format penomoran desa
        </label>
        <label>
          Format nomor surat
          <input
            name="numberFormat"
            maxLength={100}
            defaultValue={jenis?.numberFormat ?? DEFAULT_NUMBER_FORMAT}
          />
        </label>
        <p className="modul-muted">
          Token: [kode_surat], [nomor], [kode_desa], [tahun], [bulan_romawi].
        </p>
      </div>
      {error ? (
        <p role="alert" className="modul-error">
          {error}
        </p>
      ) : null}
      <div className="page-actions">
        <a href="/persuratan/jenis-surat" className="button button-secondary">
          Kembali
        </a>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {jenis && canDelete ? (
            <button
              className="button button-danger-ghost"
              type="submit"
              formAction={hapusJenisSuratAction}
              formNoValidate
              onClick={(event) => {
                if (
                  !window.confirm(
                    "Hapus jenis surat ini? Penghapusan hanya berhasil jika belum pernah dipakai surat.",
                  )
                )
                  event.preventDefault();
              }}
            >
              Hapus jenis surat
            </button>
          ) : null}
          <button className="button button-primary" type="submit">
            Simpan jenis surat
          </button>
        </div>
      </div>
    </form>
  );
}
