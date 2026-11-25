"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deleteLaporanPendudukBanyakUseCase,
  deleteLaporanPendudukUseCase,
  saveLaporanPenduduk,
} from "@/features/statistik/application/laporan-penduduk-use-cases";

const RUTE = "/statistik/laporan-penduduk";

function angkaDari(formData: FormData, kunci: string): number {
  const nilai = Number(formData.get(kunci));
  if (!Number.isInteger(nilai) || nilai < 1) throw new Error("ID laporan tidak valid.");
  return nilai;
}

/** Tambah arsip baru atau ubah arsip yang sudah ada (berkas opsional saat ubah). */
export async function simpanLaporanPendudukAction(formData: FormData): Promise<void> {
  const idRaw = formData.get("id");
  const id = idRaw === null || idRaw === "" ? undefined : angkaDari(formData, "id");

  const berkas = formData.get("berkas");
  const adaBerkas = berkas instanceof File && berkas.size > 0;

  const hasil = await saveLaporanPenduduk({
    metadata: {
      judul: formData.get("judul"),
      tahun: formData.get("tahun"),
      bulan: formData.get("bulan"),
    },
    berkas: adaBerkas
      ? {
          nama: berkas.name,
          tipe: berkas.type,
          isi: new Uint8Array(await berkas.arrayBuffer()),
        }
      : null,
    id,
  });

  revalidatePath(RUTE);
  redirect(`${RUTE}?${id === undefined ? "tersimpan" : "diperbarui"}=${hasil.id}`);
}

/** Hapus satu laporan beserta berkasnya. */
export async function hapusLaporanPendudukAction(formData: FormData): Promise<void> {
  await deleteLaporanPendudukUseCase(angkaDari(formData, "id"));
  revalidatePath(RUTE);
  redirect(`${RUTE}?dihapus=1`);
}

/** Hapus massal sesuai ceklist, mengikuti tombol Hapus OpenSID. */
export async function hapusMassalLaporanPendudukAction(formData: FormData): Promise<void> {
  const ids = formData
    .getAll("id_cb")
    .map((nilai) => Number(nilai))
    .filter((nilai) => Number.isInteger(nilai) && nilai > 0);

  const { jumlah } = await deleteLaporanPendudukBanyakUseCase(ids);
  revalidatePath(RUTE);
  redirect(`${RUTE}?dihapus=${jumlah}`);
}
