"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cabutSesiPenggunaDesaDesa,
  resetSandiPenggunaDesaDesa,
  ubahStatusPenggunaDesaDesa,
} from "@/features/multi-desa/application/pengguna-desa-use-cases";
import {
  keluarDariImpersonasi,
  masukSebagaiAdminDesa,
} from "@/features/multi-desa/application/impersonasi-use-cases";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

/**
 * Server Action direktori pengguna desa.
 *
 * Route hanya memetakan FormData ke use case; otorisasi Super Admin, validasi
 * Zod, pembatasan `village_id IS NOT NULL`, dan audit tetap di application
 * layer. `villageId` tidak pernah dibaca dari form.
 */

function segarkan(): void {
  revalidatePath("/super-admin/pengguna-desa");
  revalidatePath("/super-admin/tenant");
  revalidatePath("/super-admin");
}

export async function ubahStatusPenggunaDesaAction(
  _state: ActionState<{ active: boolean }>,
  formData: FormData,
): Promise<ActionState<{ active: boolean }>> {
  try {
    const hasil = await ubahStatusPenggunaDesaDesa({
      id: formData.get("id"),
      active: formData.get("active"),
    });
    segarkan();
    return successState(hasil.active ? "Akun diaktifkan." : "Akun dinonaktifkan.", hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function resetSandiPenggunaDesaAction(
  _state: ActionState<{ username: string | null; email: string; sandiSementara: string }>,
  formData: FormData,
): Promise<ActionState<{ username: string | null; email: string; sandiSementara: string }>> {
  try {
    const hasil = await resetSandiPenggunaDesaDesa(formData.get("id"));
    segarkan();
    return successState(
      "Sandi direset. Sandi sementara hanya ditampilkan sekali.",
      hasil,
      "warning",
    );
  } catch (error) {
    return toErrorState(error);
  }
}

export async function cabutSesiPenggunaDesaAction(
  _state: ActionState<{ jumlah: number }>,
  formData: FormData,
): Promise<ActionState<{ jumlah: number }>> {
  try {
    const hasil = await cabutSesiPenggunaDesaDesa(formData.get("id"));
    segarkan();
    if (hasil.jumlah === 0) {
      // Bukan kegagalan: akun memang tidak punya sesi aktif. Tetap dilaporkan
      // agar operator tahu tidak ada yang dicabut.
      return successState("Tidak ada sesi aktif yang perlu dicabut.", hasil);
    }
    return successState(`${hasil.jumlah} sesi dicabut.`, hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

/**
 * Masuk sebagai administrator desa (impersonasi).
 *
 * Berhasil langsung mengalihkan ke beranda desa; `redirect` dilempar di luar
 * `try` agar tidak tertelan `toErrorState` menjadi pesan generik.
 */
export async function masukSebagaiAdminAction(
  _state: ActionState<{ villageId: number; targetUserId: string }>,
  formData: FormData,
): Promise<ActionState<{ villageId: number; targetUserId: string }>> {
  let hasil: Awaited<ReturnType<typeof masukSebagaiAdminDesa>>;
  try {
    hasil = await masukSebagaiAdminDesa(formData.get("villageId"));
  } catch (error) {
    return toErrorState(error);
  }
  segarkan();
  redirect("/beranda");
  return successState("Masuk sebagai administrator desa.", {
    villageId: hasil.villageId,
    targetUserId: hasil.targetUserId,
  });
}

/** Keluar dari impersonasi dan kembali ke konsol platform. */
export async function keluarImpersonasiAction(): Promise<never> {
  await keluarDariImpersonasi();
  segarkan();
  redirect("/super-admin");
}
