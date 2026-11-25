import { validationError } from "@/lib/errors";

export type MasterLembagaInput = {
  nama: string;
  deskripsi?: string | null;
};

export type ProfilLembagaInput = {
  nama: string;
  kode?: string | null;
  deskripsi?: string | null;
  noSkPendirian?: string | null;
};

export type AnggotaLembagaInput = {
  residentId?: number | null;
  nomorAnggota?: string | null;
  nomorSkJabatan?: string | null;
  nomorSkPengangkatan?: string | null;
  tanggalSkPengangkatan?: string | null;
  nomorSkPemberhentian?: string | null;
  tanggalSkPemberhentian?: string | null;
  periode?: string | null;
  keterangan?: string | null;
};

export function validasiMasterLembaga(input: MasterLembagaInput): void {
  if (!input.nama.trim()) throw validationError("Nama kategori wajib diisi.");
  if (input.nama.trim().length > 50) throw validationError("Nama kategori maksimal 50 karakter.");
  // OpenSID membatasi deskripsi kategori 400 karakter.
  if ((input.deskripsi?.length ?? 0) > 400)
    throw validationError("Deskripsi kategori maksimal 400 karakter.");
}

export function validasiProfilLembaga(input: ProfilLembagaInput): void {
  if (!input.nama.trim()) throw validationError("Nama lembaga wajib diisi.");
  if (input.nama.trim().length > 50) throw validationError("Nama lembaga maksimal 50 karakter.");
  if (!input.kode?.trim()) throw validationError("Kode lembaga wajib diisi.");
  if (input.kode.trim().length > 16) throw validationError("Kode lembaga maksimal 16 karakter.");
  if ((input.deskripsi?.length ?? 0) > 300)
    throw validationError("Deskripsi maksimal 300 karakter.");
}

export function validasiAnggotaLembaga(input: AnggotaLembagaInput): void {
  if (!input.residentId || !Number.isSafeInteger(input.residentId) || input.residentId < 1) {
    throw validationError("Penduduk anggota wajib dipilih.");
  }
  if ((input.nomorAnggota?.length ?? 0) > 20)
    throw validationError("Nomor anggota maksimal 20 karakter.");
  if ((input.keterangan?.length ?? 0) > 300)
    throw validationError("Keterangan anggota maksimal 300 karakter.");
}
