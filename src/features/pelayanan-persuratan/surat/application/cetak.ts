import "server-only";

/**
 * Use case data cetak dan PDF surat.
 *
 * Penyusunan data cetak, margin, dan byte PDF surat untuk admin maupun warga.
 */

import {
  getIdentitasDesa,
  type IdentitasDesa,
} from "@/features/info-desa/desa/application/kontrak";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import {
  getPendudukSuratData,
  type PendudukSuratData,
} from "@/features/kependudukan/penduduk/application/kontrak";
import { bacaMedia } from "@/features/media/infrastructure/media-storage";
import {
  renderSuratTemplate,
  SURAT_RESOURCE,
  type JenisSuratDTO,
  type SuratDetail,
} from "@/features/pelayanan-persuratan/surat/domain/surat";
import { isiTerbilangDanHitung } from "@/features/pelayanan-persuratan/surat/domain/terbilang";
import { buildVerificationUrl } from "@/features/pelayanan-persuratan/surat/domain/verifikasi";
import { getJenisSurat } from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";
import { buildSuratPdf } from "@/features/pelayanan-persuratan/surat/infrastructure/surat-pdf";
import { getSurat } from "@/features/pelayanan-persuratan/surat/infrastructure/surat-repository";
import { bacaPengaturan } from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import type { Pengaturan } from "@/features/pengaturan/pengaturan/domain/pengaturan";
import { requirePermission, requireWargaAktif } from "@/lib/dal";
import { notFound } from "@/lib/errors";
import { getRequestOrigin } from "@/lib/request-origin";

import { buildValues, loadAnggotaKeluarga, loadPengikutSurat } from "./bersama";

/** Data lengkap satu surat untuk pratinjau, cetak, dan PDF. */
interface SuratPrintData {
  surat: SuratDetail;
  jenis: JenisSuratDTO;
  desa: IdentitasDesa;
  penduduk: PendudukSuratData | null;
  content: string;
  /** Varian cetak efektif (dari URL atau pengaturan jenis surat). */
  varian: string;
  /** JSON konfigurasi layout (opsional). */
  layoutConfig?: string | null;
  /** Desa pemilik surat; dipakai untuk membaca Pengaturan Surat. */
  villageId: number;
}

async function loadSuratPrintData(
  villageId: number,
  id: number,
  varian?: string | null,
): Promise<SuratPrintData> {
  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");

  const jenis = await getJenisSurat(villageId, surat.typeId);
  if (!jenis) throw notFound("Jenis surat tidak ditemukan.");

  const desa = await getIdentitasDesa(villageId);
  if (!desa) throw notFound("Identitas desa belum dikonfigurasi.");

  const penduduk = surat.residentId
    ? await getPendudukSuratData(villageId, surat.residentId)
    : null;
  const anggotaKeluarga = await loadAnggotaKeluarga(villageId, penduduk);
  const pengikutSurat = await loadPengikutSurat(villageId, surat.nilaiIsian);

  // Surat terbit memakai isi dan identitas jenis yang sudah disalin saat penerbitan.
  // Jangan biarkan perubahan template/varian/layout master mengubah cetak ulang arsip.
  const varianAktif =
    surat.status === "issued" ? "default" : (varian ?? jenis.templateVariant ?? "default");
  const templateBody =
    varianAktif !== "default" && jenis.templateBodyAlt ? jenis.templateBodyAlt : jenis.templateBody;

  const pengaturan = await bacaPengaturan(villageId);
  const values = buildValues(
    surat,
    jenis,
    desa,
    penduduk,
    anggotaKeluarga,
    pengikutSurat,
    surat.number ?? "KONSEP",
    pengaturan,
  );
  const content =
    surat.content ?? isiTerbilangDanHitung(renderSuratTemplate(templateBody, values), values);

  return {
    surat,
    jenis,
    desa,
    penduduk,
    content,
    varian: varianAktif,
    layoutConfig:
      surat.status === "issued" ? null : terapkanMarginGlobal(jenis.layoutConfig, pengaturan),
    villageId,
  };
}

/**
 * Terapkan margin global Pengaturan Surat saat jenis surat memakai margin
 * global (`marginGlobal` pada layout). Margin per jenis dipertahankan bila
 * petugas memilih margin sendiri.
 */

function terapkanMarginGlobal(
  layoutConfig: string | null | undefined,
  pengaturan: Pengaturan,
): string | null | undefined {
  if (!layoutConfig) return layoutConfig;
  try {
    const layout: unknown = JSON.parse(layoutConfig);
    if (!layout || typeof layout !== "object" || Array.isArray(layout)) return layoutConfig;
    const isi = layout as Record<string, unknown>;
    if (isi.marginGlobal === false) return layoutConfig;
    return JSON.stringify({
      ...isi,
      margin: {
        kiri: pengaturan.suratMarginKiri,
        atas: pengaturan.suratMarginAtas,
        kanan: pengaturan.suratMarginKanan,
        bawah: pengaturan.suratMarginBawah,
      },
    });
  } catch {
    return layoutConfig;
  }
}

/** Data lengkap untuk halaman cetak & PDF (konsep memakai render sementara). */

export async function getSuratPrintData(
  id: number,
  varian?: string | null,
): Promise<SuratPrintData> {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  return loadSuratPrintData(villageId, id, varian);
}

/**
 * Antrean Verifikasi Surat untuk sekretaris desa dan kepala desa.
 *
 * Halaman ini memakai izin baca `surat`; tombol setuju/tolak tetap dijaga
 * `verifySuratData`/`rejectSuratData` lewat role dan urutan tahap. Cakupan
 * baku adalah "tahap saya" bila role punya tahap, selain itu semua antrean.
 */

export async function getSuratPrintDataWarga(id: number): Promise<SuratPrintData> {
  const user = await requireWargaAktif();
  const villageId = await resolveVillageId(user);
  const data = await loadSuratPrintData(villageId, id);

  if (data.surat.residentId !== user.residentId) {
    throw notFound("Surat tidak ditemukan.");
  }

  if (data.surat.status !== "issued") {
    throw notFound("Surat belum terbit.");
  }

  return data;
}

function berkasPdfSah(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/**
 * PDF surat: pakai berkas hasil TTE bila ada, jika tidak render ulang.
 *
 * Berkas TTE disimpan pada kategori privat `surat-tte`; bila berkas hilang
 * (mis. volume storage dipulihkan), surat tetap dapat diunduh dalam bentuk
 * PDF tanpa TTE daripada gagal total.
 */

async function bangunPdfSurat(data: SuratPrintData): Promise<Uint8Array> {
  if (data.surat.tteFile) {
    try {
      const bytes = await bacaMedia(data.surat.tteFile);
      if (berkasPdfSah(bytes)) return new Uint8Array(bytes);
    } catch {
      // Lanjut merender PDF baru di bawah.
    }
  }

  const origin = await getRequestOrigin();
  const pengaturan = await bacaPengaturan(data.villageId);
  return buildSuratPdf({
    desa: data.desa,
    jenisNama: data.surat.typeName,
    nomor: data.surat.number,
    tanggal: data.surat.letterDate,
    content: data.content,
    verificationUrl: data.surat.verificationToken
      ? buildVerificationUrl(origin, data.surat.verificationToken)
      : null,
    layoutConfig: data.layoutConfig,
    templateVariant: data.varian,
    headerTemplate: pengaturan.suratTemplateHeader,
    footerTemplate: pengaturan.suratTemplateFooter,
    tinggiHeaderCm: pengaturan.suratTinggiHeader,
    tinggiFooterCm: pengaturan.suratTinggiFooter,
    kopLogo: pengaturan.suratLogo || null,
    garisGanda: pengaturan.suratGarisGanda,
    lebarLogoPersen: pengaturan.suratLogoLebar,
    posisiLogo: pengaturan.suratLogoPosisi,
  });
}

/** PDF surat untuk admin (memeriksa izin baca surat). */

export async function getSuratPdfBytes(
  id: number,
  varian?: string | null,
): Promise<{ surat: SuratDetail; pdf: Uint8Array }> {
  const data = await getSuratPrintData(id, varian);
  return { surat: data.surat, pdf: await bangunPdfSurat(data) };
}

/** PDF surat untuk warga pemilik (hanya surat terbit miliknya). */

export async function getSuratPdfBytesWarga(
  id: number,
): Promise<{ surat: SuratDetail; pdf: Uint8Array }> {
  const data = await getSuratPrintDataWarga(id);
  return { surat: data.surat, pdf: await bangunPdfSurat(data) };
}
