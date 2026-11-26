/**
 * Kontrak permohonan layanan untuk fitur persuratan.
 *
 * Surat perlu mengetahui permohonan yang menautkan suratnya dan menyinkronkan
 * status setelah terbit/ditolak. Operasi itu milik Layanan Mandiri, sehingga
 * batasnya dijaga berkas ini.
 */
export {
  findPermohonanByLetterId,
  sinkronStatusSuratPermohonan,
} from "../infrastructure/layanan-mandiri-repository";
