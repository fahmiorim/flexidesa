import { kirimNotifikasiWarga } from "@/features/notifikasi/application/kirim-notifikasi";
import { pesanNotifikasiPermohonan } from "@/features/pelayanan-persuratan/layanan-mandiri/domain/layanan-mandiri";
import { findWargaEmailByResident } from "@/features/pelayanan-persuratan/layanan-mandiri/infrastructure/layanan-mandiri-repository";

/**
 * Kirim notifikasi perubahan status permohonan lewat email dan/atau WhatsApp.
 *
 * Setiap percobaan dicatat pada `notifikasi_terkirim` sebagai bukti pengiriman.
 * Kegagalan provider tidak membatalkan perubahan status yang sudah tersimpan.
 */
export async function notifyPermohonanStatusChange(input: {
  villageId: number;
  residentId: number;
  noAntrian: string | null;
  statusLama: number;
  statusBaru: number;
  alasan?: string | null;
  noHpAktif?: string | null;
}): Promise<void> {
  const [email] = await Promise.all([findWargaEmailByResident(input.villageId, input.residentId)]);

  const nomor = input.noAntrian ?? "permohonan Anda";
  const pesan = pesanNotifikasiPermohonan({
    noAntrian: input.noAntrian,
    statusLama: input.statusLama,
    statusBaru: input.statusBaru,
    alasan: input.alasan,
  });

  await kirimNotifikasiWarga({
    villageId: input.villageId,
    residentId: input.residentId,
    jenis: "permohonan.status",
    subjek: `[Layanan Desa] Status Permohonan ${nomor}`,
    pesan,
    email,
    telepon: input.noHpAktif ?? null,
  });
}
