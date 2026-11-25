"use server";

import { revalidatePath } from "next/cache";

import { recordAuditEvent } from "@/features/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/audit/domain/audit";
import { resolveVillageId } from "@/features/desa/application/resolve-village";
import { PENDUDUK_RESOURCE } from "@/features/penduduk/domain/penduduk";
import {
  bacaBerkasImporPenduduk,
  buatTemplateImporPenduduk,
  namaBerkasTemplatePenduduk,
  validasiImporPenduduk,
  type KatalogImpor,
} from "@/features/penduduk/domain/penduduk-import";
import {
  findFamilyIdsInVillage,
  findNationalIdsInVillage,
  headOfFamilyExists,
  insertPendudukBatch,
} from "@/features/penduduk/infrastructure/penduduk-repository";
import { getPendudukReferenceData } from "@/features/penduduk/infrastructure/reference-repository";
import { pastikanWilayah } from "@/features/wilayah/infrastructure/wilayah-repository";
import { errorState, successState, toErrorState, type ActionState } from "@/lib/action-state";
import { requirePermission } from "@/lib/dal";

/** Ukuran maksimum berkas impor penduduk (5 MB). */
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

/** Ambil katalog + daftar KK desa untuk validasi dan template. */
async function ambilKatalogImpor(villageId: number): Promise<KatalogImpor> {
  const references = await getPendudukReferenceData(villageId);
  return {
    religions: references.religions,
    educations: references.educations,
    occupations: references.occupations,
    maritalStatuses: references.maritalStatuses,
    familyRelations: references.familyRelations,
    bloodTypes: references.bloodTypes,
    citizenships: references.citizenships,
    families: references.families.map((family) => ({
      id: family.id,
      number: family.label.replace(/^KK\s+/i, ""),
    })),
  };
}

/** Unduh template impor penduduk sesuai katalog desa aktif. */
export async function unduhTemplateImporPendudukAction(): Promise<{
  isi: Buffer;
  nama: string;
}> {
  const user = await requirePermission(PENDUDUK_RESOURCE, "create");
  const villageId = await resolveVillageId(user);
  const katalog = await ambilKatalogImpor(villageId);

  return {
    isi: await buatTemplateImporPenduduk(katalog),
    nama: namaBerkasTemplatePenduduk(),
  };
}

/**
 * Impor penduduk dari berkas CSV/XLSX.
 *
 * All-or-nothing: bila ada baris yang tidak valid, tidak ada data yang
 * disimpan. NIK boleh kosong (seperti formulir manual), tetapi NIK yang diisi
 * harus 16 angka dan belum terdaftar di desa ini.
 */
export async function imporPendudukAction(
  _state: ActionState<{ jumlah: number }>,
  formData: FormData,
): Promise<ActionState<{ jumlah: number }>> {
  const user = await requirePermission(PENDUDUK_RESOURCE, "create");
  const villageId = await resolveVillageId(user);

  const file = formData.get("berkas");
  const masalahBerkas = periksaBerkas(file);
  if (masalahBerkas !== null) return errorState(masalahBerkas);
  if (!(file instanceof File)) return errorState("Berkas belum dipilih.");

  try {
    const isi = Buffer.from(await file.arrayBuffer());
    const terbaca = await bacaBerkasImporPenduduk(isi, file.name);
    if (terbaca.baris.length === 0) {
      const pesan =
        terbaca.galat[0]?.pesan ??
        "Tidak ada baris data yang bisa dibaca. Pastikan baris pertama berisi header kolom.";
      return errorState(pesan);
    }
    if (terbaca.galat.length > 0) {
      return errorState(
        terbaca.galat[0]!.pesan,
        Object.fromEntries(terbaca.galat.map((item) => [`Baris ${item.baris}`, [item.pesan]])),
      );
    }

    const katalog = await ambilKatalogImpor(villageId);

    const kkIds = [
      ...new Set(
        terbaca.baris
          .map((row) => row.nilai.noKk.replace(/[^0-9]/g, ""))
          .filter((nomor) => nomor !== "")
          .map(
            (nomor) =>
              katalog.families.find((family) => family.number.replace(/[^0-9]/g, "") === nomor)?.id,
          )
          .filter((id): id is number => id !== undefined),
      ),
    ];

    // Pastikan KK yang dipakai memang milik desa ini (bukan id tenant lain).
    const kkValid = await findFamilyIdsInVillage(villageId, kkIds);
    if (kkIds.some((id) => !kkValid.has(id))) {
      return errorState("Ada nomor KK yang bukan milik desa ini. Periksa kembali berkas impor.");
    }

    const nikDiBerkas = terbaca.baris
      .map((row) => row.nilai.nik.replace(/[^0-9]/g, ""))
      .filter((nik) => nik !== "");
    const nikTerdaftar = await findNationalIdsInVillage(villageId, nikDiBerkas);

    const kkSudahAdaKepala = new Set<number>();
    for (const familyId of kkIds) {
      if (await headOfFamilyExists(villageId, familyId, null)) kkSudahAdaKepala.add(familyId);
    }

    const hasil = validasiImporPenduduk(terbaca.baris, {
      katalog,
      nikTerdaftar,
      kkSudahAdaKepala,
    });

    if (hasil.galat.length > 0) {
      const fieldErrors = Object.fromEntries(
        hasil.galat.slice(0, 20).map((item) => [`Baris ${item.baris}`, [item.pesan]]),
      );
      return errorState(
        `${hasil.galat.length} baris bermasalah. Tidak ada data yang diimpor; perbaiki berkas lalu unggah ulang.`,
        fieldErrors,
      );
    }

    // Kolom dusun/RW/RT pada berkas SID berupa teks. Petakan ke wilayah desa
    // ini, atau buat wilayah baru bila kombinasi tersebut belum terdaftar.
    const wilayahCache = new Map<string, number>();
    for (const item of hasil.siap) {
      if (!item.wilayah) continue;
      const { dusun, rw, rt } = item.wilayah;
      const kunci = `${dusun}\u0000${rw}\u0000${rt}`;
      let regionId = wilayahCache.get(kunci);
      if (regionId === undefined) {
        regionId = await pastikanWilayah(villageId, dusun, rw, rt);
        wilayahCache.set(kunci, regionId);
      }
      item.input.regionId = regionId;
    }

    const ids = await insertPendudukBatch(
      villageId,
      hasil.siap.map((item) => item.input),
    );

    await recordAuditEvent({
      villageId,
      actorId: user.id,
      event: AUDIT_EVENTS.pendudukImport,
      resource: PENDUDUK_RESOURCE,
      resourceId: null,
      details: { jumlah: ids.length, berkas: file.name },
    });

    revalidatePath("/penduduk");
    revalidatePath("/keluarga");
    revalidatePath("/mutasi-penduduk");

    return successState(`${ids.length} data penduduk berhasil diimpor.`, { jumlah: ids.length });
  } catch (error) {
    return toErrorState(error);
  }
}
