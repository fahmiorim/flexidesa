"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addAnggotaKelompok,
  createKategori,
  createKelompok,
  deleteKategori,
  deleteKategoriMassal,
  deleteKelompok,
  deleteKelompokMassal,
  removeAnggotaKelompok,
  removeAnggotaKelompokMassal,
  setAnggotaPublik,
  updateAnggotaKelompok,
  updateKategori,
  updateKelompok,
} from "@/features/kelompok/application/use-cases";
import {
  anggotaKelompokFormSchema,
  kategoriKelompokFormSchema,
  kelompokFormSchema,
} from "@/features/kelompok/domain/kelompok";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const id = Number(nilai);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function idsDariForm(formData: FormData): number[] {
  return formData
    .getAll("idCb")
    .map((nilai) => Number(nilai))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
}

function bacaFormKelompok(formData: FormData) {
  return {
    nama: String(formData.get("nama") ?? ""),
    tipe: String(formData.get("tipe") ?? "kelompok"),
    kategoriId: String(formData.get("kategoriId") ?? ""),
    kode: String(formData.get("kode") ?? ""),
    nomorSk: String(formData.get("nomorSk") ?? ""),
    keterangan: String(formData.get("keterangan") ?? ""),
  };
}

function bacaFormAnggota(formData: FormData) {
  return {
    residentId: String(formData.get("residentId") ?? ""),
    jabatan: String(formData.get("jabatan") ?? ""),
    nomorAnggota: String(formData.get("nomorAnggota") ?? ""),
    nomorSk: String(formData.get("nomorSk") ?? ""),
    keterangan: String(formData.get("keterangan") ?? ""),
  };
}

function revalidasiKelompok(kelompokId?: number) {
  revalidatePath("/kelompok");
  revalidatePath("/kelompok/kategori");
  if (kelompokId !== undefined) revalidatePath(`/kelompok/${kelompokId}`);
}

export async function buatKelompokAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  let hasil: { id: number };
  try {
    const input = kelompokFormSchema.parse(bacaFormKelompok(formData));
    const ketuaId = idPositif(formData.get("ketuaId"));
    hasil = await createKelompok(input, ketuaId);
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok();
  redirect(`/kelompok/${hasil.id}`);
}

export async function ubahKelompokAction(
  id: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = kelompokFormSchema.parse(bacaFormKelompok(formData));
    await updateKelompok(id, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok(id);
  redirect(`/kelompok/${id}`);
}

export async function hapusKelompokAction(formData: FormData): Promise<never> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("Kelompok tidak valid.");
  await deleteKelompok(id);
  revalidasiKelompok();
  redirect("/kelompok?dihapus=1");
}

/** Hapus banyak kelompok yang dicentang (paritas `delete_all` OpenSID). */
export async function hapusKelompokMassalAction(formData: FormData): Promise<never> {
  await deleteKelompokMassal(idsDariForm(formData));
  revalidasiKelompok();
  redirect("/kelompok?dihapus=1");
}

export async function simpanAnggotaKelompokAction(
  kelompokId: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = anggotaKelompokFormSchema.parse(bacaFormAnggota(formData));
    await addAnggotaKelompok(kelompokId, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok(kelompokId);
  return successState("Anggota kelompok berhasil disimpan.", { id: 1 });
}

/** Tambah banyak anggota dari checkbox kandidat (paritas aksi/2 OpenSID). */ export async function simpanAnggotaKelompokBanyakAction(
  kelompokId: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  const residentIds = idsDariForm(formData);
  if (residentIds.length === 0) return errorState("Pilih minimal satu penduduk.");

  let jumlah = 0;
  try {
    for (const residentId of residentIds) {
      await addAnggotaKelompok(kelompokId, {
        residentId,
        jabatan: 90,
        nomorAnggota: "",
        nomorSk: "",
        keterangan: "",
      });
      jumlah += 1;
    }
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok(kelompokId);
  return successState(`${jumlah} anggota kelompok berhasil disimpan.`, { id: jumlah });
}

export async function ubahAnggotaKelompokAction(
  kelompokId: number,
  memberId: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = anggotaKelompokFormSchema.parse(bacaFormAnggota(formData));
    await updateAnggotaKelompok(kelompokId, memberId, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok(kelompokId);
  redirect(`/kelompok/${kelompokId}`);
}

export async function lepasAnggotaKelompokAction(
  kelompokId: number,
  formData: FormData,
): Promise<never> {
  const memberId = idPositif(formData.get("memberId"));
  if (memberId === null) throw new Error("Anggota kelompok tidak valid.");
  await removeAnggotaKelompok(kelompokId, memberId);
  revalidasiKelompok(kelompokId);
  redirect(`/kelompok/${kelompokId}`);
}

/** Lepaskan banyak anggota yang dicentang (paritas `delete_all` OpenSID). */
export async function lepasAnggotaKelompokMassalAction(
  kelompokId: number,
  formData: FormData,
): Promise<never> {
  await removeAnggotaKelompokMassal(kelompokId, idsDariForm(formData));
  revalidasiKelompok(kelompokId);
  redirect(`/kelompok/${kelompokId}`);
}

export async function ubahPublikasiAnggotaAction(
  kelompokId: number,
  formData: FormData,
): Promise<never> {
  const memberId = idPositif(formData.get("memberId"));
  if (memberId === null) throw new Error("Anggota kelompok tidak valid.");
  await setAnggotaPublik(kelompokId, memberId, formData.get("tampilPublik") === "on");
  revalidasiKelompok(kelompokId);
  redirect(`/kelompok/${kelompokId}`);
}

function bacaFormKategori(formData: FormData) {
  return {
    nama: String(formData.get("nama") ?? ""),
    tipe: String(formData.get("tipe") ?? "kelompok"),
    deskripsi: String(formData.get("deskripsi") ?? ""),
  };
}

export async function buatKategoriAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = kategoriKelompokFormSchema.parse(bacaFormKategori(formData));
    await createKategori(input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok();
  redirect("/kelompok/kategori");
}

export async function ubahKategoriAction(
  id: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const input = kategoriKelompokFormSchema.parse(bacaFormKategori(formData));
    await updateKategori(id, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidasiKelompok();
  redirect("/kelompok/kategori");
}

export async function hapusKategoriAction(formData: FormData): Promise<never> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("Kategori tidak valid.");
  await deleteKategori(id);
  revalidasiKelompok();
  redirect("/kelompok/kategori?dihapus=1");
}

/** Hapus banyak kategori yang dicentang (paritas `delete_all` OpenSID). */
export async function hapusKategoriMassalAction(formData: FormData): Promise<never> {
  await deleteKategoriMassal(idsDariForm(formData));
  revalidasiKelompok();
  redirect("/kelompok/kategori?dihapus=1");
}
