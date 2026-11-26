"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  createRentangUmurUseCase,
  deleteRentangUmurUseCase,
  listRentangUmurUseCase,
  updateRentangUmurUseCase,
} from "@/features/kependudukan/statistik/application/rentang-umur-use-cases";
import {
  BATAS_UMUR_MAKSIMAL,
  cariTumpangTindih,
  susunNamaRentang,
} from "@/features/kependudukan/statistik/domain/rentang-umur";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

const HALAMAN = "/statistik/rentang-umur";

function kembali(jenis: "pesan" | "galat", teks: string): never {
  redirect(`${HALAMAN}?${jenis}=${encodeURIComponent(teks)}`);
}

function pesanGalat(error: unknown): string {
  if (error instanceof Error && error.name === "ZodError") {
    const issue = (error as unknown as { issues?: Array<{ message?: string }> }).issues?.[0];
    return issue?.message ?? "Data rentang umur tidak valid.";
  }
  return error instanceof Error ? error.message : "Gagal menyimpan rentang umur.";
}

export async function simpanRentangUmurAction(formData: FormData): Promise<void> {
  const user = await requirePermission(RESOURCES.penduduk, "update");
  const villageId = await resolveVillageId(user);

  const idMentah = String(formData.get("id") ?? "").trim();
  const id = idMentah ? Number(idMentah) : null;
  const dari = Number(String(formData.get("dari") ?? "").trim());
  const sampaiMentah = String(formData.get("sampai") ?? "").trim();
  const sampai = sampaiMentah === "" ? null : Number(sampaiMentah);

  if (!Number.isInteger(dari) || dari < 0) {
    return kembali("galat", "Batas bawah harus bilangan bulat minimal 0.");
  }
  if (sampai !== null && (!Number.isInteger(sampai) || sampai < dari)) {
    return kembali(
      "galat",
      "Batas atas harus bilangan bulat dan tidak lebih kecil dari batas bawah.",
    );
  }
  if (sampai !== null && sampai > BATAS_UMUR_MAKSIMAL) {
    return kembali("galat", `Batas atas maksimal ${BATAS_UMUR_MAKSIMAL} tahun.`);
  }
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) {
    return kembali("galat", "Data rentang umur tidak ditemukan.");
  }

  let rows;
  try {
    rows = await listRentangUmurUseCase({ villageId });
  } catch (error) {
    return kembali("galat", pesanGalat(error));
  }

  const konflik = cariTumpangTindih(rows, { dari, sampai }, id);
  if (konflik) {
    return kembali(
      "galat",
      `Rentang ${dari}–${sampai ?? "tanpa batas"} bertumpang tindih dengan “${konflik.nama}”.`,
    );
  }

  const input = {
    nama: susunNamaRentang(dari, sampai),
    dari,
    sampai,
  };

  try {
    if (id === null) await createRentangUmurUseCase(villageId, input);
    else await updateRentangUmurUseCase(villageId, id, input);
  } catch (error) {
    return kembali("galat", pesanGalat(error));
  }

  revalidatePath(HALAMAN);
  revalidatePath("/kependudukan/statistik");
  return kembali(
    "pesan",
    id === null ? "Rentang umur berhasil ditambahkan." : "Rentang umur berhasil diperbarui.",
  );
}

export async function hapusRentangUmurAction(formData: FormData): Promise<void> {
  const user = await requirePermission(RESOURCES.penduduk, "delete");
  const villageId = await resolveVillageId(user);
  const id = Number(String(formData.get("id") ?? "").trim());

  if (!Number.isSafeInteger(id) || id <= 0) {
    return kembali("galat", "Data rentang umur tidak ditemukan.");
  }

  try {
    await deleteRentangUmurUseCase(villageId, id);
  } catch (error) {
    return kembali("galat", pesanGalat(error));
  }

  revalidatePath(HALAMAN);
  revalidatePath("/kependudukan/statistik");
  return kembali("pesan", "Rentang umur berhasil dihapus.");
}
