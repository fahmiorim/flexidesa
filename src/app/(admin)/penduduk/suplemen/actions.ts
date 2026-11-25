"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveVillageId } from "@/features/desa/application/resolve-village";
import {
  addSuplemenTerdataUseCase,
  createSuplemenUseCase,
  deleteSuplemenUseCase,
  imporSuplemenUseCase,
  removeSuplemenTerdataMassalUseCase,
  removeSuplemenTerdataUseCase,
  updateSuplemenTerdataUseCase,
  updateSuplemenUseCase,
} from "@/features/penduduk/application/suplemen-use-cases";
import {
  SASARAN_KELUARGA,
  SASARAN_PENDUDUK,
  SUPLEMEN_RESOURCE,
  suplemenCreateSchema,
  suplemenTerdataSchema,
  suplemenTerdataUpdateSchema,
  suplemenUpdateSchema,
} from "@/features/penduduk/domain/suplemen";
import { KOLOM_IMPOR_SUPLEMEN } from "@/features/penduduk/domain/suplemen-berkas";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";
import { requirePermission } from "@/lib/dal";
import {
  bacaTabelImpor,
  BATAS_UKURAN_IMPOR,
  ekstensiImporDidukung,
  petakanKolom,
} from "@/lib/spreadsheet";

const HALAMAN = "/penduduk/suplemen";

function teks(formData: FormData, nama: string): string {
  const nilai = formData.get(nama);
  return typeof nilai === "string" ? nilai : "";
}

function idPositif(nilai: FormDataEntryValue | null): number | null {
  const angka = Number(nilai);
  return Number.isSafeInteger(angka) && angka > 0 ? angka : null;
}

/** Baca baris isian dinamis dari pasangan `isianNama[]` / `isianNilai[]`. */
function bacaIsianForm(formData: FormData): Record<string, string> {
  const nama = formData.getAll("isianNama").map((item) => String(item).trim());
  const nilai = formData.getAll("isianNilai").map((item) => String(item).trim());
  const hasil: Record<string, string> = {};
  nama.forEach((kunci, indeks) => {
    if (kunci !== "") hasil[kunci] = nilai[indeks] ?? "";
  });
  return hasil;
}

/** Definisi form isian dikirim sebagai JSON dari penyusun kolom di form. */
function bacaFormIsianJson(formData: FormData): unknown[] {
  const mentah = teks(formData, "dataFormIsian");
  if (mentah.trim() === "") return [];
  try {
    const parsed = JSON.parse(mentah) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sasaranDari(formData: FormData): number {
  return Number(teks(formData, "sasaran")) === SASARAN_KELUARGA
    ? SASARAN_KELUARGA
    : SASARAN_PENDUDUK;
}

// --- Suplemen -------------------------------------------------------------

export async function buatSuplemenAction(
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  let id: number;
  try {
    const user = await requirePermission(SUPLEMEN_RESOURCE, "update");
    const villageId = await resolveVillageId(user);
    const input = suplemenCreateSchema.parse({
      nama: teks(formData, "nama").trim(),
      sasaran: sasaranDari(formData),
      keterangan: teks(formData, "keterangan").trim() || null,
      dataFormIsian: bacaFormIsianJson(formData),
    });
    id = await createSuplemenUseCase(villageId, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(HALAMAN);
  redirect(`${HALAMAN}/${id}`);
}

export async function ubahSuplemenAction(
  id: number,
  _state: ActionState<{ id: number }>,
  formData: FormData,
): Promise<ActionState<{ id: number }>> {
  try {
    const user = await requirePermission(SUPLEMEN_RESOURCE, "update");
    const villageId = await resolveVillageId(user);
    const input = suplemenUpdateSchema.parse({
      id,
      nama: teks(formData, "nama").trim(),
      sasaran: sasaranDari(formData),
      keterangan: teks(formData, "keterangan").trim() || null,
      dataFormIsian: bacaFormIsianJson(formData),
    });
    await updateSuplemenUseCase(villageId, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(HALAMAN);
  revalidatePath(`${HALAMAN}/${id}`);
  redirect(`${HALAMAN}/${id}`);
}

export async function hapusSuplemenAction(formData: FormData): Promise<never> {
  const id = idPositif(formData.get("id"));
  if (id === null) throw new Error("Data suplemen tidak valid.");

  const user = await requirePermission(SUPLEMEN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);

  try {
    await deleteSuplemenUseCase(villageId, id);
  } catch (error) {
    // Aturan "masih punya peserta" bukan galat sistem: kembalikan ke daftar
    // dengan pesan agar pengguna tahu alasannya, bukan halaman galat.
    const pesan = error instanceof Error ? error.message : "Gagal menghapus data suplemen.";
    redirect(`${HALAMAN}?gagal=${encodeURIComponent(pesan)}`);
  }

  revalidatePath(HALAMAN);
  redirect(`${HALAMAN}?dihapus=1`);
}

// --- Terdata --------------------------------------------------------------

export async function tambahTerdataAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  let suplemenId: number;
  try {
    const user = await requirePermission(SUPLEMEN_RESOURCE, "update");
    const villageId = await resolveVillageId(user);

    const suplemenMentah = idPositif(formData.get("suplemenId"));
    const sasaranMentah = idPositif(formData.get("sasaranId"));
    if (suplemenMentah === null) return errorState("Data suplemen tidak valid.");
    if (sasaranMentah === null) return errorState("Pilih warga yang akan didata terlebih dahulu.");
    suplemenId = suplemenMentah;

    const sasaran = sasaranDari(formData);
    const input = suplemenTerdataSchema.parse({
      suplemenId,
      pendudukId: sasaran === SASARAN_PENDUDUK ? sasaranMentah : null,
      keluargaId: sasaran === SASARAN_KELUARGA ? sasaranMentah : null,
      keterangan: teks(formData, "keterangan").trim() || null,
      isian: bacaIsianForm(formData),
    });
    await addSuplemenTerdataUseCase(villageId, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(`${HALAMAN}/${suplemenId}`);
  return successState("Data terdata berhasil ditambahkan.");
}

export async function ubahTerdataAction(
  _state: ActionState<null>,
  formData: FormData,
): Promise<ActionState<null>> {
  let suplemenId: number;
  try {
    const user = await requirePermission(SUPLEMEN_RESOURCE, "update");
    const villageId = await resolveVillageId(user);

    const suplemenMentah = idPositif(formData.get("suplemenId"));
    const terdataMentah = idPositif(formData.get("terdataId"));
    if (suplemenMentah === null || terdataMentah === null) {
      return errorState("Data terdata tidak valid.");
    }
    suplemenId = suplemenMentah;

    const input = suplemenTerdataUpdateSchema.parse({
      suplemenId,
      terdataId: terdataMentah,
      keterangan: teks(formData, "keterangan").trim() || null,
      isian: bacaIsianForm(formData),
    });
    await updateSuplemenTerdataUseCase(villageId, input);
  } catch (error) {
    return toErrorState(error);
  }

  revalidatePath(`${HALAMAN}/${suplemenId}`);
  return successState("Perubahan data terdata disimpan.");
}

export async function hapusTerdataAction(formData: FormData): Promise<never> {
  const id = idPositif(formData.get("terdataId"));
  const suplemenId = idPositif(formData.get("suplemenId"));
  if (id === null || suplemenId === null) throw new Error("Data terdata tidak valid.");

  const user = await requirePermission(SUPLEMEN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  await removeSuplemenTerdataUseCase(villageId, id);

  revalidatePath(`${HALAMAN}/${suplemenId}`);
  redirect(`${HALAMAN}/${suplemenId}?dihapus=1`);
}

export async function hapusTerdataMassalAction(formData: FormData): Promise<never> {
  const suplemenId = idPositif(formData.get("suplemenId"));
  const ids = formData
    .getAll("idTerdata")
    .map((item) => idPositif(item))
    .filter((item): item is number => item !== null);
  if (suplemenId === null || ids.length === 0) {
    throw new Error("Pilih minimal satu data terdata yang akan dihapus.");
  }

  const user = await requirePermission(SUPLEMEN_RESOURCE, "delete");
  const villageId = await resolveVillageId(user);
  await removeSuplemenTerdataMassalUseCase(villageId, suplemenId, ids);

  revalidatePath(`${HALAMAN}/${suplemenId}`);
  redirect(`${HALAMAN}/${suplemenId}?dihapus=${ids.length}`);
}

// --- Impor ----------------------------------------------------------------

export async function imporTerdataAction(
  _state: ActionState<{ ditambahkan: number; dilewati: number; tidakDitemukan: string[] }>,
  formData: FormData,
): Promise<ActionState<{ ditambahkan: number; dilewati: number; tidakDitemukan: string[] }>> {
  let suplemenId: number;
  try {
    const user = await requirePermission(SUPLEMEN_RESOURCE, "update");
    const villageId = await resolveVillageId(user);

    const suplemenMentah = idPositif(formData.get("suplemenId"));
    if (suplemenMentah === null) return errorState("Data suplemen tidak valid.");
    suplemenId = suplemenMentah;

    const berkas = formData.get("berkas");
    if (!(berkas instanceof File) || berkas.size === 0) {
      return errorState("Pilih berkas yang akan diimpor.");
    }
    if (berkas.size > BATAS_UKURAN_IMPOR) {
      return errorState("Ukuran berkas melebihi 5 MB.");
    }
    if (!ekstensiImporDidukung(berkas.name)) {
      return errorState("Berkas harus berformat .xlsx, .csv, atau .txt.");
    }

    const tabel = await bacaTabelImpor(
      Buffer.from(await berkas.arrayBuffer()),
      berkas.name,
      "Peserta",
    );
    // Baris penutup `###` menandai akhir data pada format OpenSID.
    const bersih = tabel.filter((baris) => (baris[0] ?? "").trim() !== "###");
    const peta = petakanKolom(bersih, KOLOM_IMPOR_SUPLEMEN);
    if (peta.galat.some((galat) => galat.baris === 0)) {
      return errorState(peta.galat[0]?.pesan ?? "Berkas tidak dapat dibaca.");
    }

    const hasil = await imporSuplemenUseCase(
      villageId,
      suplemenId,
      peta.baris.map((baris) => ({
        sasaran: baris.nilai.sasaran,
        isian: baris.tambahan,
      })),
    );

    revalidatePath(`${HALAMAN}/${suplemenId}`);
    const pesan = [
      `${hasil.ditambahkan} data berhasil diimpor.`,
      hasil.dilewati > 0 ? `${hasil.dilewati} baris dilewati karena sudah terdata.` : null,
      hasil.tidakDitemukan.length > 0
        ? `${hasil.tidakDitemukan.length} sasaran tidak ditemukan.`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    return successState(pesan, hasil, hasil.ditambahkan === 0 ? "warning" : undefined);
  } catch (error) {
    return toErrorState(error);
  }
}
