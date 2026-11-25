"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assignAnggotaRumahTangga,
  createRumahTangga,
  deleteRumahTangga,
  removeAnggotaRumahTangga,
  removeAnggotaRumahTanggaMassal,
  updateRumahTangga,
} from "@/features/rumah-tangga/application/use-cases";
import { rumahTanggaFormSchema } from "@/features/rumah-tangga/domain/rumah-tangga";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";

function bacaFormRtm(formData: FormData) {
  return {
    alamat: String(formData.get("alamat") ?? ""),
    regionId: String(formData.get("regionId") ?? ""),
    kelasSosial: String(formData.get("kelasSosial") ?? ""),
    bdt: String(formData.get("bdt") ?? ""),
  };
}

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function buatRumahTanggaAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  let hasil: { id: number };
  try {
    const input = rumahTanggaFormSchema.parse(bacaFormRtm(formData));
    const headResidentId = idPositif(formData.get("headResidentId"));
    const terdaftarDtks = formData.get("terdaftarDtks") === "on";
    hasil = await createRumahTangga(input, headResidentId, terdaftarDtks);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/rumah-tangga");
  revalidatePath("/penduduk");
  redirect(`/rumah-tangga/${hasil.id}`);
}

export async function ubahRumahTanggaAction(
  id: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = rumahTanggaFormSchema.parse(bacaFormRtm(formData));
    const terdaftarDtks = formData.get("terdaftarDtks") === "on";
    await updateRumahTangga(id, input, terdaftarDtks);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath("/rumah-tangga");
  revalidatePath(`/rumah-tangga/${id}`);
  redirect(`/rumah-tangga/${id}`);
}

export async function hapusRumahTanggaAction(formData: FormData): Promise<never> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("Rumah Tangga tidak valid.");
  await deleteRumahTangga(id);
  revalidatePath("/rumah-tangga");
  revalidatePath("/penduduk");
  redirect("/rumah-tangga?dihapus=1");
}

export async function simpanAnggotaAction(
  rtmId: number,
  _state: ActionState<{ jumlah: number }>,
  formData: FormData,
): Promise<ActionState<{ jumlah: number }>> {
  const residentId = idPositif(formData.get("residentId"));
  const level = Number(formData.get("level"));

  if (residentId === null) {
    return errorState("Pilih penduduk yang akan ditambahkan.");
  }
  if (level !== 1 && level !== 2) {
    return errorState("Tingkat hubungan rumah tangga tidak valid.");
  }

  try {
    await assignAnggotaRumahTangga(rtmId, residentId, level);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(`/rumah-tangga/${rtmId}`);
  revalidatePath("/rumah-tangga");
  return successState("Anggota rumah tangga berhasil disimpan.", { jumlah: 1 });
}

export async function ubahLevelAnggotaAction(rtmId: number, formData: FormData): Promise<never> {
  const residentId = idPositif(formData.get("residentId"));
  const level = Number(formData.get("level"));
  if (residentId === null || (level !== 1 && level !== 2)) {
    throw new Error("Data anggota rumah tangga tidak valid.");
  }
  await assignAnggotaRumahTangga(rtmId, residentId, level);
  revalidatePath(`/rumah-tangga/${rtmId}`);
  revalidatePath("/rumah-tangga");
  redirect(`/rumah-tangga/${rtmId}`);
}

export async function lepasAnggotaAction(rtmId: number, formData: FormData): Promise<never> {
  const residentId = idPositif(formData.get("residentId"));
  if (residentId === null) throw new Error("Anggota rumah tangga tidak valid.");
  await removeAnggotaRumahTangga(residentId);
  revalidatePath(`/rumah-tangga/${rtmId}`);
  revalidatePath("/rumah-tangga");
  redirect(`/rumah-tangga/${rtmId}`);
}

/** Lepaskan banyak anggota yang dicentang sekaligus (paritas OpenSID). */
export async function lepasAnggotaMassalAction(rtmId: number, formData: FormData): Promise<never> {
  const residentIds = formData
    .getAll("idCb")
    .map((nilai) => Number(nilai))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  await removeAnggotaRumahTanggaMassal(residentIds);
  revalidatePath(`/rumah-tangga/${rtmId}`);
  revalidatePath("/rumah-tangga");
  redirect(`/rumah-tangga/${rtmId}`);
}
