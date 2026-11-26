import "server-only";

/**
 * Query agenda kegiatan (admin).
 *
 * Seluruh fungsi wajib menerima `villageId` dari sesi sehingga tidak ada
 * data yang bocor antar-desa.
 */

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { agendaKegiatan } from "@/db/schema";

export async function listAgendaAdmin(villageId: number, limit = 100) {
  return db
    .select({
      id: agendaKegiatan.id,
      judul: agendaKegiatan.judul,
      mulai: agendaKegiatan.mulai,
      selesai: agendaKegiatan.selesai,
      jamMulai: agendaKegiatan.jamMulai,
      jamSelesai: agendaKegiatan.jamSelesai,
      kategori: agendaKegiatan.kategori,
      status: agendaKegiatan.status,
      lokasi: agendaKegiatan.lokasi,
      deskripsi: agendaKegiatan.deskripsi,
      tayang: agendaKegiatan.tayang,
    })
    .from(agendaKegiatan)
    .where(eq(agendaKegiatan.villageId, villageId))
    .orderBy(desc(agendaKegiatan.mulai))
    .limit(limit);
}

export async function buatAgenda(
  villageId: number,
  data: {
    judul: string;
    mulai: string;
    selesai: string | null;
    jamMulai: string | null;
    jamSelesai: string | null;
    kategori: string;
    lokasi: string | null;
    deskripsi: string | null;
    tayang: boolean;
  },
) {
  await db.insert(agendaKegiatan).values({ villageId, status: "rencana", ...data });
}

export async function ubahStatusAgenda(villageId: number, id: number, tayang: boolean) {
  await db
    .update(agendaKegiatan)
    .set({ tayang })
    .where(and(eq(agendaKegiatan.villageId, villageId), eq(agendaKegiatan.id, id)));
}

export async function hapusAgenda(villageId: number, id: number) {
  await db
    .delete(agendaKegiatan)
    .where(and(eq(agendaKegiatan.villageId, villageId), eq(agendaKegiatan.id, id)));
}

export async function cariAgendaById(villageId: number, id: number) {
  const [row] = await db
    .select({ id: agendaKegiatan.id })
    .from(agendaKegiatan)
    .where(and(eq(agendaKegiatan.villageId, villageId), eq(agendaKegiatan.id, id)))
    .limit(1);
  return row;
}

export async function ubahAgenda(
  villageId: number,
  id: number,
  data: {
    judul: string;
    mulai: string;
    selesai: string | null;
    jamMulai: string | null;
    jamSelesai: string | null;
    kategori: string;
    lokasi: string | null;
    deskripsi: string | null;
  },
) {
  await db
    .update(agendaKegiatan)
    .set(data)
    .where(and(eq(agendaKegiatan.villageId, villageId), eq(agendaKegiatan.id, id)));
}

/* ---------------------------------------------------------------- album */
