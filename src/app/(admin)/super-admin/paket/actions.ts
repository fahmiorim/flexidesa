"use server";

import { revalidatePath } from "next/cache";

import {
  buatDrafVersiPaketPlatform,
  buatPaketPlatform,
  rolloutVersiPaketPlatform,
  simpanFiturDrafPaketPlatform,
  terbitkanVersiPaketPlatform,
  tetapkanPaketTenantPlatform,
  ubahPaketPlatform,
  ubahStatusPaketPlatform,
} from "@/features/multi-desa/application/paket-langganan-use-cases";
import type { StatusPaket } from "@/features/multi-desa/domain/paket-langganan";
import { successState, toErrorState, type ActionState } from "@/lib/action-state";

const HALAMAN = "/super-admin/paket";

function segarkanPaket(planId?: number): void {
  revalidatePath(HALAMAN);
  revalidatePath(`${HALAMAN}/tenant`);
  revalidatePath("/super-admin/tenant");
  revalidatePath("/super-admin/tenant/tambah");
  if (planId !== undefined) revalidatePath(`${HALAMAN}/${planId}`);
}

export async function buatPaketAction(
  _state: ActionState<{ id: number; versionId: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number; versionId: number }>> {
  try {
    const hasil = await buatPaketPlatform({
      slug: formData.get("slug"),
      name: formData.get("name"),
      description: formData.get("description"),
    });
    segarkanPaket(hasil.id);
    return successState("Paket dibuat sebagai draf. Pilih modul sebelum menerbitkannya.", hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function ubahPaketAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const id = Number(formData.get("id"));
    await ubahPaketPlatform({
      id,
      name: formData.get("name"),
      description: formData.get("description"),
    });
    segarkanPaket(id);
    return successState("Informasi paket diperbarui.", { id });
  } catch (error) {
    return toErrorState(error);
  }
}

export async function ubahStatusPaketAction(
  _state: ActionState<{ status: StatusPaket }>,
  formData: FormData,
): Promise<ActionState<{ status: StatusPaket }>> {
  try {
    const hasil = await ubahStatusPaketPlatform({
      id: formData.get("id"),
      status: formData.get("status"),
    });
    segarkanPaket();
    return successState("Status paket diperbarui.", hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function buatDrafVersiPaketAction(
  _state: ActionState<{ id: number; version: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number; version: number }>> {
  try {
    const hasil = await buatDrafVersiPaketPlatform({ planId: formData.get("planId") });
    segarkanPaket(hasil.id);
    return successState(`Draf versi ${hasil.version} dibuat.`, hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function simpanFiturPaketAction(
  _state: ActionState<{ planId: number; versionId: number }>,
  formData: FormData,
): Promise<ActionState<{ planId: number; versionId: number }>> {
  try {
    const input = {
      planId: formData.get("planId"),
      versionId: formData.get("versionId"),
      moduleSlugs: formData.getAll("moduleSlugs").map(String),
      changelog: formData.get("changelog"),
    };
    await simpanFiturDrafPaketPlatform(input);
    const planId = Number(input.planId);
    const hasil = { planId, versionId: Number(input.versionId) };
    segarkanPaket(planId);
    return successState("Daftar fitur draf disimpan.", hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function terbitkanVersiPaketAction(
  _state: ActionState<{ planId: number; versionId: number }>,
  formData: FormData,
): Promise<ActionState<{ planId: number; versionId: number }>> {
  try {
    const input = { planId: formData.get("planId"), versionId: formData.get("versionId") };
    await terbitkanVersiPaketPlatform(input);
    const hasil = { planId: Number(input.planId), versionId: Number(input.versionId) };
    segarkanPaket(hasil.planId);
    return successState("Versi paket diterbitkan untuk tenant baru.", hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function rolloutVersiPaketAction(
  _state: ActionState<{ jumlahTenant: number }>,
  formData: FormData,
): Promise<ActionState<{ jumlahTenant: number }>> {
  try {
    const hasil = await rolloutVersiPaketPlatform({
      planId: formData.get("planId"),
      versionId: formData.get("versionId"),
      confirmed: formData.get("confirmed") === "on",
    });
    segarkanPaket(Number(formData.get("planId")));
    return successState(`${hasil.jumlahTenant} tenant diperbarui ke versi paket ini.`, hasil);
  } catch (error) {
    return toErrorState(error);
  }
}

export async function tetapkanPaketTenantAction(
  _state: ActionState<{ jumlahTenant: number }>,
  formData: FormData,
): Promise<ActionState<{ jumlahTenant: number }>> {
  try {
    const hasil = await tetapkanPaketTenantPlatform({
      villageIds: formData.getAll("villageIds").map(String),
      planVersionId: formData.get("planVersionId"),
      confirmed: formData.get("confirmed") === "on",
    });
    segarkanPaket();
    return successState(`${hasil.jumlahTenant} tenant menerima penetapan paket.`, hasil);
  } catch (error) {
    return toErrorState(error);
  }
}
