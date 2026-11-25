"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createKeluarga,
  createKeluargaDenganKepalaBaru,
  deleteKeluarga,
  deleteKeluargaBanyak,
  getKeluargaDetail,
  pecahKeluarga,
  pindahWilayahKeluarga,
  updateKeluarga,
} from "@/features/keluarga/application/use-cases";
import {
  HEAD_OF_FAMILY_RELATION_ID,
  keluargaFieldsSchema,
  keluargaFormSchema,
  pecahKeluargaSchema,
} from "@/features/keluarga/domain/keluarga";
import { ambilFormulirPenduduk } from "@/features/penduduk/application/form-data";
import { getPendudukFormData, updatePenduduk } from "@/features/penduduk/application/use-cases";
import { pendudukFormSchema } from "@/features/penduduk/domain/penduduk";
import { tambahRtmKolektifUntukKeluarga } from "@/features/rumah-tangga/application/use-cases";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

function bacaFormKeluarga(formData: FormData) {
  return {
    number: String(formData.get("number") ?? ""),
    temporary: formData.get("temporary") === "on",
    address: String(formData.get("address") ?? ""),
    regionId: String(formData.get("regionId") ?? ""),
    welfareClass: String(formData.get("welfareClass") ?? ""),
    cardPrintedAt: String(formData.get("cardPrintedAt") ?? ""),
  };
}

function bacaIds(formData: FormData): number[] {
  return [
    ...new Set(
      String(formData.get("ids") ?? "")
        .split(/[^0-9]+/)
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ];
}

export async function buatKeluargaAction(formData: FormData): Promise<never> {
  const input = keluargaFormSchema.parse({
    ...bacaFormKeluarga(formData),
    headResidentId: String(formData.get("headResidentId") ?? ""),
  });
  const result = await createKeluarga(input);
  revalidatePath("/keluarga");
  revalidatePath("/penduduk");
  redirect(`/keluarga/${result.id}`);
}

export async function buatKeluargaDenganKepalaBaruAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const keluarga = keluargaFieldsSchema.parse(bacaFormKeluarga(formData));
    const penduduk = pendudukFormSchema.parse(ambilFormulirPenduduk(formData));
    const hasil = await createKeluargaDenganKepalaBaru(keluarga, penduduk);

    revalidatePath("/keluarga");
    revalidatePath("/penduduk");
    revalidatePath(`/keluarga/${hasil.id}`);
    revalidatePath(`/penduduk/${hasil.residentId}`);

    return successState("Kartu Keluarga dan kepala keluarga berhasil ditambahkan.", {
      id: hasil.id,
    });
  } catch (error) {
    return toErrorState(error);
  }
}

export async function pindahWilayahKolektifAction(formData: FormData): Promise<never> {
  const ids = bacaIds(formData);
  const regionId = Number(formData.get("regionId"));
  const jumlah = await pindahWilayahKeluarga(ids, regionId);
  revalidatePath("/keluarga");
  revalidatePath("/penduduk");
  redirect(`/keluarga?pindah=${jumlah}`);
}

export async function tambahRtmKolektifAction(formData: FormData): Promise<never> {
  const ids = bacaIds(formData);
  const hasil = await tambahRtmKolektifUntukKeluarga(ids);
  revalidatePath("/keluarga");
  revalidatePath("/penduduk");
  redirect(`/keluarga?rtm=${hasil.dibuat}&rtmSkip=${hasil.dilewati.length}`);
}

export async function hapusKeluargaKolektifAction(formData: FormData): Promise<never> {
  const ids = bacaIds(formData);
  const hasil = await deleteKeluargaBanyak(ids);
  revalidatePath("/keluarga");
  revalidatePath("/penduduk");
  revalidatePath("/rumah-tangga");
  redirect(`/keluarga?dihapus=${hasil.dihapus}&hapusSkip=${hasil.dilewati.length}`);
}

export async function pecahKeluargaAction(id: number, formData: FormData): Promise<never> {
  const input = pecahKeluargaSchema.parse({
    number: String(formData.get("number") ?? ""),
    temporary: formData.get("temporary") === "on",
    headResidentId: String(formData.get("headResidentId") ?? ""),
  });
  const hasil = await pecahKeluarga(id, input);
  revalidatePath("/keluarga");
  revalidatePath(`/keluarga/${id}`);
  revalidatePath(`/keluarga/${hasil.id}`);
  revalidatePath("/penduduk");
  redirect(`/keluarga/${hasil.id}`);
}

export async function ubahKeluargaAction(id: number, formData: FormData): Promise<never> {
  const input = keluargaFieldsSchema.parse(bacaFormKeluarga(formData));
  await updateKeluarga(id, input);
  revalidatePath(`/keluarga/${id}`);
  revalidatePath("/keluarga");
  redirect(`/keluarga/${id}`);
}

export async function hapusKeluargaAction(formData: FormData): Promise<never> {
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Kartu Keluarga tidak valid.");
  await deleteKeluarga(id);
  revalidatePath("/keluarga");
  revalidatePath("/penduduk");
  redirect("/keluarga?deleted=1");
}

export async function lepasAnggotaKeluargaAction(formData: FormData): Promise<never> {
  const id = Number(formData.get("id"));
  const familyId = Number(formData.get("familyId"));
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(familyId) || familyId <= 0)
    throw new Error("Data anggota keluarga tidak valid.");
  const [{ penduduk }, family] = await Promise.all([
    getPendudukFormData(id),
    getKeluargaDetail(familyId),
  ]);
  if (
    !penduduk ||
    penduduk.familyId !== familyId ||
    !family.members.some((member) => member.id === id)
  )
    throw new Error("Anggota tidak ditemukan pada Kartu Keluarga ini.");
  if (penduduk.familyRelationId === HEAD_OF_FAMILY_RELATION_ID && family.members.length > 1)
    throw new Error(
      "Tetapkan anggota lain sebagai kepala keluarga sebelum melepas kepala keluarga saat ini.",
    );
  const { id: _id, ...input } = penduduk;
  await updatePenduduk(id, {
    ...input,
    birthPlace: input.birthPlace ?? "",
    address: input.address ?? "",
    phone: input.phone ?? "",
    fatherName: input.fatherName ?? "",
    motherName: input.motherName ?? "",
    familyId: null,
    familyRelationId: null,
  });
  revalidatePath(`/keluarga/${familyId}`);
  revalidatePath("/keluarga");
  revalidatePath("/penduduk");
  redirect(`/keluarga/${familyId}?memberRemoved=1`);
}
