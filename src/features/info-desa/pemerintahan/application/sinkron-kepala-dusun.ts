import "server-only";

import {
  getJabatanBySlug,
  insertJabatan,
  updateJabatan,
} from "@/features/info-desa/pemerintahan/infrastructure/jabatan-repository";
import {
  getKepalaDesaAktifId,
  getMaxUrutPerangkat,
  getPerangkatByWilayah,
  insertPerangkat,
  listJabatanRingkas,
  updatePerangkat,
} from "@/features/info-desa/pemerintahan/infrastructure/perangkat-repository";

/** Masukan sinkronisasi satu baris wilayah ke data aparat desa. */
export interface InputSinkronKepalaDusun {
  villageId: number;
  wilayahId: number;
  /** Nama dusun pada baris wilayah, dipakai menyusun nama jabatan. */
  dusun: string;
  kepalaResidentId: number | null;
  namaKepala: string | null;
  /** `false` bila baris bukan lagi tingkat dusun (mis. berubah menjadi RW/RT). */
  kepalaDusun: boolean;
}

/** Slug jabatan kepala dusun; dibatasi 100 karakter sesuai kolom `slug`. */
export function slugJabatanKepalaDusun(dusun: string) {
  const slug = dusun
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `kepala-dusun-${slug || "wilayah"}`.slice(0, 100);
}

/**
 * Memastikan jabatan "Kepala Dusun <dusun>" tersedia.
 *
 * Bila dusun diganti nama, jabatan lama yang sudah tertaut ikut diubah agar
 * master jabatan tidak menumpuk. Bila slug baru ternyata sudah dipakai, jabatan
 * yang ada dipakai ulang sehingga dua dusun tidak berbagi satu master jabatan
 * dengan nama berbeda.
 */
async function pastikanJabatanKepalaDusun(
  villageId: number,
  dusun: string,
  jabatanTertaut: { id: number; tupoksi: string | null; urut: number } | null,
) {
  const slug = slugJabatanKepalaDusun(dusun);
  const sudahAda = await getJabatanBySlug(villageId, slug);
  if (sudahAda) return sudahAda.id;

  const nama = `Kepala Dusun ${dusun}`.trim().slice(0, 100);
  if (jabatanTertaut) {
    await updateJabatan(villageId, jabatanTertaut.id, {
      nama,
      slug,
      jenis: "lainnya",
      tupoksi: jabatanTertaut.tupoksi,
      urut: jabatanTertaut.urut,
    });
    return jabatanTertaut.id;
  }

  const jabatan = await listJabatanRingkas(villageId);
  const urut = (jabatan.at(-1)?.urut ?? 0) + 1;
  return insertJabatan(villageId, {
    nama,
    slug,
    jenis: "lainnya",
    tupoksi: null,
    urut,
  });
}

/**
 * Menyelaraskan data aparat dengan penunjukan kepala wilayah.
 *
 * Aturan yang dipakai:
 * - Hanya tingkat dusun yang menjadi aparat; ketua RW/RT tetap tercatat pada
 *   wilayah saja (sama seperti OpenSID yang memisahkan pamong dan wilayah).
 * - Kepala wilayah harus tertaut ke penduduk desa; nama teks tanpa penduduk
 *   tidak cukup untuk membuat aparat.
 * - Bila kepala diganti, baris aparat yang sama diperbarui sehingga riwayat
 *   lain (foto, NIP, SK) tidak hilang.
 * - Bila kepala dikosongkan atau wilayah tidak lagi berupa dusun, aparat
 *   dinonaktifkan, bukan dihapus.
 */
export async function sinkronkanKepalaDusun(input: InputSinkronKepalaDusun) {
  const tertaut = await getPerangkatByWilayah(input.villageId, input.wilayahId);
  const aktif = input.kepalaDusun && input.kepalaResidentId !== null;

  if (!aktif) {
    if (tertaut) {
      await updatePerangkat(input.villageId, tertaut.id, {
        status: "nonaktif",
        ...(input.kepalaDusun ? {} : { wilayahId: null }),
      });
    }
    return;
  }

  const jabatanLama = tertaut?.jabatanId
    ? ((await listJabatanRingkas(input.villageId)).find(
        (item: { id: number }) => item.id === tertaut.jabatanId,
      ) ?? null)
    : null;
  const jabatanId = await pastikanJabatanKepalaDusun(input.villageId, input.dusun, jabatanLama);
  const nama = input.namaKepala?.trim() || `Kepala Dusun ${input.dusun}`;
  // Kepala dusun berada langsung di bawah Kepala Desa pada bagan organisasi.
  const kadesId = await getKepalaDesaAktifId(input.villageId);

  if (tertaut) {
    await updatePerangkat(input.villageId, tertaut.id, {
      nama,
      residentId: input.kepalaResidentId,
      jabatanId,
      status: "aktif",
      ...(tertaut.atasanId === null && kadesId ? { atasanId: kadesId } : {}),
    });
    return;
  }

  await insertPerangkat(input.villageId, {
    nama,
    residentId: input.kepalaResidentId,
    jabatanId,
    wilayahId: input.wilayahId,
    atasanId: kadesId,
    status: "aktif",
    kehadiran: true,
    urut: (await getMaxUrutPerangkat(input.villageId)) + 1,
  });
}
