"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { ubahStatusDasarAction } from "@/app/(admin)/mutasi-penduduk/actions";
import { GalatField, PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { LIFE_STATUS_LABELS, type LifeStatus } from "@/features/penduduk/domain/penduduk";
import {
  PENOLONG_KEMATIAN,
  PENOLONG_KEMATIAN_LABELS,
  SEBAB_KEMATIAN,
  SEBAB_KEMATIAN_LABELS,
  TUJUAN_PINDAH,
  TUJUAN_PINDAH_LABELS,
} from "@/features/penduduk/domain/riwayat-penduduk";
import { createIdleActionState, toErrorState, type ActionState } from "@/lib/action-state";

const inputClass = "form-input";

export function FormMutasiPenduduk({
  residentId,
  opsi,
  kepalaKeluargaBanyak,
}: {
  residentId: number;
  opsi: LifeStatus[];
  kepalaKeluargaBanyak: boolean;
}) {
  const aksi = ubahStatusDasarAction.bind(null, residentId);
  // Action mutasi memakai kontrak `(formData) => void` dan mengalihkan halaman
  // saat berhasil; pembungkus ini mempertahankan state error per-field.
  const [state, formAction, pending] = useActionState(
    async (_sebelumnya: ActionState<null>, form: FormData): Promise<ActionState<null>> => {
      try {
        await aksi(form);
        return createIdleActionState();
      } catch (error) {
        return toErrorState(error);
      }
    },
    createIdleActionState(),
  );
  const [status, setStatus] = useState("");
  const galat = (field: string) =>
    state.status === "error" ? state.fieldErrors?.[field]?.[0] : undefined;

  const hariIni = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="form-stack">
      <PesanDialog state={state} />

      {kepalaKeluargaBanyak ? (
        <div className="alert alert-warning" role="note">
          <strong>Catatan!</strong>
          <ul>
            <li>
              Jika kepala keluarga meninggal, harap melakukan pemecahan Kartu Keluarga (KK) terlebih
              dahulu — karena itu status <strong>Mati</strong> tidak ditawarkan.
            </li>
            <li>
              Jika terdapat keterangan lain terkait perubahan status dasar, harap diisi pada kolom
              catatan peristiwa.
            </li>
          </ul>
        </div>
      ) : (
        <div className="alert alert-warning" role="note">
          <strong>Catatan!</strong>
          <ul>
            <li>
              Jika terdapat keterangan lain terkait perubahan status dasar, harap diisi pada kolom
              catatan peristiwa.
            </li>
          </ul>
        </div>
      )}

      <div className="modul-form-grid">
        <label className="form-field">
          <span className="form-label">Status Dasar Baru</span>
          <select
            className={inputClass}
            defaultValue=""
            name="lifeStatus"
            onChange={(event) => setStatus(event.target.value)}
            required
          >
            <option value="" disabled>
              Pilih Status Dasar
            </option>
            {opsi.map((value) => (
              <option key={value} value={value}>
                {LIFE_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <GalatField pesan={galat("lifeStatus")} />
        </label>

        {status === "deceased" ? (
          <>
            <label className="form-field">
              <span className="form-label">Tempat Meninggal</span>
              <input className={inputClass} maxLength={50} name="tempatMeninggal" required />
              <GalatField pesan={galat("tempatMeninggal")} />
            </label>
            <label className="form-field">
              <span className="form-label">Jam Kematian</span>
              <input
                className={inputClass}
                maxLength={50}
                name="jamKematian"
                placeholder="cth. 14.00"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Penyebab Kematian</span>
              <select className={inputClass} defaultValue="" name="sebab" required>
                <option value="" disabled>
                  Pilih Penyebab Kematian
                </option>
                {SEBAB_KEMATIAN.map((value) => (
                  <option key={value} value={value}>
                    {SEBAB_KEMATIAN_LABELS[value]}
                  </option>
                ))}
              </select>
              <GalatField pesan={galat("sebab")} />
            </label>
            <label className="form-field">
              <span className="form-label">Yang Menerangkan Kematian</span>
              <select className={inputClass} defaultValue="" name="penolong" required>
                <option value="" disabled>
                  Pilih Yang Menerangkan Kematian
                </option>
                {PENOLONG_KEMATIAN.map((value) => (
                  <option key={value} value={value}>
                    {PENOLONG_KEMATIAN_LABELS[value]}
                  </option>
                ))}
              </select>
              <GalatField pesan={galat("penolong")} />
            </label>
            <label className="form-field">
              <span className="form-label">Anak Ke-</span>
              <input className={inputClass} min={1} name="anakKe" required type="number" />
              <GalatField pesan={galat("anakKe")} />
            </label>
            <label className="form-field">
              <span className="form-label">Nomor Akta Kematian</span>
              <input className={inputClass} maxLength={50} name="nomorAkta" />
            </label>
          </>
        ) : null}

        {status === "moved" ? (
          <>
            <label className="form-field">
              <span className="form-label">Tujuan Pindah</span>
              <select className={inputClass} defaultValue="" name="refPindah" required>
                <option value="" disabled>
                  Pilih Tujuan Pindah
                </option>
                {TUJUAN_PINDAH.map((value) => (
                  <option key={value} value={value}>
                    {TUJUAN_PINDAH_LABELS[value]}
                  </option>
                ))}
              </select>
              <GalatField pesan={galat("refPindah")} />
            </label>
            <label className="form-field">
              <span className="form-label">Alamat Tujuan</span>
              <textarea
                className={inputClass}
                name="alamatTujuan"
                placeholder="Alamat Tujuan"
                required
                rows={3}
              />
              <GalatField pesan={galat("alamatTujuan")} />
            </label>
          </>
        ) : null}

        <label className="form-field">
          <span className="form-label">Tanggal Peristiwa</span>
          <input
            className={inputClass}
            defaultValue={hariIni}
            max={hariIni}
            name="eventDate"
            required
            type="date"
          />
          <GalatField pesan={galat("eventDate")} />
        </label>
        <label className="form-field">
          <span className="form-label">Tanggal Lapor</span>
          <input
            className={inputClass}
            defaultValue={hariIni}
            name="reportDate"
            required
            type="date"
          />
          <GalatField pesan={galat("reportDate")} />
        </label>
        <label className="form-field">
          <span className="form-label">Catatan Peristiwa</span>
          <textarea className={inputClass} name="notes" placeholder="Catatan" rows={5} />
          <GalatField pesan={galat("notes")} />
        </label>
      </div>

      <div className="penduduk-heading-actions">
        <Link className="button button-secondary" href={`/penduduk/${residentId}`}>
          Batal
        </Link>
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
