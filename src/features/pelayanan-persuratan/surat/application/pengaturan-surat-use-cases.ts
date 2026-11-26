import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { validasiMediaIdentitas } from "@/features/info-desa/identitas-desa/application/validasi-media";
import { simpanBerkasMedia } from "@/features/info-desa/publik/application/simpan-berkas-media";
import { hapusMedia } from "@/features/media/infrastructure/media-storage";
import {
  bacaPengaturan,
  simpanPengaturanTenant,
} from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import type { Pengaturan } from "@/features/pengaturan/pengaturan/domain/pengaturan";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { validationError } from "@/lib/errors";

import { skemaPengaturanSurat } from "../domain/pengaturan-surat";
import { getKonfigurasiTtePageData, type KonfigurasiTtePageData } from "./tte-use-cases";

export interface PengaturanSuratPageData {
  pengaturan: Pengaturan;
  canManage: boolean;
  /** Konfigurasi TTE; `null` bila role tidak berwenang membacanya. */
  tte: KonfigurasiTtePageData | null;
}

/** Data halaman Pengaturan Surat (izin baca `jenis-surat`). */
export async function getPengaturanSuratPageData(): Promise<PengaturanSuratPageData> {
  const user = await requirePermission(RESOURCES.jenisSurat, "read");
  const villageId = await resolveVillageId(user);
  const pengaturan = await bacaPengaturan(villageId);

  const bolehTte = hasPermission(user.permissions, RESOURCES.tte, "read");
  const tte = bolehTte ? await getKonfigurasiTtePageData() : null;

  return {
    pengaturan,
    canManage: hasPermission(user.permissions, RESOURCES.jenisSurat, "update"),
    tte,
  };
}

/**
 * Simpan pengaturan global surat.
 *
 * Patch digabung dengan pengaturan tersimpan supaya kunci lain pada tabel
 * `pengaturan_desa` tidak ikut dikembalikan ke nilai bawaan.
 */
export async function simpanPengaturanSuratData(
  input: unknown,
  logo?: { berkas: File | null; hapus: boolean },
): Promise<Pengaturan> {
  const user = await requirePermission(RESOURCES.jenisSurat, "update");
  const villageId = await resolveVillageId(user);

  const parsed = skemaPengaturanSurat.safeParse(input);
  if (!parsed.success) {
    const pesan = parsed.error.issues[0]?.message ?? "Pengaturan surat tidak valid.";
    throw validationError(pesan);
  }

  const tersimpan = await bacaPengaturan(villageId);
  let suratLogo = tersimpan.suratLogo;
  let berkasLama: string | null = null;

  // Logo kop hanya berubah melalui unggahan/hapus yang divalidasi server.
  if (logo?.berkas) {
    const berkas = logo.berkas;
    const cek = validasiMediaIdentitas("logo", berkas.type, berkas.size);
    if (!cek.ok) throw validationError(cek.pesan, { logo: [cek.pesan] });

    suratLogo = await simpanBerkasMedia(
      villageId,
      {
        nama: berkas.name,
        mime: berkas.type,
        ukuran: berkas.size,
        isi: new Uint8Array(await berkas.arrayBuffer()),
      },
      "umum",
      "logo",
    );
    berkasLama = tersimpan.suratLogo;
  } else if (logo?.hapus && tersimpan.suratLogo) {
    suratLogo = "";
    berkasLama = tersimpan.suratLogo;
  }

  const hasil = await simpanPengaturanTenant(
    villageId,
    { ...tersimpan, ...parsed.data, suratLogo },
    user.id,
  );

  // Bersihkan berkas logo lama setelah pengaturan baru tersimpan.
  if (berkasLama && berkasLama !== suratLogo) {
    await hapusMedia(berkasLama).catch(() => undefined);
  }

  return hasil;
}
