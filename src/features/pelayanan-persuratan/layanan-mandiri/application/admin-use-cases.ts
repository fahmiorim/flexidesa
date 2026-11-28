import "server-only";

import { getIdentitasDesa } from "@/features/info-desa/desa/application/kontrak";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { bacaMedia, hapusMedia } from "@/features/media/infrastructure/media-storage";
import { cocokAntreanNotifikasi } from "@/features/notifikasi/domain/notifikasi";
import { listNotifikasiPermohonan } from "@/features/notifikasi/infrastructure/notifikasi-repository";
import { notifyPermohonanStatusChange } from "@/features/pelayanan-persuratan/layanan-mandiri/application/notification";
import {
  parseBerkasSyarat,
  type BerkasSyarat,
} from "@/features/pelayanan-persuratan/layanan-mandiri/domain/layanan-mandiri";
import {
  buildPermohonanCsv,
  namaBerkasPermohonan,
  ringkasPermohonanPerJenis,
  saringPermohonan,
  type FilterPermohonan,
} from "@/features/pelayanan-persuratan/layanan-mandiri/domain/permohonan-berkas";
import {
  getPermohonan,
  hapusPermohonan,
  listPermohonan,
  prosesPermohonan,
  tautkanSuratPermohonan,
} from "@/features/pelayanan-persuratan/layanan-mandiri/infrastructure/layanan-mandiri-repository";
import { createSuratDraftData } from "@/features/pelayanan-persuratan/surat/application/daftar-surat";
import { ajukanVerifikasiSuratData } from "@/features/pelayanan-persuratan/surat/application/verifikasi";
import { parseNilaiIsian } from "@/features/pelayanan-persuratan/surat/domain/isian";
import { SURAT_RESOURCE } from "@/features/pelayanan-persuratan/surat/domain/surat";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { conflict, notFound, validationError } from "@/lib/errors";

/**
 * Daftar permohonan untuk operator (sudah tersaring desa sesi).
 *
 * `canManage` dipakai UI untuk menyembunyikan tombol proses bagi peran yang
 * hanya punya akses `read` (mis. sekdes/kades). Otorisasi sebenarnya tetap
 * ditegakkan di use case mutasi (`requirePermission(..., "update")`).
 */
export async function getPermohonanAdminData(filter: FilterPermohonan = {}) {
  const user = await requirePermission(RESOURCES.permohonanSurat, "read");
  const villageId = await resolveVillageId(user);
  const semua = await listPermohonan(villageId);
  const permohonan = saringPermohonan(semua, filter);

  const jenis = new Map<number, string>();
  for (const row of semua) {
    jenis.set(row.idSurat, row.namaSurat?.trim() || `Jenis #${row.idSurat}`);
  }

  return {
    permohonan,
    rekapJenis: ringkasPermohonanPerJenis(permohonan),
    jenis: [...jenis.entries()]
      .map(([id, nama]) => ({ id, nama }))
      .sort((a, b) => a.nama.localeCompare(b.nama)),
    canManage: hasPermission(user.permissions, RESOURCES.permohonanSurat, "update"),
    canDelete: hasPermission(user.permissions, RESOURCES.permohonanSurat, "delete"),
  };
}

/** Detail permohonan satu tenant untuk panel pemeriksaan operator. */
export async function getPermohonanAdminDetailData(id: number) {
  const user = await requirePermission(RESOURCES.permohonanSurat, "read");
  const villageId = await resolveVillageId(user);
  const rows = await listPermohonan(villageId);
  const permohonan = rows.find((row) => row.id === id);

  if (!permohonan) throw notFound("Permohonan tidak ditemukan.");

  // Bukti notifikasi status terakhir untuk permohonan ini (email/WhatsApp).
  // Tabel bukti tidak menaut ke permohonan secara langsung, jadi baris
  // disaring lewat nomor antrean pada subjek/pesan.
  const semuaNotifikasi = await listNotifikasiPermohonan(villageId, permohonan.idPemohon);
  const notifikasi = semuaNotifikasi.filter((row) =>
    cocokAntreanNotifikasi(row, permohonan.noAntrian),
  );

  return {
    permohonan,
    berkas: parseBerkasSyarat(permohonan.syarat),
    notifikasi,
    notifikasiTerakhir: notifikasi[0] ?? null,
    canManage: hasPermission(user.permissions, RESOURCES.permohonanSurat, "update"),
    canDelete: hasPermission(user.permissions, RESOURCES.permohonanSurat, "delete"),
    canCreateLetter:
      hasPermission(user.permissions, RESOURCES.permohonanSurat, "update") &&
      hasPermission(user.permissions, SURAT_RESOURCE, "update"),
  };
}

/** Data ekspor CSV rekap permohonan (mengikuti filter yang aktif). */
export async function eksporPermohonanData(filter: FilterPermohonan = {}) {
  const user = await requirePermission(RESOURCES.permohonanSurat, "read");
  const villageId = await resolveVillageId(user);

  const [semua, desa] = await Promise.all([listPermohonan(villageId), getIdentitasDesa(villageId)]);
  const rows = saringPermohonan(semua, filter);

  const labelFilter = [
    filter.dari || filter.sampai
      ? `Tanggal ${filter.dari ?? "awal"} s.d. ${filter.sampai ?? "akhir"}`
      : null,
    filter.typeId !== undefined
      ? `Jenis ${semua.find((row) => row.idSurat === filter.typeId)?.namaSurat ?? filter.typeId}`
      : null,
    filter.status !== undefined
      ? `Status ${Array.isArray(filter.status) ? filter.status.join(", ") : filter.status}`
      : null,
  ]
    .filter((item): item is string => item !== null)
    .join(" · ");

  return {
    csv: buildPermohonanCsv({ namaDesa: desa?.namaDesa ?? null, rows, filter: labelFilter }),
    filename: namaBerkasPermohonan(desa?.namaDesa ?? null),
  };
}

/** Isi berkas syarat milik permohonan, untuk route unduhan operator. */
export async function bacaBerkasSyaratAdmin(
  permohonanId: number,
  syaratId: number,
): Promise<{ isi: Buffer; mime: string; namaAsli: string }> {
  const berkas = await getBerkasSyaratAdminData(permohonanId, syaratId);
  const isi = await bacaMedia(berkas.berkas);
  return { isi, mime: berkas.mime, namaAsli: berkas.namaAsli };
}

/** Berkas syarat milik permohonan, untuk route unduhan operator. */
export async function getBerkasSyaratAdminData(
  permohonanId: number,
  syaratId: number,
): Promise<BerkasSyarat> {
  const user = await requirePermission(RESOURCES.permohonanSurat, "read");
  const villageId = await resolveVillageId(user);
  const permohonan = await getPermohonan(villageId, permohonanId);

  if (!permohonan) throw notFound("Permohonan tidak ditemukan.");
  const item = parseBerkasSyarat(permohonan.syarat).find((row) => row.id === syaratId);
  if (!item) throw notFound("Berkas syarat tidak ditemukan.");
  return item;
}

/**
 * Buat konsep surat dari permohonan, hubungkan, lalu ajukan verifikasi.
 *
 * Surat tetap melewati alur verifikasi operator → sekdes → kades yang sudah
 * ada. Permohonan berstatus 2 selama surat menunggu verifikasi, lalu berubah
 * menjadi 3 saat Kades menerbitkan (lihat sinkronisasi di use case persuratan).
 */
export async function buatKonsepSuratPermohonanData(permohonanId: number): Promise<{ id: number }> {
  const user = await requirePermission(RESOURCES.permohonanSurat, "create");
  const villageId = await resolveVillageId(user);
  const permohonan = await getPermohonan(villageId, permohonanId);

  if (!permohonan) throw notFound("Permohonan tidak ditemukan.");
  if (permohonan.status !== 1) {
    throw conflict("Konsep surat hanya dapat dibuat saat permohonan sedang diperiksa.");
  }
  if (permohonan.letterId !== null) {
    throw conflict("Permohonan ini sudah memiliki surat.");
  }

  const isiSurat = parseNilaiIsian(permohonan.isianForm);
  const purpose =
    permohonan.keterangan?.trim() ||
    `Permohonan surat ${permohonan.noAntrian ?? `#${permohonan.id}`}`;

  const surat = await createSuratDraftData({
    typeId: permohonan.letterTypeId,
    residentId: permohonan.residentId,
    letterDate: new Date().toISOString().slice(0, 10),
    purpose: purpose.slice(0, 255),
    isiSurat,
  });

  await tautkanSuratPermohonan(villageId, permohonan.id, surat.id);
  // Jalur permohonan tidak butuh konfirmasi syarat ulang: warga sudah wajib
  // mengunggah semua berkas syarat sebelum permohonan bisa diperiksa.
  await ajukanVerifikasiSuratData(surat.id, true);

  return surat;
}

/** Ubah status permohonan dengan validasi transisi di domain/repository. */
export async function ubahStatusPermohonanData(
  id: number,
  status: number,
  alasan = "",
): Promise<void> {
  const user = await requirePermission(RESOURCES.permohonanSurat, "update");
  const villageId = await resolveVillageId(user);

  if ((status === 0 || status === 5) && alasan.trim() === "") {
    throw validationError("Alasan wajib diisi saat mengembalikan atau membatalkan permohonan.");
  }

  const sebelum = await getPermohonan(villageId, id);
  if (!sebelum) throw notFound("Permohonan tidak ditemukan.");

  await prosesPermohonan(villageId, id, status, alasan.trim() || undefined);

  if (sebelum.status !== status) {
    await notifyPermohonanStatusChange({
      villageId,
      residentId: sebelum.residentId,
      noAntrian: sebelum.noAntrian,
      statusLama: sebelum.status,
      statusBaru: status,
      alasan: alasan.trim() || null,
      noHpAktif: sebelum.noHpAktif,
    });
  }
}

/**
 * Hapus permohonan yang sudah dibatalkan.
 *
 * Berkas syarat yang tersimpan di media privat ikut dibersihkan agar tidak
 * menjadi sampah penyimpanan. Permohonan aktif tidak boleh dihapus supaya
 * riwayat layanan warga tetap utuh.
 */
export async function hapusPermohonanAdminData(id: number): Promise<void> {
  const user = await requirePermission(RESOURCES.permohonanSurat, "delete");
  const villageId = await resolveVillageId(user);

  const permohonan = await getPermohonan(villageId, id);
  if (!permohonan) throw notFound("Permohonan tidak ditemukan.");
  if (permohonan.status !== 5) {
    throw conflict("Hanya permohonan berstatus dibatalkan yang dapat dihapus.");
  }

  const berkas = parseBerkasSyarat(permohonan.syarat);
  await hapusPermohonan(villageId, id);

  for (const item of berkas) {
    // Berkas bisa sudah tidak ada di disk; kegagalan bersih-bersih tidak
    // boleh membatalkan penghapusan data yang sudah selesai.
    await hapusMedia(item.berkas).catch(() => undefined);
  }
}

/**
 * Hapus beberapa permohonan batal sekaligus (aksi massal seperti daftar data
 * lain). Hanya status dibatalkan yang disentuh; sisanya dilewati.
 */
export async function hapusPermohonanMassalData(
  ids: readonly number[],
): Promise<{ jumlah: number }> {
  const user = await requirePermission(RESOURCES.permohonanSurat, "delete");
  const villageId = await resolveVillageId(user);

  const unik = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);
  let jumlah = 0;

  for (const id of unik) {
    const permohonan = await getPermohonan(villageId, id);
    if (!permohonan || permohonan.status !== 5) continue;

    const berkas = parseBerkasSyarat(permohonan.syarat);
    await hapusPermohonan(villageId, id);

    for (const item of berkas) {
      await hapusMedia(item.berkas).catch(() => undefined);
    }
    jumlah += 1;
  }

  return { jumlah };
}

/** Kembalikan permohonan ke status 0 dengan alasan. */
