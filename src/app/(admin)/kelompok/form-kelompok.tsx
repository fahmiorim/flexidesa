"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  KELOMPOK_TIPE,
  KELOMPOK_TIPE_LABELS,
  type KelompokFormInput,
} from "@/features/kelompok/domain/kelompok";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";
import type { LabelOption } from "@/lib/forms";

export type AksiFormKelompok = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

export function FormKelompok({
  aksi,
  awal,
  kategori,
  penduduk,
  kembaliHref,
}: {
  aksi: AksiFormKelompok;
  awal?: KelompokFormInput;
  kategori: LabelOption[];
  penduduk: LabelOption[];
  kembaliHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const galat = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;
  const tipeAwal = awal?.tipe ?? "kelompok";

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />

      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Nama Kelompok / Lembaga</span>
          <input
            className="form-input"
            defaultValue={awal?.nama ?? ""}
            maxLength={150}
            name="nama"
            placeholder="Nama kelompok atau lembaga"
            required
          />
          <GalatField pesan={galat("nama")} />
        </label>

        <label className="form-field">
          <span className="form-label">Tipe</span>
          <select className="form-input" defaultValue={tipeAwal} name="tipe">
            {KELOMPOK_TIPE.map((tipe) => (
              <option key={tipe} value={tipe}>
                {KELOMPOK_TIPE_LABELS[tipe]}
              </option>
            ))}
          </select>
          <span className="form-help">Kelompok masyarakat atau lembaga desa.</span>
          <GalatField pesan={galat("tipe")} />
        </label>

        <label className="form-field">
          <span className="form-label">Kode Kelompok / Lembaga</span>
          <input
            className="form-input"
            defaultValue={awal?.kode ?? ""}
            maxLength={50}
            name="kode"
            placeholder="Kode kelompok atau lembaga"
          />
          <span className="form-help">
            Pastikan kode belum pernah dipakai di data lembaga / di data kelompok.
          </span>
          <GalatField pesan={galat("kode")} />
        </label>

        <label className="form-field">
          <span className="form-label">No. SK Pendirian</span>
          <input
            className="form-input"
            defaultValue={awal?.nomorSk ?? ""}
            maxLength={100}
            name="nomorSk"
            placeholder="Nomor SK pendirian"
          />
          <GalatField pesan={galat("nomorSk")} />
        </label>

        <label className="form-field">
          <span className="form-label">Kategori</span>
          <select
            className="form-input"
            defaultValue={awal?.kategoriId ?? ""}
            name="kategoriId"
            required
          >
            <option value="">— Silakan Masukkan Kategori —</option>
            {kategori.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <GalatField pesan={galat("kategoriId")} />
        </label>

        {awal === undefined ? (
          <label className="form-field">
            <span className="form-label">Ketua Kelompok / Lembaga</span>
            <select className="form-input" defaultValue="" name="ketuaId" required>
              <option value="">— Silakan Masukkan NIK / Nama —</option>
              {penduduk.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="form-help">
              Ketua langsung tercatat sebagai anggota berjabatan Ketua. Ketua dapat diubah lewat
              jabatan anggota pada halaman rincian.
            </span>
            <GalatField pesan={galat("ketua")} />
          </label>
        ) : (
          <p className="form-help">
            Ketua diubah lewat jabatan anggota pada halaman rincian kelompok.
          </p>
        )}

        <label className="form-field">
          <span className="form-label">Deskripsi / Keterangan</span>
          <textarea
            className="form-input"
            defaultValue={awal?.keterangan ?? ""}
            maxLength={500}
            name="keterangan"
            placeholder="Deskripsi kelompok atau lembaga"
            rows={3}
          />
          <GalatField pesan={galat("keterangan")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        <Link className="button button-secondary" href={kembaliHref}>
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : awal === undefined ? "Simpan Kelompok" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
