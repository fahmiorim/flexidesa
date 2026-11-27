"use server";

import { revalidatePath } from "next/cache";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  hapusDokumenPemerintahan,
  ubahMetadataDokumenPemerintahan,
  unggahDokumenPemerintahan,
} from "@/features/info-desa/pemerintahan/application/dokumen";
import {
  hapusJabatanPerangkat,
  hapusRiwayatJabatan,
  simpanJabatanPerangkat,
  simpanRiwayatJabatan,
} from "@/features/info-desa/pemerintahan/application/jabatan";
import {
  hapusLembagaDesa,
  hapusMasterLembaga,
  simpanAnggotaLembaga,
  simpanLembagaDesa,
  simpanMasterLembaga,
} from "@/features/info-desa/pemerintahan/application/lembaga";
import {
  hapusPerangkatDesa,
  hapusPerangkatDesaMasal,
  simpanBaganPerangkat,
  simpanPerangkatDesa,
  tetapkanPenandatangan,
  ubahKehadiranPerangkat,
  ubahStatusPerangkat,
} from "@/features/info-desa/pemerintahan/application/perangkat";
import { simpanBerkasMedia } from "@/features/info-desa/publik/application/simpan-berkas-media";
import { requirePermission } from "@/lib/dal";
import { validationError } from "@/lib/errors";

const value = (fd: FormData, key: string) => {
  const item = fd.get(key);
  return typeof item === "string" ? item.trim() : "";
};
const numberOrNull = (v: string) =>
  v && Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;
const dateOrNull = (v: string) => v || null;
const refresh = () => {
  for (const path of [
    "/profil-desa/pemerintah-desa",
    "/profil-desa/pemerintah-desa/bagan",
    "/profil-desa/lembaga-desa",
    "/profil-desa/wilayah-administratif",
    "/pemerintahan",
    "/perangkat",
    "/wilayah",
  ])
    revalidatePath(path);
};

export async function simpanPerangkatAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const nama = value(fd, "nama");
  if (!nama) throw validationError("Nama perangkat wajib diisi.");
  let foto: string | undefined;
  const fotoFile = fd.get("fotoFile");
  if (fotoFile instanceof File && fotoFile.size > 0) {
    const user = await requirePermission("perangkat-desa", "update");
    const villageId = await resolveVillageId(user);
    foto = await simpanBerkasMedia(
      villageId,
      {
        nama: fotoFile.name,
        mime: fotoFile.type,
        ukuran: fotoFile.size,
        isi: new Uint8Array(await fotoFile.arrayBuffer()),
      },
      "perangkat",
      "fotoFile",
    );
  }
  await simpanPerangkatDesa(id, {
    nama,
    gelarDepan: value(fd, "gelarDepan") || null,
    gelarBelakang: value(fd, "gelarBelakang") || null,
    jabatanId: numberOrNull(value(fd, "jabatanId")),
    residentId: numberOrNull(value(fd, "residentId")),
    nip: value(fd, "nip") || null,
    niap: value(fd, "niap") || null,
    nik: value(fd, "nik") || null,
    tagIdCard: value(fd, "tagIdCard") || null,
    jenisKelamin: value(fd, "jenisKelamin") || null,
    tempatLahir: value(fd, "tempatLahir") || null,
    tanggalLahir: dateOrNull(value(fd, "tanggalLahir")),
    foto,
    status: value(fd, "status") || "aktif",
    statusPejabat: value(fd, "statusPejabat") === "on",
    kehadiran: value(fd, "kehadiran") !== "off",
    ttdAn: value(fd, "ttdAn") === "on",
    ttdUb: value(fd, "ttdUb") === "on",
    periode: value(fd, "periode") || null,
    pendidikan: value(fd, "pendidikan") || null,
    agama: value(fd, "agama") || null,
    pangkat: value(fd, "pangkat") || null,
    telepon: value(fd, "telepon") || null,
    email: value(fd, "email") || null,
    alamat: value(fd, "alamat") || null,
    nomorSkPengangkatan: value(fd, "nomorSkPengangkatan") || null,
    tanggalPengangkatan: dateOrNull(value(fd, "tanggalPengangkatan")),
    nomorSkPemberhentian: value(fd, "nomorSkPemberhentian") || null,
    tanggalPemberhentian: dateOrNull(value(fd, "tanggalPemberhentian")),
    atasanId: numberOrNull(value(fd, "atasanId")),
    baganTingkat: numberOrNull(value(fd, "baganTingkat")),
    baganOffset: value(fd, "baganOffset") || null,
    baganLayout: value(fd, "baganLayout") || null,
    baganWarna: value(fd, "baganWarna") || null,
    mediaSosial: mediaSosialDariForm(fd),
    urut: Number(value(fd, "urut") || 0),
  });
  refresh();
}

export async function hapusPerangkatAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID perangkat tidak valid.");
  await hapusPerangkatDesa(id);
  refresh();
}

export async function hapusPerangkatMassalAction(fd: FormData) {
  const ids = fd
    .getAll("ids")
    .map((isi) => numberOrNull(String(isi)))
    .filter((id): id is number => id !== null);
  if (!ids.length) throw validationError("Pilih aparat yang akan dihapus.");
  await hapusPerangkatDesaMasal(ids);
  refresh();
}

export async function simpanLembagaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const nama = value(fd, "nama");
  if (!nama) throw validationError("Nama lembaga wajib diisi.");
  // Logo tidak dibaca dari input tersembunyi klien: hanya berkas hasil unggahan
  // server yang boleh disimpan, atau null bila admin mencentang hapus.
  let logo: string | null | undefined = value(fd, "hapusLogo") === "on" ? null : undefined;
  const logoFile = fd.get("logoFile");
  if (logoFile instanceof File && logoFile.size > 0) {
    const user = await requirePermission("lembaga-desa", "update");
    const villageId = await resolveVillageId(user);
    // Kategori "perangkat" dipakai karena hanya kategori itu yang boleh
    // disajikan lewat route media publik; logo lembaga perlu tampil di website.
    logo = await simpanBerkasMedia(
      villageId,
      {
        nama: logoFile.name,
        mime: logoFile.type,
        ukuran: logoFile.size,
        isi: new Uint8Array(await logoFile.arrayBuffer()),
      },
      "perangkat",
      "logoFile",
    );
  }
  await simpanLembagaDesa(id, {
    nama,
    kode: value(fd, "kode") || null,
    masterId: numberOrNull(value(fd, "masterId")),
    jenis: value(fd, "jenis") || "lainnya",
    deskripsi: value(fd, "deskripsi") || null,
    tugasFungsi: value(fd, "tugasFungsi") || null,
    dasarHukum: value(fd, "dasarHukum") || null,
    noSkPendirian: value(fd, "noSkPendirian") || null,
    ketuaResidentId: numberOrNull(value(fd, "ketuaResidentId")),
    logo,
    masaBaktiMulai: dateOrNull(value(fd, "masaBaktiMulai")),
    masaBaktiSelesai: dateOrNull(value(fd, "masaBaktiSelesai")),
    status: value(fd, "status") || "aktif",
    tampilPublik: value(fd, "tampilPublik") === "on",
    urut: Number(value(fd, "urut") || 0),
  });
  refresh();
}

export async function simpanMasterLembagaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  await simpanMasterLembaga(id, {
    nama: value(fd, "nama"),
    deskripsi: value(fd, "deskripsi") || null,
    urut: Number(value(fd, "urut") || 0),
  });
  refresh();
}

export async function hapusMasterLembagaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID kategori tidak valid.");
  await hapusMasterLembaga(id);
  refresh();
}

export async function hapusLembagaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID lembaga tidak valid.");
  await hapusLembagaDesa(id);
  refresh();
}

export async function simpanAnggotaLembagaAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const lembagaId = numberOrNull(value(fd, "lembagaId"));
  const nama = value(fd, "nama");
  if (!lembagaId) throw validationError("Lembaga anggota wajib dipilih.");
  // Foto tidak dibaca dari input tersembunyi klien: hanya berkas hasil unggahan
  // server yang disimpan; foto lama dipertahankan bila tidak ada unggahan baru.
  let foto: string | undefined;
  const fotoFile = fd.get("fotoFile");
  if (fotoFile instanceof File && fotoFile.size > 0) {
    const user = await requirePermission("lembaga-desa", "update");
    const villageId = await resolveVillageId(user);
    foto = await simpanBerkasMedia(
      villageId,
      {
        nama: fotoFile.name,
        mime: fotoFile.type,
        ukuran: fotoFile.size,
        isi: new Uint8Array(await fotoFile.arrayBuffer()),
      },
      "perangkat",
      "fotoFile",
    );
  }
  await simpanAnggotaLembaga(id, {
    lembagaId,
    residentId: numberOrNull(value(fd, "residentId")),
    nama,
    nomorAnggota: value(fd, "nomorAnggota") || null,
    jabatan: value(fd, "jabatan") || null,
    nomorSkJabatan: value(fd, "nomorSkJabatan") || null,
    nomorSkPengangkatan: value(fd, "nomorSkPengangkatan") || null,
    tanggalSkPengangkatan: dateOrNull(value(fd, "tanggalSkPengangkatan")),
    nomorSkPemberhentian: value(fd, "nomorSkPemberhentian") || null,
    tanggalSkPemberhentian: dateOrNull(value(fd, "tanggalSkPemberhentian")),
    periode: value(fd, "periode") || null,
    keterangan: value(fd, "keterangan") || null,
    foto,
    periodeMulai: dateOrNull(value(fd, "periodeMulai")),
    periodeSelesai: dateOrNull(value(fd, "periodeSelesai")),
    aktif: value(fd, "aktif") !== "off",
    tampilPublik: value(fd, "tampilPublik") === "on",
    urut: Number(value(fd, "urut") || 0),
  });
  refresh();
}

export async function simpanJabatanAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const nama = value(fd, "nama");
  if (!nama) throw validationError("Nama jabatan wajib diisi.");
  await simpanJabatanPerangkat(
    id,
    nama,
    Number(value(fd, "urut") || 0),
    value(fd, "jenis") || "lainnya",
    value(fd, "tupoksi") || null,
  );
  refresh();
}

const KUNCI_MEDIA_SOSIAL = [
  "facebook",
  "instagram",
  "twitter",
  "tiktok",
  "youtube",
  "telegram",
  "whatsapp",
] as const;

/** Membaca media sosial dari field bernama `mediaSosial[<kunci>]`. */
function mediaSosialDariForm(fd: FormData) {
  const hasil: Record<string, string> = {};
  for (const kunci of KUNCI_MEDIA_SOSIAL) {
    const isi = value(fd, `mediaSosial[${kunci}]`);
    if (isi) hasil[kunci] = isi;
  }
  return hasil;
}

/** Menyimpan susunan bagan organisasi satu aparat. */
export async function simpanBaganAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID perangkat tidak valid.");
  const tingkat = value(fd, "baganTingkat");
  await simpanBaganPerangkat(id, {
    atasanId: numberOrNull(value(fd, "atasanId")),
    baganTingkat:
      tingkat && Number.isSafeInteger(Number(tingkat)) && Number(tingkat) >= 0
        ? Number(tingkat)
        : null,
    baganOffset: value(fd, "baganOffset") || null,
    baganLayout: value(fd, "baganLayout") || null,
    baganWarna: value(fd, "baganWarna") || null,
  });
  refresh();
}

/** Mengubah status aktif/nonaktif aparat dari baris tabel. */
export async function ubahStatusPerangkatAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID perangkat tidak valid.");
  await ubahStatusPerangkat(id, value(fd, "status"));
  refresh();
}

/** Mengubah status kehadiran aparat dari baris tabel. */
export async function ubahKehadiranPerangkatAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID perangkat tidak valid.");
  await ubahKehadiranPerangkat(id, value(fd, "kehadiran") === "1");
  refresh();
}

/** Menetapkan/melepas penandatangan a.n atau u.b. */
export async function tetapkanPenandatanganAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID perangkat tidak valid.");
  const jenis = value(fd, "jenis");
  if (jenis !== "an" && jenis !== "ub" && jenis !== "") {
    throw validationError("Jenis penandatangan tidak valid.");
  }
  await tetapkanPenandatangan(id, jenis === "" ? null : jenis);
  refresh();
}

export async function hapusJabatanAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID jabatan tidak valid.");
  await hapusJabatanPerangkat(id);
  refresh();
}

export async function simpanRiwayatAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const perangkatId = numberOrNull(value(fd, "perangkatId"));
  const jabatan = value(fd, "jabatan");
  if (!perangkatId || !jabatan) throw validationError("Perangkat dan jabatan wajib diisi.");
  await simpanRiwayatJabatan(id, {
    perangkatId,
    jabatan,
    nomorSk: value(fd, "nomorSk") || null,
    mulai: value(fd, "mulai") || null,
    selesai: value(fd, "selesai") || null,
    keterangan: value(fd, "keterangan") || null,
    tampilPublik: value(fd, "tampilPublik") === "on",
  });
  refresh();
}

export async function hapusRiwayatAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID riwayat tidak valid.");
  await hapusRiwayatJabatan(id);
  refresh();
}

export async function unggahDokumenPemerintahanAction(fd: FormData) {
  const perangkatId = numberOrNull(value(fd, "perangkatId"));
  const lembagaId = numberOrNull(value(fd, "lembagaId"));
  if (Boolean(perangkatId) === Boolean(lembagaId)) {
    throw validationError("Pilih tepat satu perangkat atau lembaga untuk dokumen ini.");
  }
  if (!value(fd, "judul")) throw validationError("Judul dokumen wajib diisi.");
  const file = fd.get("berkas");
  if (!(file instanceof File) || file.size === 0)
    throw validationError("Pilih dokumen PDF atau gambar terlebih dahulu.");
  if (
    !(["application/pdf", "image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type)
  )
    throw validationError("Dokumen hanya boleh berupa PDF, JPG, PNG, atau WEBP.");
  const user = await requirePermission(perangkatId ? "perangkat-desa" : "lembaga-desa", "update");
  const villageId = await resolveVillageId(user);
  const berkas = await simpanBerkasMedia(
    villageId,
    {
      nama: file.name,
      mime: file.type,
      ukuran: file.size,
      isi: new Uint8Array(await file.arrayBuffer()),
    },
    "pemerintahan",
    "berkas",
  );
  await unggahDokumenPemerintahan({
    perangkatId,
    lembagaId,
    judul: value(fd, "judul"),
    nomor: value(fd, "nomor") || null,
    tanggal: value(fd, "tanggal") || null,
    berkas,
    tampilPublik: value(fd, "tampilPublik") === "on",
  });
  refresh();
}

export async function hapusDokumenPemerintahanAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  if (!id) throw validationError("ID dokumen tidak valid.");
  await hapusDokumenPemerintahan(id);
  refresh();
}

export async function ubahDokumenPemerintahanAction(fd: FormData) {
  const id = numberOrNull(value(fd, "id"));
  const judul = value(fd, "judul");
  if (!id || !judul) throw validationError("Dokumen dan judul wajib dipilih.");
  await ubahMetadataDokumenPemerintahan(id, {
    judul,
    nomor: value(fd, "nomor") || null,
    tanggal: value(fd, "tanggal") || null,
    tampilPublik: value(fd, "tampilPublik") === "on",
  });
  refresh();
}
