"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { putuskanPengajuanIzin } from "@/features/kehadiran/kepegawaian/application/pengajuan-izin-use-cases";
import { errorState, toErrorState, type ActionState } from "@/lib/action-state";

const RUTE = "/kehadiran/persetujuan-izin";

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Setujui atau tolak satu pengajuan izin.
 *
 * Hanya pengajuan berstatus menunggu yang dapat diputuskan; aturan tersebut
 * diperiksa di use case bersama mesin cuti/izin agar sama dengan halaman
 * Absensi & Kepegawaian → Cuti & Izin.
 */
export async function putuskanIzinAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const id = idPositif(formData.get("id"));
  if (id === null) return errorState("ID pengajuan izin tidak valid.");

  const status = String(formData.get("status") ?? "");
  if (status !== "disetujui" && status !== "ditolak") {
    return errorState("Pilih keputusan Setujui atau Tolak.");
  }

  try {
    await putuskanPengajuanIzin(id, status, String(formData.get("catatan") ?? "").trim());
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(RUTE);
  revalidatePath("/kehadiran/rekapitulasi");
  revalidatePath("/kehadiran/cuti-izin");
  // `hasil` dipisahkan dari `status` agar pesan keputusan tidak mengubah filter daftar.
  redirect(`${RUTE}?hasil=${status}`);
}
