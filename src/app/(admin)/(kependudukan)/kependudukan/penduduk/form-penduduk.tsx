"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type {
  PendudukDTO,
  PendudukReferenceData,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { PesanDialog } from "@/features/multi-desa/presentation/dialog-bagian";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { BagianIdentitas, BagianKelahiran } from "./form-penduduk-biodata";
import { BagianKesehatan, BagianLainnya } from "./form-penduduk-kesehatan";
import {
  BagianAlamatKontak,
  BagianKewarganegaraan,
  BagianOrangTua,
  BagianPendidikan,
  BagianPerkawinan,
} from "./form-penduduk-sosial";

export type AksiFormPenduduk = (
  state: ActionState<{ id: number }>,
  formData: FormData,
) => Promise<ActionState<{ id: number }>>;

interface Props {
  aksi: AksiFormPenduduk;
  references: PendudukReferenceData;
  /** Diisi pada mode ubah; `undefined` pada mode tambah. */
  penduduk?: PendudukDTO;
  familyId?: number | null;
  /** Section tambahan di atas identitas, mis. data KK pada form gabungan. */
  children?: ReactNode;
  /** Sembunyikan pilihan KK/hubungan karena diatur oleh alur gabungan. */
  sembunyikanKeluarga?: boolean;
  /** Awalan tujuan setelah simpan, mis. "/kependudukan/keluarga" atau "/kependudukan/penduduk". */
  redirectPrefix?: string;
  kembaliHref?: string;
  labelSimpan?: string;
  /** Tampilkan tautan kembali di baris aksi bawah, mis. "← Kembali ke Data Penduduk". */
  labelKembali?: string;
}

/**
 * Form tambah dan ubah penduduk.
 *
 * Satu komponen dipakai untuk kedua mode agar aturan field tidak bercabang.
 * Susunan bagian mengikuti kelompok data biodata OpenSID; validasi tetap
 * dijalankan ulang di Server Action, atribut HTML hanya membantu pengguna.
 * Field tiap kelompok berada di berkas bagian tersendiri agar form mudah
 * ditelusuri tanpa memecah satu kelompok field.
 */
export function FormPenduduk({
  aksi,
  references,
  penduduk,
  familyId,
  children,
  sembunyikanKeluarga = false,
  redirectPrefix = "/kependudukan/penduduk",
  kembaliHref,
  labelSimpan,
  labelKembali,
}: Props) {
  const router = useRouter();
  const ubah = penduduk !== undefined;
  const kembali =
    kembaliHref ?? (ubah ? `/kependudukan/penduduk/${penduduk.id}` : "/kependudukan/penduduk");
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<{ id: number }>(),
  );
  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const galat = (name: string): string | undefined => fieldErrors[name]?.[0];
  const tidakValid = (name: string): boolean => galat(name) !== undefined;

  useEffect(() => {
    if (state.status !== "success") return;
    router.push(`${redirectPrefix}/${state.data.id}`);
  }, [state, router, redirectPrefix]);

  const bagian = { penduduk, references, galat, tidakValid };

  return (
    <form action={formAction} className="form-stack penduduk-form">
      {ubah ? <input name="id" type="hidden" value={penduduk.id} /> : null}
      {children}

      <BagianIdentitas {...bagian} familyId={familyId} sembunyikanKeluarga={sembunyikanKeluarga} />
      <BagianKelahiran {...bagian} />
      <BagianPendidikan {...bagian} />
      <BagianKewarganegaraan {...bagian} />
      <BagianAlamatKontak {...bagian} />
      <BagianOrangTua {...bagian} />
      <BagianPerkawinan {...bagian} />
      <BagianKesehatan {...bagian} />
      <BagianLainnya {...bagian} />

      <PesanDialog state={state} />

      <div className="penduduk-form-actions">
        <span className="penduduk-form-actions-note">
          {ubah
            ? "Periksa kembali perubahan sebelum menyimpan."
            : "Field bertanda wajib harus diisi."}
        </span>
        <div className="penduduk-form-actions-buttons">
          {labelKembali ? (
            <Link className="penduduk-back penduduk-form-back" href={kembali}>
              {labelKembali}
            </Link>
          ) : null}
          <ButtonLink variant="secondary" href={kembali}>
            Batal
          </ButtonLink>
          <Button variant="primary" disabled={pending} type="submit">
            {pending
              ? "Menyimpan..."
              : (labelSimpan ?? (ubah ? "Simpan Perubahan" : "Simpan Penduduk"))}
          </Button>
        </div>
      </div>
    </form>
  );
}
