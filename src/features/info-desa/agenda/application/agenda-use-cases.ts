import "server-only";

import {
  rentangBulanAgenda,
  type AgendaPublikRow,
  type AgendaRow,
} from "@/features/info-desa/agenda/domain/agenda";
import {
  getAgendaPublikById,
  listAgendaPublik,
  listAgendaPublikRentang,
} from "@/features/info-desa/agenda/infrastructure/agenda-repository";

/** Buang kolom internal sebelum data dikirim ke halaman publik. */
function keAgendaPublik({
  id,
  judul,
  mulai,
  selesai,
  jamMulai,
  jamSelesai,
  kategori,
  status,
  lokasi,
  deskripsi,
}: AgendaRow): AgendaPublikRow {
  return {
    id,
    judul,
    mulai,
    selesai,
    jamMulai,
    jamSelesai,
    kategori,
    status,
    lokasi,
    deskripsi,
  };
}

/** Agenda mendatang untuk situs publik; hanya baris yang ditayangkan. */
export async function agendaMendatang(villageId: number, limit = 20): Promise<AgendaPublikRow[]> {
  const rows = await listAgendaPublik(villageId, limit);
  return rows.map(keAgendaPublik);
}

/**
 * Agenda publik satu bulan kalender, termasuk bulan yang sudah lewat.
 *
 * Dipakai kalender publik agar arsip kegiatan tetap dapat dilihat, tanpa
 * membatasi ke agenda mendatang atau memotong jumlah baris per bulan.
 */
export async function agendaBulan(
  villageId: number,
  tahun: number,
  bulan: number,
): Promise<AgendaPublikRow[]> {
  const { mulai, selesai } = rentangBulanAgenda(tahun, bulan);
  const rows = await listAgendaPublikRentang(villageId, mulai, selesai);
  return rows.map(keAgendaPublik);
}

/** Detail agenda yang sudah ditayangkan oleh tenant aktif. */
export async function detailAgendaPublik(
  villageId: number,
  id: number,
): Promise<AgendaPublikRow | null> {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const row = await getAgendaPublikById(villageId, id);
  return row ? keAgendaPublik(row) : null;
}
