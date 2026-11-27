import "server-only";

/**
 * Use case master pegawai, riwayat, dan dokumen pegawai.
 *
 * Master pegawai beserta sinkronisasi dari aparatur desa, riwayat
 * kepangkatan/jabatan, dokumen pegawai, dan pembacaan berkas kepegawaian.
 */

import {
  deleteDokumenPegawai,
  deleteRiwayatPegawai,
  getDokumenPegawai,
  getPegawai,
  getPegawaiByEmail,
  getPegawaiByNik,
  getPegawaiByNip,
  getPegawaiByPerangkat,
  getPegawaiByPerangkatId,
  getRiwayatPegawai,
  insertDokumenPegawai,
  insertPegawai,
  insertRiwayatPegawai,
  listDokumenPegawai,
  listPegawai,
  listPerangkatAktifDenganJabatan,
  listPerangkatTerhubung,
  listPerangkatUntukSinkron,
  listRiwayatPegawai,
  updatePegawai,
  updateRiwayatPegawai,
} from "@/features/kehadiran/kepegawaian/infrastructure/kepegawaian-repository";
import { bacaMedia, hapusMedia } from "@/features/media/infrastructure/media-storage";

import { village } from "./konteks";

export async function sinkronkanPegawaiPerangkat(villageId: number) {
  const perangkat = await listPerangkatUntukSinkron(villageId);
  for (const item of perangkat) {
    const existing = await getPegawaiByPerangkatId(villageId, item.id);
    if (!existing) {
      if (item.status === "aktif") {
        await insertPegawai(villageId, {
          perangkatId: item.id,
          nama: item.nama,
          nip: item.nip,
          nik: item.nik,
          jenisKelamin: item.jenisKelamin,
          tempatLahir: item.tempatLahir,
          tanggalLahir: item.tanggalLahir,
          foto: item.foto,
          jabatan: item.jabatan,
          statusPegawai: "tetap",
          status: "aktif",
        });
      }
      continue;
    }
    await updatePegawai(villageId, existing.id, {
      nama: item.nama,
      nip: item.nip,
      nik: item.nik,
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir,
      tanggalLahir: item.tanggalLahir,
      foto: item.foto,
      jabatan: item.jabatan,
      ...(item.status === "aktif" ? {} : { status: "nonaktif" }),
    });
  }
}

export async function daftarPegawai() {
  const { villageId } = await village("data-pegawai");
  await sinkronkanPegawaiPerangkat(villageId);
  return listPegawai(villageId);
}

export async function simpanPegawai(input: {
  id?: number;
  perangkatId?: number | null;
  nama: string;
  nip?: string | null;
  nik?: string | null;
  jabatan?: string | null;
  jenisKelamin?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  alamat?: string | null;
  telepon?: string | null;
  email?: string | null;
  pendidikan?: string | null;
  statusPegawai: string;
  status: string;
  tanggalMasuk?: string | null;
  tanggalKeluar?: string | null;
}) {
  const { villageId } = await village("data-pegawai", "update");
  if (!input.nama.trim()) throw new Error("Nama pegawai wajib diisi.");
  if (!["tetap", "kontrak", "purna_tugas"].includes(input.statusPegawai))
    throw new Error("Status kepegawaian tidak valid.");
  if (!["aktif", "nonaktif"].includes(input.status)) throw new Error("Status pegawai tidak valid.");
  if (input.nik && !/^\d{16}$/.test(input.nik)) throw new Error("NIK harus 16 digit.");
  if (input.nip && (await getPegawaiByNip(villageId, input.nip, input.id)))
    throw new Error("NIP sudah digunakan pegawai lain.");
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Format email pegawai tidak valid.");
  if (email && (await getPegawaiByEmail(villageId, email, input.id)))
    throw new Error(
      "Email sudah terhubung ke pegawai lain. Satu akun hanya boleh terhubung ke satu pegawai.",
    );
  if (input.nik && (await getPegawaiByNik(villageId, input.nik, input.id)))
    throw new Error("NIK sudah digunakan pegawai lain.");
  if (input.tanggalMasuk && input.tanggalKeluar && input.tanggalKeluar < input.tanggalMasuk)
    throw new Error("Tanggal keluar tidak boleh sebelum tanggal masuk.");
  if (input.perangkatId) {
    if (!(await getPegawai(villageId, input.perangkatId)))
      throw new Error("Perangkat desa tidak ditemukan pada tenant ini.");
    if (await getPegawaiByPerangkat(villageId, input.perangkatId, input.id))
      throw new Error("Perangkat desa tersebut sudah terhubung ke data pegawai lain.");
  }
  const values = {
    perangkatId: input.perangkatId ?? null,
    nama: input.nama.trim(),
    nip: input.nip || null,
    nik: input.nik || null,
    jabatan: input.jabatan || null,
    jenisKelamin: input.jenisKelamin || null,
    tempatLahir: input.tempatLahir || null,
    tanggalLahir: input.tanggalLahir || null,
    alamat: input.alamat || null,
    telepon: input.telepon || null,
    email: input.email || null,
    pendidikan: input.pendidikan || null,
    statusPegawai: input.statusPegawai,
    status: input.status,
    tanggalMasuk: input.tanggalMasuk || null,
    tanggalKeluar: input.tanggalKeluar || null,
  };
  if (input.id) {
    if (!(await getPegawai(villageId, input.id))) throw new Error("Pegawai tidak ditemukan.");
    await updatePegawai(villageId, input.id, values);
    return input.id;
  }
  return insertPegawai(villageId, values);
}

export async function daftarRiwayatPegawai(pegawaiId: number) {
  const { villageId } = await village("data-pegawai");
  return listRiwayatPegawai(villageId, pegawaiId);
}

export async function opsiPerangkatBelumTerhubung() {
  const { villageId } = await village("data-pegawai");
  const [officials, linked] = await Promise.all([
    listPerangkatAktifDenganJabatan(villageId),
    listPerangkatTerhubung(villageId),
  ]);
  const linkedIds = new Set(
    linked.map((x) => x.perangkatId).filter((x): x is number => x !== null),
  );
  return officials.filter((x) => !linkedIds.has(x.id));
}

export async function tambahRiwayatPegawai(input: {
  pegawaiId: number;
  jabatan: string;
  unitKerja?: string | null;
  nomorSk?: string | null;
  mulai: string;
  selesai?: string | null;
  keterangan?: string | null;
}) {
  const { villageId } = await village("data-pegawai", "update");
  if (!input.jabatan.trim() || !input.mulai)
    throw new Error("Jabatan dan tanggal mulai wajib diisi.");
  if (input.selesai && input.selesai < input.mulai)
    throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  if (!(await getPegawai(villageId, input.pegawaiId))) throw new Error("Pegawai tidak ditemukan.");
  await insertRiwayatPegawai(villageId, {
    pegawaiId: input.pegawaiId,
    jabatan: input.jabatan.trim(),
    unitKerja: input.unitKerja || null,
    nomorSk: input.nomorSk || null,
    mulai: input.mulai,
    selesai: input.selesai || null,
    keterangan: input.keterangan || null,
  });
}

export async function simpanDokumenPegawai(input: {
  pegawaiId: number;
  judul: string;
  kategori: string;
  nomor?: string | null;
  tanggal?: string | null;
  berkas: string;
}) {
  const { villageId } = await village("data-pegawai", "update");
  if (!input.judul.trim() || !input.berkas)
    throw new Error("Judul dan berkas dokumen wajib diisi.");
  if (!(await getPegawai(villageId, input.pegawaiId))) throw new Error("Pegawai tidak ditemukan.");
  await insertDokumenPegawai(villageId, {
    pegawaiId: input.pegawaiId,
    judul: input.judul.trim(),
    kategori: input.kategori,
    nomor: input.nomor || null,
    tanggal: input.tanggal || null,
    berkas: input.berkas,
  });
}

export async function daftarDokumenPegawai(pegawaiId: number) {
  const { villageId } = await village("data-pegawai");
  return listDokumenPegawai(villageId, pegawaiId);
}

export async function hapusRiwayatPegawai(id: number) {
  const { villageId } = await village("data-pegawai", "update");
  await deleteRiwayatPegawai(villageId, id);
}

export async function hapusDokumenPegawai(id: number) {
  const { villageId } = await village("data-pegawai", "update");
  const doc = await getDokumenPegawai(villageId, id);
  if (!doc) throw new Error("Dokumen pegawai tidak ditemukan.");
  await deleteDokumenPegawai(villageId, id);
  await hapusMedia(doc.berkas);
}

export async function ubahRiwayatPegawai(input: {
  id: number;
  pegawaiId: number;
  jabatan: string;
  unitKerja?: string | null;
  nomorSk?: string | null;
  mulai: string;
  selesai?: string | null;
  keterangan?: string | null;
}) {
  const { villageId } = await village("data-pegawai", "update");
  if (!input.jabatan.trim() || !input.mulai)
    throw new Error("Jabatan dan tanggal mulai wajib diisi.");
  if (input.selesai && input.selesai < input.mulai)
    throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai.");
  if (!(await getRiwayatPegawai(villageId, input.id, input.pegawaiId)))
    throw new Error("Riwayat jabatan tidak ditemukan.");
  await updateRiwayatPegawai(villageId, input.id, {
    jabatan: input.jabatan.trim(),
    unitKerja: input.unitKerja || null,
    nomorSk: input.nomorSk || null,
    mulai: input.mulai,
    selesai: input.selesai || null,
    keterangan: input.keterangan || null,
  });
}

/** Isi bukti absensi untuk route unduhan; `null` bila tidak ada atau tidak berhak. */

export async function bacaDokumenPegawaiData(id: number) {
  const { villageId } = await village("data-pegawai");
  const document = await getDokumenPegawai(villageId, id);
  if (!document) return null;
  const isi = await bacaMedia(document.berkas);
  return { id: document.id, isi, ekstensi: document.berkas.split(".").pop()?.toLowerCase() ?? "" };
}

/** Isi lampiran cuti untuk route unduhan setelah permission `pengajuan-izin:read`. */

export async function hapusBerkasKepegawaian(relatif: string) {
  await hapusMedia(relatif);
}
