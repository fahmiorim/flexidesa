import "server-only";

/**
 * Use case absensi dan pengaturan kehadiran.
 *
 * Dashboard absensi, absensi harian/rentang/bulanan, absensi mandiri
 * (check-in/check-out dengan radius kantor), dan pengaturan kehadiran.
 */

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  getPengaturanKehadiran as ambilPengaturanKehadiran,
  countCutiAktif,
  countKehadiranHarian,
  denganKunciAbsensiHarian,
  getAbsensiHarian,
  getBuktiAbsensi,
  getPegawaiAktif,
  getPegawaiByUserEmail,
  insertAbsensi,
  listAbsensiDashboard,
  listAbsensiTanggal,
  listCatatanAbsensiRentang,
  listKehadiranBulanan,
  listPegawaiAktif,
  listPegawaiAktifRingkas,
  listTrenKehadiran,
  updateAbsensi,
  upsertPengaturanKehadiran,
} from "@/features/kehadiran/kepegawaian/infrastructure/kepegawaian-repository";
import { bacaMedia } from "@/features/media/infrastructure/media-storage";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { requireUser } from "@/lib/dal";

import { village } from "./konteks";
import { sinkronkanPegawaiPerangkat } from "./pegawai";
import { tanggalLokal, tanggalValid } from "./tanggal";

export async function getDashboardAbsensiData() {
  const { villageId } = await village("absensi-dashboard");
  await sinkronkanPegawaiPerangkat(villageId);
  const today = tanggalLokal();
  const from = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(Date.now() - 29 * 86400000),
  );
  const [employees, attendance, leaves, todayRows, trendRows] = await Promise.all([
    listPegawaiAktif(villageId),
    countKehadiranHarian(villageId, today),
    countCutiAktif(villageId, today),
    listAbsensiDashboard(villageId, today, 8),
    listTrenKehadiran(villageId, from, today),
  ]);
  const hadir = Number(attendance.find((x) => x.status === "hadir")?.total ?? 0);
  const izin = Number(attendance.find((x) => x.status === "izin")?.total ?? 0);
  const cuti = Number(attendance.find((x) => x.status === "cuti")?.total ?? 0);
  const tidakHadir = Math.max(0, employees.length - hadir - izin - cuti);
  return {
    villageId,
    totalPegawai: employees.length,
    hadir,
    izin,
    cuti,
    tidakHadir,
    tingkatKehadiran: employees.length ? Math.round((hadir / employees.length) * 1000) / 10 : 0,
    komposisi: {
      tetap: employees.filter((x) => x.statusPegawai === "tetap").length,
      kontrak: employees.filter((x) => x.statusPegawai === "kontrak").length,
      purnaTugas: employees.filter((x) => x.statusPegawai === "purna_tugas").length,
    },
    jenisKelamin: {
      lakiLaki: employees.filter((x) => x.jenisKelamin === "male").length,
      perempuan: employees.filter((x) => x.jenisKelamin === "female").length,
    },
    rataMasaKerjaBulan: employees.length
      ? Math.round(
          employees.reduce((sum, x) => {
            if (!x.tanggalMasuk) return sum;
            const start = new Date(x.tanggalMasuk + "T00:00:00Z");
            const end = x.tanggalKeluar ? new Date(x.tanggalKeluar + "T00:00:00Z") : new Date();
            return (
              sum +
              Math.max(
                0,
                (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
                  end.getUTCMonth() -
                  start.getUTCMonth(),
              )
            );
          }, 0) / Math.max(1, employees.filter((x) => x.tanggalMasuk).length),
        )
      : 0,
    todayRows: todayRows.map((x) => ({ ...x, status: x.status ?? "tidak_hadir" })),
    trendRows,
    leaves,
  };
}

export async function daftarAbsensi(tanggal = tanggalLokal()) {
  const { villageId } = await village("kehadiran");
  if (!tanggalValid(tanggal)) throw new Error("Tanggal absensi tidak valid.");
  await sinkronkanPegawaiPerangkat(villageId);
  return listAbsensiTanggal(villageId, tanggal);
}

export async function daftarAbsensiRentang(mulai: string, selesai: string) {
  const { villageId } = await village("kehadiran");
  if (!tanggalValid(mulai) || !tanggalValid(selesai) || selesai < mulai)
    throw new Error("Rentang laporan absensi tidak valid.");
  const start = Date.parse(mulai + "T00:00:00Z");
  const end = Date.parse(selesai + "T00:00:00Z");
  if ((end - start) / 86400000 > 366) throw new Error("Rentang laporan maksimal 367 hari.");
  await sinkronkanPegawaiPerangkat(villageId);
  const [pegawai, catatan, setting] = await Promise.all([
    listPegawaiAktifRingkas(villageId),
    listCatatanAbsensiRentang(villageId, mulai, selesai),
    ambilPengaturanKehadiran(villageId),
  ]);
  let hariLibur: number[] = [0, 6];
  try {
    const parsed = JSON.parse(setting?.hariLibur ?? "[0,6]");
    if (
      Array.isArray(parsed) &&
      parsed.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    )
      hariLibur = [...new Set(parsed)];
  } catch {
    /* gunakan akhir pekan sebagai fallback */
  }
  const byDate = new Map(catatan.map((row) => [row.tanggal + ":" + row.pegawaiId, row]));
  const hasil = [];
  for (let day = start; day <= end; day += 86400000) {
    const tanggal = new Date(day).toISOString().slice(0, 10);
    if (hariLibur.includes(new Date(day).getUTCDay())) continue;
    for (const person of pegawai) {
      const row = byDate.get(tanggal + ":" + person.id);
      const status = row?.status ?? "tidak_hadir";
      const jamMasuk = row?.jamMasuk ?? null;
      hasil.push({
        tanggal,
        nama: person.nama,
        jabatan: person.jabatan,
        jamMasuk,
        jamKeluar: row?.jamKeluar ?? null,
        status,
        catatan: row?.catatan ?? null,
        terlambat:
          status === "hadir" &&
          Boolean(
            jamMasuk &&
            setting?.jamMasuk &&
            Number(jamMasuk.slice(0, 2)) * 60 + Number(jamMasuk.slice(3, 5)) >
              Number(setting.jamMasuk.slice(0, 2)) * 60 +
                Number(setting.jamMasuk.slice(3, 5)) +
                (setting.toleransiTerlambatMenit ?? 0),
          ),
      });
    }
  }
  return hasil;
}

export async function catatAbsensiManual(input: {
  pegawaiId: number;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  status: string;
  catatan?: string;
}) {
  const { villageId } = await village("kehadiran", "update");
  if (!(await getPegawaiAktif(villageId, input.pegawaiId)))
    throw new Error("Pegawai aktif tidak ditemukan.");
  if (!tanggalValid(input.tanggal)) throw new Error("Tanggal absensi tidak valid.");
  if (!["hadir", "izin", "cuti", "tidak_hadir"].includes(input.status))
    throw new Error("Status absensi tidak valid.");
  if (input.jamMasuk && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.jamMasuk))
    throw new Error("Jam masuk tidak valid.");
  if (input.jamKeluar && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.jamKeluar))
    throw new Error("Jam pulang tidak valid.");
  if (input.jamMasuk && input.jamKeluar && input.jamKeluar < input.jamMasuk)
    throw new Error("Jam pulang tidak boleh sebelum jam masuk.");
  const existing = await getAbsensiHarian(villageId, input.pegawaiId, input.tanggal);
  const values = {
    perangkatId: null,
    jamMasuk: input.jamMasuk || null,
    jamKeluar: input.jamKeluar || null,
    status: input.status,
    catatan: input.catatan || null,
  };
  if (existing) await updateAbsensi(villageId, existing.id, values);
  else
    await insertAbsensi(villageId, {
      ...values,
      pegawaiId: input.pegawaiId,
      tanggal: input.tanggal,
    });
}

export async function getStatusAbsensiMandiri() {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const pegawai = await getPegawaiByUserEmail(villageId, user.email);
  if (!pegawai) return null;
  const record = await getAbsensiHarian(villageId, pegawai.id, tanggalLokal());
  return {
    nama: pegawai.nama,
    jamMasuk: record?.jamMasuk ?? null,
    jamKeluar: record?.jamKeluar ?? null,
  };
}

function jarakMeter(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(lat2 - lat1),
    dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Catat check-in/check-out mandiri untuk akun yang emailnya terhubung ke master pegawai. */

export async function catatAbsensiMandiri(input: {
  latitude: number | null;
  longitude: number | null;
  fotoMasuk?: string | null;
}) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  if ((input.latitude === null) !== (input.longitude === null))
    throw new Error("Koordinat GPS harus diisi berpasangan.");
  if (
    input.latitude !== null &&
    input.longitude !== null &&
    (!Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180)
  )
    throw new Error("Koordinat GPS tidak valid.");
  const pegawai = await getPegawaiByUserEmail(villageId, user.email);
  if (!pegawai)
    throw new Error(
      "Akun belum ditautkan ke data pegawai. Hubungi administrator desa untuk mengisi email akun pada profil pegawai.",
    );
  const setting = await ambilPengaturanKehadiran(villageId);
  const wajibGps = setting?.wajibGps ?? true;
  const wajibFoto = setting?.wajibFoto ?? true;
  if (wajibGps && (input.latitude === null || input.longitude === null))
    throw new Error("Ambil lokasi GPS sebelum mengirim absensi.");
  if (wajibGps && (!setting?.latitudeKantor || !setting?.longitudeKantor))
    throw new Error("Lokasi kantor belum dikonfigurasi administrator.");
  if (
    wajibGps &&
    input.latitude !== null &&
    input.longitude !== null &&
    setting?.latitudeKantor &&
    setting.longitudeKantor
  ) {
    const distance = jarakMeter(
      input.latitude,
      input.longitude,
      Number(setting.latitudeKantor),
      Number(setting.longitudeKantor),
    );
    if (distance > (setting.radiusMeter ?? 100))
      throw new Error(
        `Anda berada di luar area absensi kantor (jarak sekitar ${Math.round(distance)} meter).`,
      );
  }
  return denganKunciAbsensiHarian(villageId, pegawai.id, tanggalLokal(), () =>
    denganKunciAbsensi(villageId, pegawai, {
      wajibFoto,
      fotoMasuk: input.fotoMasuk ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
  );
}

async function denganKunciAbsensi(
  villageId: number,
  pegawai: { id: number; nama: string },
  input: {
    wajibFoto: boolean;
    fotoMasuk: string | null;
    latitude: number | null;
    longitude: number | null;
  },
) {
  const tanggal = tanggalLokal();
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const catatan = await getAbsensiHarian(villageId, pegawai.id, tanggal);
  if (catatan?.jamKeluar)
    throw new Error("Absensi hari ini sudah lengkap. Check-in dan check-out sudah tercatat.");
  if (!catatan && input.wajibFoto && !input.fotoMasuk)
    throw new Error("Foto selfie wajib dilampirkan saat check-in.");
  if (catatan) {
    if (!catatan.jamMasuk) throw new Error("Data absensi hari ini perlu diperiksa administrator.");
    const masukMenit =
      Number(catatan.jamMasuk.slice(0, 2)) * 60 + Number(catatan.jamMasuk.slice(3, 5));
    const sekarangMenit = Number(now.slice(0, 2)) * 60 + Number(now.slice(3, 5));
    if (sekarangMenit - masukMenit < 2)
      throw new Error("Check-in baru saja tercatat. Tunggu sebelum melakukan check-out.");
    await updateAbsensi(villageId, catatan.id, { jamKeluar: now });
    return { aksi: "check_out" as const, nama: pegawai.nama, jam: now };
  }
  await insertAbsensi(villageId, {
    pegawaiId: pegawai.id,
    perangkatId: null,
    tanggal,
    jamMasuk: now,
    status: "hadir",
    latitudeMasuk: input.latitude === null ? null : String(input.latitude),
    longitudeMasuk: input.longitude === null ? null : String(input.longitude),
    fotoMasuk: input.fotoMasuk,
  });
  return { aksi: "check_in" as const, nama: pegawai.nama, jam: now };
}

export async function daftarKehadiranBulanan(tahun: number, bulan: number) {
  const { villageId } = await village("kehadiran");
  if (
    !Number.isInteger(tahun) ||
    tahun < 2000 ||
    tahun > 2200 ||
    !Number.isInteger(bulan) ||
    bulan < 1 ||
    bulan > 12
  )
    throw new Error("Periode kalender tidak valid.");
  const mulai = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const akhir = new Date(Date.UTC(tahun, bulan, 0)).toISOString().slice(0, 10);
  return listKehadiranBulanan(villageId, mulai, akhir);
}

export async function getPengaturanKehadiran() {
  const { villageId } = await village("kehadiran");
  const setting = await ambilPengaturanKehadiran(villageId);
  return (
    setting ?? {
      jamMasuk: "08:00",
      jamKeluar: "16:00",
      hariLibur: "[0,6]",
      latitudeKantor: null,
      longitudeKantor: null,
      radiusMeter: 100,
      toleransiTerlambatMenit: 0,
      wajibGps: true,
      wajibFoto: true,
    }
  );
}

export async function simpanPengaturanKehadiran(input: {
  jamMasuk: string;
  jamKeluar: string;
  hariLibur: number[];
  latitudeKantor?: string | null;
  longitudeKantor?: string | null;
  radiusMeter?: number;
  toleransiTerlambatMenit?: number;
  wajibGps?: boolean;
  wajibFoto?: boolean;
}) {
  const { user, villageId } = await village("kehadiran", "update");
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.jamMasuk) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.jamKeluar)
  )
    throw new Error("Format jam kerja harus HH:MM.");
  if (input.jamKeluar <= input.jamMasuk) throw new Error("Jam pulang harus setelah jam masuk.");
  if (
    !Array.isArray(input.hariLibur) ||
    input.hariLibur.some((x) => !Number.isInteger(x) || x < 0 || x > 6)
  )
    throw new Error("Hari libur tidak valid.");
  const lat = input.latitudeKantor?.trim() || null;
  const lng = input.longitudeKantor?.trim() || null;
  if ((lat === null) !== (lng === null))
    throw new Error("Koordinat kantor harus diisi berpasangan.");
  if (
    lat !== null &&
    (!Number.isFinite(Number(lat)) ||
      Number(lat) < -90 ||
      Number(lat) > 90 ||
      !Number.isFinite(Number(lng)) ||
      Number(lng) < -180 ||
      Number(lng) > 180)
  )
    throw new Error("Koordinat kantor tidak valid.");
  const radiusMeter = input.radiusMeter ?? 100;
  const toleransiTerlambatMenit = input.toleransiTerlambatMenit ?? 0;
  if (!Number.isInteger(radiusMeter) || radiusMeter < 20 || radiusMeter > 5000)
    throw new Error("Radius lokasi harus 20–5000 meter.");
  if (
    !Number.isInteger(toleransiTerlambatMenit) ||
    toleransiTerlambatMenit < 0 ||
    toleransiTerlambatMenit > 180
  )
    throw new Error("Toleransi keterlambatan harus 0–180 menit.");
  if (input.wajibGps !== false && (lat === null || lng === null))
    throw new Error("Isi koordinat kantor sebelum mengaktifkan validasi GPS.");
  await upsertPengaturanKehadiran(villageId, {
    jamMasuk: input.jamMasuk,
    jamKeluar: input.jamKeluar,
    hariLibur: JSON.stringify([...new Set(input.hariLibur)]),
    latitudeKantor: lat,
    longitudeKantor: lng,
    radiusMeter,
    toleransiTerlambatMenit,
    wajibGps: input.wajibGps !== false,
    wajibFoto: input.wajibFoto !== false,
    diperbaruiOleh: user.id,
  });
}

export async function bacaBuktiAbsensiData(id: number) {
  const user = await requireUser();
  const villageId = await resolveVillageId(user);
  const row = await getBuktiAbsensi(villageId, id);
  if (!row?.foto) return null;
  const canRead = hasPermission(user.permissions, "kehadiran", "read");
  if (!canRead && row.email?.toLowerCase() !== user.email.toLowerCase()) return null;
  const isi = await bacaMedia(row.foto);
  return { id, isi, ekstensi: row.foto.split(".").pop()?.toLowerCase() ?? "" };
}

/** Isi dokumen pegawai untuk route unduhan setelah permission `kepegawaian:read`. */
