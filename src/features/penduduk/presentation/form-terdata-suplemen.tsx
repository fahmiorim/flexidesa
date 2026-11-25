"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import type { SuplemenFormField } from "@/features/penduduk/domain/suplemen";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

export interface SasaranTerdataDetail {
  sasaran: number;
  nomorKk: string | null;
  nik: string | null;
  nama: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  pendidikan: string | null;
  warganegara: string | null;
  agama: string | null;
}

/** Umur dalam tahun dari tanggal ISO (null bila tanggal tidak tersedia). */
function hitungUmur(tanggal: string | null): number | null {
  if (!tanggal) return null;
  const lahir = new Date(`${tanggal.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(lahir.getTime())) return null;
  const sekarang = new Date();
  let umur = sekarang.getFullYear() - lahir.getFullYear();
  const bulan = sekarang.getMonth() - lahir.getMonth();
  if (bulan < 0 || (bulan === 0 && sekarang.getDate() < lahir.getDate())) umur -= 1;
  return umur >= 0 ? umur : null;
}

function nilaiTampil(nilai: string | null): string {
  return nilai && nilai.trim() !== "" ? nilai : "—";
}

/** Isian dinamis mengikuti tipe kolom yang didefinisikan pada suplemen. */
function KolomIsian({
  field,
  referensi,
  nilaiAwal,
}: {
  field: SuplemenFormField;
  referensi: Record<string, string[]>;
  nilaiAwal: string;
}) {
  const nama = field.label;
  const opsi =
    field.tipe === "select-manual"
      ? (field.pilihanKode ?? [])
      : (referensi[field.referensiKode ?? ""] ?? []);
  const lebar = field.kolom ? `col-${field.kolom}` : undefined;

  return (
    <label className={`form-field ${lebar ?? ""}`}>
      <span className="form-label">
        {nama}
        {field.required ? <em className="suplemen-wajib"> *</em> : null}
      </span>
      {field.tipe === "textarea" ? (
        <textarea
          defaultValue={nilaiAwal}
          name="isianNilai"
          placeholder={field.deskripsiKode || undefined}
          required={field.required}
          rows={3}
        />
      ) : field.tipe === "select-manual" || field.tipe === "select-otomatis" ? (
        <select defaultValue={nilaiAwal} name="isianNilai" required={field.required}>
          <option value="">-- {field.deskripsiKode || "Pilih"} --</option>
          {opsi.map((pilihan) => (
            <option key={pilihan} value={pilihan}>
              {pilihan}
            </option>
          ))}
        </select>
      ) : (
        <input
          defaultValue={nilaiAwal}
          name="isianNilai"
          placeholder={field.deskripsiKode || undefined}
          required={field.required}
          type={field.tipe === "date" ? "date" : field.tipe === "time" ? "time" : field.tipe}
        />
      )}
      <input name="isianNama" type="hidden" value={nama} />
    </label>
  );
}

/**
 * Form tambah/ubah data terdata suplemen.
 *
 * Paritas `form_terdata` OpenSID: identitas sasaran ditampilkan sebagai blok
 * konfirmasi (tidak dapat disunting), lalu kolom isian dinamis suplemen dan
 * keterangan. Mode "beberapa data warga" kembali ke form kosong setelah simpan.
 */
export function FormTerdataSuplemen({
  aksi,
  suplemenId,
  sasaran,
  sasaranId,
  terdataId,
  sasaranDetail,
  fields,
  referensi,
  isianAwal,
  keteranganAwal,
  kembaliHref,
  lanjutHref,
}: {
  aksi: (state: ActionState<null>, formData: FormData) => Promise<ActionState<null>>;
  suplemenId: number;
  sasaran: number;
  sasaranId: number;
  terdataId?: number;
  sasaranDetail: SasaranTerdataDetail | null;
  fields: SuplemenFormField[];
  referensi: Record<string, string[]>;
  isianAwal: Record<string, string>;
  keteranganAwal: string;
  kembaliHref: string;
  /** Tujuan setelah simpan untuk mode "tambah beberapa data warga". */
  lanjutHref?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(aksi, createIdleActionState<null>());

  useEffect(() => {
    if (state.status !== "success") return;
    router.push(lanjutHref ?? kembaliHref);
    router.refresh();
  }, [state.status, router, lanjutHref, kembaliHref]);

  const umur = hitungUmur(sasaranDetail?.tanggalLahir ?? null);
  const sasaranPenduduk = sasaran !== 2;

  return (
    <form action={formAction} className="form-stack suplemen-form">
      <input name="suplemenId" type="hidden" value={suplemenId} />
      <input name="sasaranId" type="hidden" value={sasaranId} />
      <input name="sasaran" type="hidden" value={sasaran} />
      {terdataId ? <input name="terdataId" type="hidden" value={terdataId} /> : null}

      <fieldset className="suplemen-fieldset">
        <legend>{sasaranPenduduk ? "Warga Terdata" : "Keluarga Terdata"}</legend>
        <dl className="suplemen-konfirmasi">
          <div>
            <dt>{sasaranPenduduk ? "NIK" : "No. KK"}</dt>
            <dd>
              {nilaiTampil(
                sasaranPenduduk ? (sasaranDetail?.nik ?? null) : (sasaranDetail?.nomorKk ?? null),
              )}
            </dd>
          </div>
          <div>
            <dt>{sasaranPenduduk ? "Nama Penduduk" : "Kepala Keluarga"}</dt>
            <dd>{nilaiTampil(sasaranDetail?.nama ?? null)}</dd>
          </div>
          <div>
            <dt>Tempat / Tanggal Lahir</dt>
            <dd>
              {nilaiTampil(sasaranDetail?.tempatLahir ?? null)},{" "}
              {nilaiTampil(sasaranDetail?.tanggalLahir ?? null)}
            </dd>
          </div>
          <div>
            <dt>Umur</dt>
            <dd>{umur === null ? "—" : `${umur} Tahun`}</dd>
          </div>
          <div className="suplemen-konfirmasi-lebar">
            <dt>Alamat</dt>
            <dd>{nilaiTampil(sasaranDetail?.alamat ?? null)}</dd>
          </div>
          <div>
            <dt>Pendidikan</dt>
            <dd>{nilaiTampil(sasaranDetail?.pendidikan ?? null)}</dd>
          </div>
          <div>
            <dt>Warga Negara / Agama</dt>
            <dd>
              {nilaiTampil(sasaranDetail?.warganegara ?? null)} /{" "}
              {nilaiTampil(sasaranDetail?.agama ?? null)}
            </dd>
          </div>
        </dl>
      </fieldset>

      {fields.length > 0 ? (
        <fieldset className="suplemen-fieldset">
          <legend>Data Form Isian</legend>
          <div className="suplemen-isian-grid">
            {fields.map((field) => (
              <KolomIsian
                field={field}
                key={field.label}
                nilaiAwal={isianAwal[field.label] ?? ""}
                referensi={referensi}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="form-field">
        <span className="form-label">Keterangan</span>
        <textarea
          defaultValue={keteranganAwal}
          maxLength={100}
          name="keterangan"
          placeholder="Keterangan"
          rows={3}
        />
        <small>Maksimal 100 karakter.</small>
      </label>

      <PesanDialog state={state} />

      <div className="suplemen-form-actions">
        <Link className="button button-secondary" href={kembaliHref}>
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
