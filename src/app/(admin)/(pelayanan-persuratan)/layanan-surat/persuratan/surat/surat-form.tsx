"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldShell, FormField } from "@/components/ui/form-field";
import type { IsianField } from "@/features/pelayanan-persuratan/surat/domain/isian";
import { LABEL_FIELD_PENDUDUK_LUAR } from "@/features/pelayanan-persuratan/surat/domain/pengaturan-surat";
import type { PendudukLuarSurat } from "@/features/pelayanan-persuratan/surat/domain/pengikut";
import type { FieldPendudukLuar } from "@/features/pengaturan/pengaturan/domain/pengaturan";

const LABEL_ISIAN_LUAR: Record<FieldPendudukLuar, string> = LABEL_FIELD_PENDUDUK_LUAR;

/** Baris kosong untuk penduduk dari luar desa. */
function barisLuarKosong(): PendudukLuarSurat {
  return {
    nama: "",
    nik: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    pekerjaan: "",
    alamat: "",
    keterangan: "",
  };
}

interface JenisOption {
  id: number;
  name: string;
  code: string;
  requiresResident: boolean;
  fields: IsianField[];
}

interface PendudukOption {
  id: number;
  name: string;
  nationalId: string | null;
}

export function SuratForm({
  jenis,
  penduduk,
  tanggalDefault,
  jenisDefaultId,
  initial,
  action,
  fieldPendudukLuar,
}: {
  jenis: JenisOption[];
  penduduk: PendudukOption[];
  tanggalDefault: string;
  /** Jenis surat yang langsung dipilih, mis. dari tautan katalog Cetak Surat. */
  jenisDefaultId?: number;
  initial?: {
    id?: number;
    typeId: number;
    residentId: number | null;
    letterDate: string;
    purpose: string | null;
    isiSurat: Record<string, string>;
    pengikut: number[];
    luar: PendudukLuarSurat[];
  };
  action: (formData: FormData) => void | Promise<void>;
  /** Isian penduduk luar yang diaktifkan pada Pengaturan Surat. */
  fieldPendudukLuar: readonly FieldPendudukLuar[];
}) {
  const [typeId, setTypeId] = useState(
    initial?.typeId.toString() ?? jenisDefaultId?.toString() ?? jenis[0]?.id.toString() ?? "",
  );
  const [luar, setLuar] = useState<PendudukLuarSurat[]>(initial?.luar ?? []);
  const selected = jenis.find((item) => item.id.toString() === typeId) ?? null;

  const ubahLuar = (index: number, field: keyof PendudukLuarSurat, nilai: string) => {
    setLuar((sebelum) =>
      sebelum.map((baris, i) => (i === index ? { ...baris, [field]: nilai } : baris)),
    );
  };

  return (
    <form action={action} className="modul-card form-card-stack">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {initial?.pengikut.map((residentId) => (
        <input key={residentId} type="hidden" name="pengikut" value={residentId} />
      ))}
      {luar.map((item, index) => (
        <input key={index} type="hidden" name="luar" value={JSON.stringify(item)} />
      ))}
      <div>
        <h2 className="beranda-card-title">Informasi Surat</h2>
        <p className="modul-muted">
          Pilih jenis surat dan lengkapi data penerbitan. Nomor surat akan dibuat saat seluruh tahap
          verifikasi disetujui.
        </p>
      </div>

      <div className="modul-form-grid">
        <FormField
          label="Jenis surat *"
          kind="select"
          name="typeId"
          required
          value={typeId}
          onChange={(event) => setTypeId(event.target.value)}
          options={jenis.map((item) => ({
            value: String(item.id),
            label: `${item.name} (${item.code})`,
          }))}
        />
        <FormField
          label="Penduduk / pemohon"
          kind="select"
          name="residentId"
          required={selected?.requiresResident ?? false}
          defaultValue={initial?.residentId?.toString() ?? "none"}
          options={[
            {
              value: "none",
              label: selected?.requiresResident
                ? "Pilih penduduk (wajib)"
                : "Tanpa penduduk terkait",
              disabled: selected?.requiresResident ?? false,
            },
            ...penduduk.map((item) => ({
              value: String(item.id),
              label: `${item.name} · ${item.nationalId}`,
            })),
          ]}
        />
        <FormField
          label="Tanggal surat *"
          name="letterDate"
          type="date"
          required
          defaultValue={initial?.letterDate ?? tanggalDefault}
        />
        <FormField
          label="Keperluan"
          name="purpose"
          maxLength={255}
          defaultValue={initial?.purpose ?? ""}
          placeholder="Contoh: Persyaratan administrasi"
        />
      </div>

      {selected && selected.fields.length > 0 ? (
        <section
          style={{
            display: "grid",
            gap: 14,
            paddingTop: 18,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div>
            <h2 className="beranda-card-title">Isian Tambahan</h2>
            <p className="modul-muted">Isian ini mengikuti format jenis surat yang dipilih.</p>
          </div>
          <div className="modul-form-grid">
            {selected.fields.map((field) => {
              const fieldName = `isian.${field.kode}`;
              const fieldLabel = `${field.label}${field.required ? " *" : ""}`;
              if (field.tipe === "checkbox") {
                return (
                  <FieldShell key={field.kode} label={fieldLabel} id={fieldName}>
                    <span className="form-check-inline">
                      <input type="hidden" name={fieldName} value="" />
                      <input
                        id={fieldName}
                        type="checkbox"
                        name={fieldName}
                        value="true"
                        required={field.required}
                        defaultChecked={
                          initial?.isiSurat[field.kode] === "Ya" ||
                          initial?.isiSurat[field.kode] === "true"
                        }
                      />
                      <span className="modul-muted">
                        {field.placeholder ?? "Centang jika sesuai"}
                      </span>
                    </span>
                  </FieldShell>
                );
              }
              if (field.tipe === "textarea") {
                return (
                  <FormField
                    key={field.kode}
                    label={fieldLabel}
                    kind="textarea"
                    name={fieldName}
                    required={field.required}
                    rows={3}
                    maxLength={4000}
                    placeholder={field.placeholder ?? ""}
                    defaultValue={initial?.isiSurat[field.kode] ?? ""}
                    containerClassName="form-field-full"
                  />
                );
              }
              if (field.tipe === "select") {
                return (
                  <FormField
                    key={field.kode}
                    label={fieldLabel}
                    kind="select"
                    name={fieldName}
                    required={field.required}
                    defaultValue={initial?.isiSurat[field.kode] ?? ""}
                    options={[
                      { value: "", label: `Pilih ${field.label.toLowerCase()}` },
                      ...field.opsi.map((option) => ({ value: option, label: option })),
                    ]}
                  />
                );
              }
              return (
                <FormField
                  key={field.kode}
                  label={fieldLabel}
                  name={fieldName}
                  required={field.required}
                  maxLength={field.tipe === "text" ? 255 : undefined}
                  placeholder={field.placeholder ?? ""}
                  defaultValue={initial?.isiSurat[field.kode] ?? ""}
                  type={field.tipe === "number" || field.tipe === "date" ? field.tipe : "text"}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gap: 12,
          paddingTop: 18,
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div>
          <h2 className="beranda-card-title">Data penduduk dari luar desa</h2>
          <p className="modul-muted">
            Isi bila surat juga memuat data orang yang bukan penduduk desa ini. Isian mengikuti
            pilihan pada Pengaturan Surat.
          </p>
        </div>

        {luar.map((baris, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gap: 12,
              padding: 14,
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              background: "#fbfaff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 12 }}>Orang {index + 1}</strong>
              <Button
                variant="secondary"
                onClick={() => setLuar((sebelum) => sebelum.filter((_, i) => i !== index))}
                type="button"
              >
                Hapus
              </Button>
            </div>
            <div className="modul-form-grid">
              <FormField
                label="Nama *"
                maxLength={100}
                onChange={(event) => ubahLuar(index, "nama", event.target.value)}
                required
                value={baris.nama}
              />
              {fieldPendudukLuar.map((field) => (
                <FormField
                  key={field}
                  label={LABEL_ISIAN_LUAR[field]}
                  maxLength={200}
                  onChange={(event) => ubahLuar(index, field, event.target.value)}
                  type={field === "tanggalLahir" ? "date" : "text"}
                  value={baris[field]}
                />
              ))}
            </div>
          </div>
        ))}

        <div>
          <Button
            variant="secondary"
            onClick={() => setLuar((sebelum) => [...sebelum, barisLuarKosong()])}
            type="button"
          >
            ＋ Tambah penduduk luar
          </Button>
        </div>
      </section>

      <div className="form-actions form-actions-top">
        <ButtonLink variant="secondary" href="/layanan-surat/persuratan/surat">
          Batal
        </ButtonLink>
        <Button variant="primary" type="submit" disabled={jenis.length === 0}>
          {initial ? "Simpan Perubahan" : "Simpan sebagai Konsep"}
        </Button>
      </div>
    </form>
  );
}
