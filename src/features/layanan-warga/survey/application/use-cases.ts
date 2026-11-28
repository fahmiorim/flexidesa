import "server-only";

import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  listAnalisisIndikator,
  listAnalisisKategori,
} from "@/features/layanan-warga/analisis/application/kontrak";
import {
  hitungSkorResponden,
  KLASIFIKASI_SKOR,
  klasifikasiSkor,
  rekapPerIndikator,
  rekapPerKategori,
  type RekapIndikatorSkor,
  type RekapKategoriSkor,
  type SkorResponden,
} from "@/features/layanan-warga/analisis/domain/skor";
import { validasiJawaban } from "@/features/layanan-warga/survey/domain/survey";
import {
  buildSurveyCsv,
  surveyCsvFilename,
} from "@/features/layanan-warga/survey/domain/survey-csv";
import {
  getSurvey,
  insertResponden,
  listJawaban,
  listResponden,
  listSoal,
} from "@/features/layanan-warga/survey/infrastructure/survey-repository";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";
import { notFound, validationError } from "@/lib/errors";

/**
 * Use case analisis & survei.
 *
 * Izin diperiksa di sini. Tabel soal/responden tidak menyimpan `village_id`,
 * jadi setiap operasi anak diawali pemeriksaan bahwa survei induknya milik
 * desa sesi.
 */

/** Pastikan survei ada di desa ini; lempar 404 bila bukan. */
async function pastikanSurvei(villageId: number, surveyId: number) {
  const survei = await getSurvey(villageId, surveyId);
  if (!survei) throw notFound("Survei tidak ditemukan.");
  return survei;
}

/** Daftar seluruh survei desa (aktif maupun nonaktif). */

/**
 * Detail survei: soal, responden, dan rekap per soal.
 *
 * Mengembalikan `null` bila survei bukan milik desa sesi, agar halaman dapat
 * memanggil `notFound()`.
 */

/** Tambah/ubah survei. */

/** Hapus survei beserta soal, responden, dan jawabannya (cascade). */

/** Tambah/ubah soal pada survei. */

/** Hapus soal (jawaban terkait ikut terhapus). */

/**
 * Simpan responden beserta jawabannya.
 *
 * Semua soal wajib dijawab. Jawaban pilihan harus salah satu opsi yang
 * tersimpan pada soal (bukan nilai kiriman klien), dan jawaban angka harus
 * berupa angka.
 */

/** Hapus responden beserta jawabannya. */

/** Hasil impor CSV respons survei. */

/**
 * Ekspor seluruh responden + jawaban satu survei sebagai CSV.
 *
 * Izin `read` cukup karena hanya membaca data yang sudah boleh dilihat di
 * halaman detail; berkas tidak memuat data penduduk di luar isian responden.
 */
export async function exportSurveyCsvData(
  surveyId: number,
): Promise<{ filename: string; csv: string }> {
  const user = await requirePermission(RESOURCES.analisisSurvei, "read");
  const villageId = await resolveVillageId(user);
  const survei = await pastikanSurvei(villageId, surveyId);

  const [soal, responden, jawaban] = await Promise.all([
    listSoal(surveyId),
    listResponden(surveyId),
    listJawaban(surveyId),
  ]);

  return {
    filename: surveyCsvFilename(survei.judul, survei.id),
    csv: buildSurveyCsv({ soal, responden, jawaban }),
  };
}

/**
 * Impor CSV respons survei (kolom mengikuti urutan soal saat ini).
 *
 * Baris valid disimpan satu per satu; baris tidak valid dilaporkan tanpa
 * membatalkan baris lain sehingga operator dapat memperbaiki lalu mengulang.
 * Tanggal pada berkas diabaikan — waktu dibuat server.
 */

/**
 * Simpan respons dari halaman publik.
 *
 * Tidak memakai izin sesi: desa ditentukan pemanggil dari host permintaan.
 * Hanya survei aktif dan berada dalam periode pengisian yang menerima respons.
 */
export async function simpanResponsPublikData(
  villageId: number,
  surveyId: number,
  input: { nama: string; nik: string | null },
  jawaban: Readonly<Record<string, string>>,
): Promise<{ id: number }> {
  const survei = await getSurvey(villageId, surveyId);
  if (!survei || !survei.aktif) throw notFound("Survei tidak ditemukan atau tidak aktif.");

  const hariIni = new Date().toISOString().slice(0, 10);
  if (survei.mulai && hariIni < survei.mulai) {
    throw validationError("Periode pengisian survei belum dibuka.");
  }
  if (survei.selesai && hariIni > survei.selesai) {
    throw validationError("Periode pengisian survei sudah berakhir.");
  }

  const soal = await listSoal(surveyId);
  if (soal.length === 0) throw validationError("Survei belum memiliki pertanyaan.");

  const errors = validasiJawaban(soal, jawaban);
  if (Object.keys(errors).length > 0) {
    throw validationError(
      "Lengkapi jawaban survei.",
      Object.fromEntries(
        Object.entries(errors).map(([soalId, pesan]) => [`jawaban.${soalId}`, [pesan]]),
      ),
    );
  }

  const id = await insertResponden(
    villageId,
    surveyId,
    input,
    soal.map((item) => ({
      soalId: item.id,
      jawaban: (jawaban[String(item.id)] ?? "").trim(),
    })),
  );

  return { id };
}

/** Hasil perhitungan skor satu survei untuk laporan formal. */
interface LaporanSkorData {
  survei: Awaited<ReturnType<typeof pastikanSurvei>>;
  jumlahResponden: number;
  rataRata: number;
  klasifikasiDominan: string;
  perResponden: SkorResponden[];
  distribusi: { label: string; jumlah: number; persentase: number }[];
  perIndikator: (RekapIndikatorSkor & { nama: string; kategori: string | null })[];
  /** Ringkasan rata-rata per kategori indikator. */
  perKategori: RekapKategoriSkor[];
}

/**
 * Laporan skor survei: skor per responden, rata-rata, distribusi klasifikasi,
 * dan rata-rata per indikator analisis.
 */
export async function getLaporanSkorData(surveyId: number): Promise<LaporanSkorData> {
  const user = await requirePermission(RESOURCES.analisisSurvei, "read");
  const villageId = await resolveVillageId(user);
  const survei = await pastikanSurvei(villageId, surveyId);

  const [soal, responden, jawaban, indikator, kategori] = await Promise.all([
    listSoal(surveyId),
    listResponden(surveyId),
    listJawaban(surveyId),
    listAnalisisIndikator(villageId),
    listAnalisisKategori(villageId),
  ]);

  const jawabanPerResponden = new Map<number, Map<number, string>>(
    responden.map((item) => [item.id, new Map<number, string>()]),
  );
  for (const item of jawaban) {
    jawabanPerResponden.get(item.respondenId)?.set(item.soalId, item.jawaban);
  }

  const soalSkor = soal.map((item) => ({
    id: item.id,
    tipe: item.tipe,
    bobot: item.bobot,
    skorPilihan: item.skorPilihan,
    indikatorId: item.indikatorId,
  }));

  const perResponden = responden.map((item) =>
    hitungSkorResponden(soalSkor, {
      respondenId: item.id,
      nama: item.nama,
      jawaban: jawabanPerResponden.get(item.id) ?? new Map<number, string>(),
    }),
  );

  const rataRata =
    perResponden.length === 0
      ? 0
      : Math.round(
          (perResponden.reduce((sum, item) => sum + item.skor, 0) / perResponden.length) * 10,
        ) / 10;

  const distribusi = KLASIFIKASI_SKOR.map((item) => {
    const jumlah = perResponden.filter((row) => row.klasifikasi === item.label).length;
    return {
      label: item.label,
      jumlah,
      persentase:
        perResponden.length === 0 ? 0 : Math.round((jumlah / perResponden.length) * 1000) / 10,
    };
  });

  const kategoriNama = new Map(kategori.map((item) => [item.id, item.nama]));
  const indikatorNama = new Map(indikator.map((item) => [item.id, item]));

  const perIndikator = rekapPerIndikator(
    soalSkor,
    responden.map((item) => ({
      respondenId: item.id,
      jawaban: jawabanPerResponden.get(item.id) ?? new Map<number, string>(),
    })),
  ).map((item) => {
    const info = item.indikatorId === null ? null : indikatorNama.get(item.indikatorId);
    return {
      ...item,
      nama: info?.nama ?? "Tanpa indikator",
      kategori: info?.kategoriId == null ? null : (kategoriNama.get(info.kategoriId) ?? null),
    };
  });

  return {
    survei,
    jumlahResponden: responden.length,
    rataRata,
    klasifikasiDominan: klasifikasiSkor(rataRata),
    perResponden,
    distribusi,
    perIndikator,
    perKategori: rekapPerKategori(perIndikator),
  };
}

/** Rincian jawaban satu responden untuk dialog. */
