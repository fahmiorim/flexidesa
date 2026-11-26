"use server";

import { revalidatePath } from "next/cache";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { RUMAH_TANGGA_RESOURCE } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import {
  KOLOM_IMPOR_RTM,
  namaBerkasTemplateRtm,
  rencanaImporRtm,
  templateImporRtm,
} from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga-impor";
import {
  findPendudukByNiks,
  imporRumahTangga as imporRumahTanggaRows,
  listNomorRtm,
} from "@/features/kependudukan/rumah-tangga/infrastructure/rumah-tangga-repository";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";
import { requirePermission } from "@/lib/dal";
import { bacaTabelImpor, petakanKolom } from "@/lib/spreadsheet";

/** Ukuran maksimum berkas impor RTM (5 MB). */
const MAKS_UKURAN_BERKAS = 5 * 1024 * 1024;

/** Ekstensi berkas yang diterima. */
const EKSTENSI_DITERIMA = [".csv", ".txt", ".xlsx"];

function periksaBerkas(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File)) return "Berkas belum dipilih.";
  if (file.size === 0) return "Berkas kosong.";
  if (file.size > MAKS_UKURAN_BERKAS) return "Ukuran berkas maksimal 5 MB.";
  const nama = file.name.toLowerCase();
  if (!EKSTENSI_DITERIMA.some((ekstensi) => nama.endsWith(ekstensi))) {
    return "Format berkas tidak didukung. Gunakan .xlsx atau .csv.";
  }
  return null;
}

/** Unduh template impor RTM. */
export async function unduhTemplateImporRtm(): Promise<{ isi: string; nama: string }> {
  const user = await requirePermission(RUMAH_TANGGA_RESOURCE, "create");
  await resolveVillageId(user);
  return { isi: templateImporRtm(), nama: namaBerkasTemplateRtm() };
}

/**
 * Impor pengelompokan RTM dari berkas CSV/XLSX (paritas OpenSID).
 *
 * All-or-nothing: bila ada baris yang tidak valid, tidak ada data yang
 * disimpan. Nomor RTM yang belum ada dibuatkan RTM baru; penduduk ditautkan
 * menurut tingkatnya (1 = kepala, 2 = anggota).
 */
export async function imporRumahTanggaAction(
  _state: ActionState<{ dihubungkan: number }>,
  formData: FormData,
): Promise<ActionState<{ dihubungkan: number }>> {
  const user = await requirePermission(RUMAH_TANGGA_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const file = formData.get("berkas");
  const masalahBerkas = periksaBerkas(file);
  if (masalahBerkas !== null) return errorState(masalahBerkas);
  if (!(file instanceof File)) return errorState("Berkas belum dipilih.");

  try {
    const isi = Buffer.from(await file.arrayBuffer());
    const tabel = await bacaTabelImpor(isi, file.name);
    const terbaca = petakanKolom(tabel, KOLOM_IMPOR_RTM);

    if (terbaca.galat.length > 0 && terbaca.baris.length === 0) {
      return errorState(terbaca.galat[0]?.pesan ?? "Tidak ada baris data yang bisa dibaca.");
    }
    if (terbaca.baris.length === 0) {
      return errorState("Tidak ada baris data pada berkas impor.");
    }

    const niks = terbaca.baris.map((row) => row.nilai.nik.replace(/[^0-9]/g, ""));
    const [penduduk, nomorExisting] = await Promise.all([
      findPendudukByNiks(villageId, niks),
      listNomorRtm(villageId),
    ]);

    const rencana = rencanaImporRtm(
      terbaca.baris.map((row) => ({ baris: row.baris, nilai: row.nilai })),
      penduduk,
      nomorExisting,
    );

    const galat = [...terbaca.galat, ...rencana.galat];
    if (galat.length > 0) {
      const fieldErrors = Object.fromEntries(
        galat.slice(0, 20).map((item) => [`Baris ${item.baris}`, [item.pesan]]),
      );
      return errorState(
        `${galat.length} baris bermasalah. Tidak ada data yang diimpor; perbaiki berkas lalu unggah ulang.`,
        fieldErrors,
      );
    }

    const hasil = await imporRumahTanggaRows(villageId, rencana.siap);

    revalidatePath("/kependudukan/rumah-tangga");
    revalidatePath("/kependudukan/penduduk");
    revalidatePath("/kependudukan/keluarga");

    return successState(
      `Impor selesai: ${hasil.dihubungkan} penduduk ditautkan ke ${hasil.dibuatRtm} rumah tangga baru.`,
      { dihubungkan: hasil.dihubungkan },
    );
  } catch (error) {
    return toErrorState(error);
  }
}
