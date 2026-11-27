"use server";

import type { ActionState } from "@/lib/action-state";
import { jalankanAksiForm } from "@/lib/form-action-state";

import { simpanDokumenLaporanAction, tandaiDokumenLaporanAction } from "../actions";

export async function simpanDokumenLaporanFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, simpanDokumenLaporanAction, "Dokumen laporan disimpan.");
}

export async function tandaiDokumenLaporanFormAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  return jalankanAksiForm(formData, tandaiDokumenLaporanAction, "Tanggal penyerahan diperbarui.");
}
