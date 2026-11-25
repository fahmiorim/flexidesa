"use server";

import { revalidatePath } from "next/cache";

import { sinkronkanIdmKemendesa } from "@/features/status-desa/application/status-desa-use-cases";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";
import { logger } from "@/lib/logger";

export async function sinkronkanIdmAction(
  _state: ActionState<{ jumlah: number }>,
  formData: FormData,
): Promise<ActionState<{ jumlah: number }>> {
  const tahun = Number.parseInt(String(formData.get("tahun") ?? ""), 10);
  if (!Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
    return errorState("Tahun IDM tidak valid.");
  }

  try {
    const hasil = await sinkronkanIdmKemendesa(tahun);
    revalidatePath("/status-desa");
    revalidatePath("/desa/idm");
    revalidatePath("/desa/status-des");
    return successState(
      `Berhasil menyinkronkan ${hasil.jumlah} indikator IDM tahun ${tahun}.`,
      hasil,
    );
  } catch (error) {
    logger.warn("Sinkronisasi IDM Kemendesa gagal", { error, tahun });
    return toErrorState(error);
  }
}
