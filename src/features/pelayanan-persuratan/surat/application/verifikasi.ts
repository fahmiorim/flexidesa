import "server-only";

/**
 * Use case verifikasi dan penerbitan surat.
 *
 * Pengajuan verifikasi, keputusan tahap, penerbitan (termasuk TTE), penolakan,
 * dan data antrean verifikasi.
 */

import {
  getIdentitasDesa,
  type IdentitasDesa,
} from "@/features/info-desa/desa/application/kontrak";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { getPendudukSuratData } from "@/features/kependudukan/penduduk/application/kontrak";
import {
  findPermohonanByLetterId,
  sinkronStatusSuratPermohonan,
} from "@/features/pelayanan-persuratan/layanan-mandiri/application/kontrak";
import { notifyPermohonanStatusChange } from "@/features/pelayanan-persuratan/layanan-mandiri/application/notification";
import {
  getKonfigurasiTteEfektif,
  simpanBerkasTte,
  tandatanganiPdfTte,
} from "@/features/pelayanan-persuratan/surat/application/tte-use-cases";
import { parseSyaratIds } from "@/features/pelayanan-persuratan/surat/domain/isian";
import {
  normalizePenomoranMode,
  type PenomoranSuratMode,
} from "@/features/pelayanan-persuratan/surat/domain/penomoran";
import {
  buildSuratNumber,
  butuhKonfirmasiSyarat,
  canVerifyStep,
  DEFAULT_NUMBER_FORMAT,
  generateVerificationToken,
  nextVerificationStep,
  renderSuratTemplate,
  roleCanVerifyStep,
  SURAT_RESOURCE,
  tahapanUntukRole,
  VERIFICATION_STEP_LABELS,
  type JenisSuratDTO,
  type SuratDetail,
  type VerificationStep,
} from "@/features/pelayanan-persuratan/surat/domain/surat";
import { isiTerbilangDanHitung } from "@/features/pelayanan-persuratan/surat/domain/terbilang";
import {
  buildVerificationUrl,
  validateVerification,
} from "@/features/pelayanan-persuratan/surat/domain/verifikasi";
import {
  hitungAntreanPerTahap,
  saringAntreanVerifikasi,
  susunAntreanVerifikasi,
  type ScopeVerifikasi,
} from "@/features/pelayanan-persuratan/surat/domain/verifikasi-antrean";
import { getJenisSurat } from "@/features/pelayanan-persuratan/surat/infrastructure/master-repository";
import { buildSuratPdf } from "@/features/pelayanan-persuratan/surat/infrastructure/surat-pdf";
import {
  getSurat,
  issueSuratRecord,
  listAntreanVerifikasi,
  nextSuratSequence,
  nextSuratSequenceByKlasifikasi,
  nextSuratSequenceCombined,
  nextSuratSequenceGlobal,
  rejectSurat,
  setSuratTte,
  suratNumberExists,
  suratNumberExistsWithAgenda,
  updateSuratVerification,
} from "@/features/pelayanan-persuratan/surat/infrastructure/surat-repository";
import { recordAuditEvent } from "@/features/pengaturan/audit/application/audit-use-cases";
import { AUDIT_EVENTS } from "@/features/pengaturan/audit/domain/audit";
import { bacaPengaturan } from "@/features/pengaturan/pengaturan/application/pengaturan-use-cases";
import type { Pengaturan } from "@/features/pengaturan/pengaturan/domain/pengaturan";
import { findRoleById } from "@/features/pengaturan/rbac/application/kontrak";
import { requirePermission } from "@/lib/dal";
import { conflict, forbidden, notFound, validationError } from "@/lib/errors";
import { getRequestOrigin } from "@/lib/request-origin";

import { buildValues, loadAnggotaKeluarga, loadJenis, loadPengikutSurat } from "./bersama";

export async function ajukanVerifikasiSuratData(
  id: number,
  konfirmasiSyarat = false,
): Promise<void> {
  const user = await requirePermission(SURAT_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");
  if (surat.status !== "draft") throw conflict("Hanya konsep surat yang dapat diajukan.");

  // Penegakan syarat jalur operator: bila jenis surat ini menuntut syarat,
  // pengajuan harus diikuti konfirmasi kelengkapan dari pencetus (lihat
  // `butuhKonfirmasiSyarat`). Tanpa ini surat bisa terbit walau dokumen
  // persyaratannya belum lengkap.
  const jenis = await getJenisSurat(villageId, surat.typeId);
  const jumlahSyarat = jenis === null ? 0 : parseSyaratIds(jenis.syaratSurat).length;
  if (butuhKonfirmasiSyarat(jumlahSyarat) && !konfirmasiSyarat) {
    throw validationError("Tandai kelengkapan syarat surat sebelum mengajukan verifikasi.");
  }

  await updateSuratVerification(villageId, id, {
    status: "verifikasi",
    verifikasiOperator: null,
    verifikasiSekdes: null,
    verifikasiKades: null,
    logVerifikasi: "diajukan",
    catatanVerifikasi: null,
  });
  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.suratSubmit,
    resource: SURAT_RESOURCE,
    resourceId: String(id),
  });
}

async function nomorUrutBerikutnya(
  mode: PenomoranSuratMode,
  villageId: number,
  jenis: JenisSuratDTO,
  year: number,
): Promise<number> {
  switch (mode) {
    case 1:
      return nextSuratSequenceGlobal(villageId, year);
    case 3:
      return nextSuratSequenceCombined(villageId, year);
    case 4:
      if (jenis.classificationId === null) {
        throw conflict(
          "Mode penomoran 4 memerlukan klasifikasi surat. Atur klasifikasi jenis surat terlebih dahulu.",
        );
      }
      return nextSuratSequenceByKlasifikasi(villageId, jenis.classificationId, year);
    default:
      return nextSuratSequence(villageId, jenis.id, year);
  }
}

async function nomorSudahDipakai(
  mode: PenomoranSuratMode,
  villageId: number,
  candidate: string,
): Promise<boolean> {
  return mode === 3
    ? suratNumberExistsWithAgenda(villageId, candidate)
    : suratNumberExists(villageId, candidate);
}

/**
 * Jalur TTE pasca-penerbitan.
 *
 * Konfigurasi efektif = pengaturan desa (`tte_config`) + kredensial
 * environment. Selama mode bukan `bsre` atau kredensial belum lengkap,
 * fungsi ini keluar tanpa I/O — penerbitan surat tidak pernah menunggu TTE.
 *
 * Kegagalan provider sengaja tidak melempar: surat tetap terbit tanpa TTE dan
 * operator hanya menerima peringatan pada log.
 */

async function prosesTteSurat(
  villageId: number,
  suratId: number,
  nomor: string,
  cetak: {
    desa: IdentitasDesa;
    jenisNama: string;
    tanggal: string;
    content: string;
    verificationUrl: string | null;
  },
): Promise<void> {
  try {
    const config = await getKonfigurasiTteEfektif(villageId);
    if (config.mode !== "bsre") return;

    // PDF yang ditandatangani menjadi arsip, jadi kop/footer harus sama
    // dengan hasil unduhan (Pengaturan Surat).
    const pengaturan = await bacaPengaturan(villageId);
    const pdf = await buildSuratPdf({
      desa: cetak.desa,
      jenisNama: cetak.jenisNama,
      nomor,
      tanggal: cetak.tanggal,
      content: cetak.content,
      verificationUrl: cetak.verificationUrl,
      headerTemplate: pengaturan.suratTemplateHeader,
      footerTemplate: pengaturan.suratTemplateFooter,
      tinggiHeaderCm: pengaturan.suratTinggiHeader,
      tinggiFooterCm: pengaturan.suratTinggiFooter,
      kopLogo: pengaturan.suratLogo || null,
      garisGanda: pengaturan.suratGarisGanda,
      lebarLogoPersen: pengaturan.suratLogoLebar,
      posisiLogo: pengaturan.suratLogoPosisi,
    });

    const hasil = await tandatanganiPdfTte({ villageId, suratId, nomor, pdf, config });

    if (!hasil.ok) {
      console.warn(`TTE tidak diterapkan pada surat ${nomor}: ${hasil.alasan}`);
      return;
    }

    const berkas = await simpanBerkasTte(villageId, nomor, hasil.pdf);
    await setSuratTte(villageId, suratId, true, berkas);
    await recordAuditEvent({
      villageId,
      event: AUDIT_EVENTS.tteSigned,
      resource: SURAT_RESOURCE,
      resourceId: String(suratId),
      details: { nomor, mode: "bsre" },
    });
  } catch (error) {
    // Jangan pernah menggagalkan penerbitan karena TTE.
    console.warn(
      `TTE tidak diterapkan pada surat ${nomor}: ${
        error instanceof Error ? error.message : "kesalahan tidak diketahui"
      }`,
    );
  }
}

/**
 * Terbitkan surat setelah tahap Kades disetujui.
 *
 * Nomor baru diberikan pada tahap akhir agar surat yang ditolak tidak
 * menghabiskan nomor urut.
 */

async function terbitkanSurat(
  villageId: number,
  surat: SuratDetail,
  desa: IdentitasDesa,
  actorId: string,
): Promise<{ number: string; verificationToken: string }> {
  const jenis = await loadJenis(villageId, surat.typeId);
  const penduduk = surat.residentId
    ? await getPendudukSuratData(villageId, surat.residentId)
    : null;
  if (jenis.requiresResident && !penduduk) {
    throw conflict("Surat ini membutuhkan data penduduk yang valid.");
  }

  const anggotaKeluarga = await loadAnggotaKeluarga(villageId, penduduk);
  const pengikutSurat = await loadPengikutSurat(villageId, surat.nilaiIsian);
  const letterDate = surat.letterDate ?? "-";
  const year = Number(letterDate.slice(0, 4));
  const month = Number(letterDate.slice(5, 7));
  const mode = normalizePenomoranMode(desa.penomoranSurat);
  const pengaturan = await bacaPengaturan(villageId);
  // `formatNomorGlobal = 1` memakai format desa yang sama untuk semua jenis surat,
  // sedangkan `0` memakai format khusus jenis surat ini (OpenSID `format_nomor_global`).
  const format =
    jenis.formatNomorGlobal === 1
      ? DEFAULT_NUMBER_FORMAT
      : jenis.numberFormat || DEFAULT_NUMBER_FORMAT;

  let sequence = await nomorUrutBerikutnya(mode, villageId, jenis, year);
  let number = "";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = buildSuratNumber(format, {
      sequence,
      kodeSurat: jenis.code,
      kodeDesa: desa.kodeDesa ?? "",
      year,
      month,
      panjangNomor: pengaturan.suratPanjangNomor,
    });

    if (!(await nomorSudahDipakai(mode, villageId, candidate))) {
      number = candidate;
      break;
    }
    sequence += 1;
  }

  if (number === "") throw conflict("Gagal menentukan nomor surat. Coba lagi.");

  const values = buildValues(
    surat,
    jenis,
    desa,
    penduduk,
    anggotaKeluarga,
    pengikutSurat,
    number,
    pengaturan,
  );
  const content = isiTerbilangDanHitung(renderSuratTemplate(jenis.templateBody, values), values);

  // Token verifikasi publik: token mentah dipakai untuk tautan/QR dan
  // disimpan agar bisa dicetak ulang; hash dipakai sebagai kunci pencarian.
  // Surat lama yang sudah terbit tanpa token tetap valid — token hanya
  // dihasilkan saat penerbitan baru.
  const { token, hash } = await generateVerificationToken();

  await issueSuratRecord(villageId, surat.id, {
    number,
    sequence,
    year,
    typeId: surat.typeId,
    classificationId: jenis.classificationId,
    typeName: jenis.name,
    content,
    issuedAt: new Date(),
    logVerifikasi: "kades",
    verificationToken: token,
    verificationTokenHash: hash,
  });
  await recordAuditEvent({
    villageId,
    actorId,
    event: AUDIT_EVENTS.suratVerify,
    resource: SURAT_RESOURCE,
    resourceId: String(surat.id),
    details: { tahap: "kades", nomor: number },
  });

  // TTE pasca-terbit: mode nonaktif (default) → keluar segera tanpa I/O.
  const origin = await getRequestOrigin();
  await prosesTteSurat(villageId, surat.id, number, {
    desa,
    jenisNama: jenis.name,
    tanggal: surat.letterDate ?? "-",
    content,
    verificationUrl: buildVerificationUrl(origin, token),
  });

  return { number, verificationToken: token };
}

/**
 * Verifikasi berjenjang pra-terbit: operator → sekdes → kades.
 *
 * Tahap Kades sekaligus menerbitkan surat dan memberi nomor. Role yang tidak
 * sesuai tahap ditolak, begitu pula upaya melompati urutan.
 */

export async function verifySuratData(
  id: number,
  step: VerificationStep,
): Promise<{ number: string | null; verificationToken: string | null }> {
  const user = await requirePermission(SURAT_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");

  const role = user.roleId === null ? null : await findRoleById(user.roleId, user.villageId);
  const validasi = validateVerification(
    role?.slug ?? null,
    user.id,
    {
      id: surat.id,
      status: surat.status,
      verifikasiOperator: surat.verifikasiOperator,
      verifikasiSekdes: surat.verifikasiSekdes,
      verifikasiKades: surat.verifikasiKades,
      createdBy: surat.createdBy,
    },
    step,
    user.permissions.isSuperadmin,
  );

  if (!validasi.ok) {
    const pesan = validasi.error ?? "Verifikasi tidak dapat dilakukan.";
    // Pelanggaran peran dan kepemilikan ditolak sebagai 403; tahap/urutan yang
    // sudah tidak berlaku tetap 409 agar UI membedakan konflik status.
    if (validasi.errorCode === "wrong-role" || validasi.errorCode === "own-submission") {
      throw forbidden(pesan);
    }
    throw conflict(pesan);
  }

  const pengaturan = await bacaPengaturan(villageId);

  if (step === "operator") {
    await updateSuratVerification(villageId, id, {
      verifikasiOperator: true,
      logVerifikasi: "operator",
      status: "verifikasi",
    });
    await recordAuditEvent({
      villageId,
      actorId: user.id,
      event: AUDIT_EVENTS.suratVerify,
      resource: SURAT_RESOURCE,
      resourceId: String(id),
      details: { tahap: step },
    });
    return lanjutSetelahTahap(
      villageId,
      { ...surat, verifikasiOperator: true },
      pengaturan,
      user.id,
    );
  }

  if (step === "sekdes") {
    await updateSuratVerification(villageId, id, {
      verifikasiSekdes: true,
      logVerifikasi: "sekdes",
      status: "verifikasi",
    });
    await recordAuditEvent({
      villageId,
      actorId: user.id,
      event: AUDIT_EVENTS.suratVerify,
      resource: SURAT_RESOURCE,
      resourceId: String(id),
      details: { tahap: step },
    });
    return lanjutSetelahTahap(
      villageId,
      { ...surat, verifikasiOperator: true, verifikasiSekdes: true },
      pengaturan,
      user.id,
    );
  }

  return finalisasiSurat(villageId, surat, user.id);
}

/**
 * Lanjutkan alur setelah satu tahap selesai.
 *
 * Bila Sekdes/Kades dimatikan pada Pengaturan Surat (`verifikasi_sekdes` /
 * `verifikasi_kades` OpenSID), tahap itu dianggap selesai otomatis sehingga
 * surat tidak tertahan menunggu pejabat yang tidak ikut memverifikasi.
 */

async function lanjutSetelahTahap(
  villageId: number,
  surat: SuratDetail,
  pengaturan: Pengaturan,
  actorId: string,
): Promise<{ number: string | null; verificationToken: string | null }> {
  let efektif = surat;

  if (!pengaturan.suratVerifikasiSekdes && !efektif.verifikasiSekdes) {
    await updateSuratVerification(villageId, efektif.id, {
      verifikasiSekdes: true,
      logVerifikasi: "sekdes",
      status: "verifikasi",
    });
    efektif = { ...efektif, verifikasiSekdes: true };
  }

  if (!pengaturan.suratVerifikasiKades && !efektif.verifikasiKades) {
    await updateSuratVerification(villageId, efektif.id, {
      verifikasiKades: true,
      logVerifikasi: "kades",
      status: "verifikasi",
    });
    efektif = { ...efektif, verifikasiKades: true };
  }

  if (efektif.verifikasiSekdes && efektif.verifikasiKades) {
    return finalisasiSurat(villageId, efektif, actorId);
  }

  return { number: null, verificationToken: null };
}

/** Terbitkan nomor surat lalu sinkronkan permohonan warga yang terhubung. */

async function finalisasiSurat(
  villageId: number,
  surat: SuratDetail,
  actorId: string,
): Promise<{ number: string | null; verificationToken: string | null }> {
  const desa = await getIdentitasDesa(villageId);
  if (!desa) throw notFound("Identitas desa belum dikonfigurasi.");
  const { number, verificationToken } = await terbitkanSurat(villageId, surat, desa, actorId);

  // Permohonan warga yang terhubung menjadi "Siap Diambil" begitu surat terbit.
  const permohonan = await findPermohonanByLetterId(villageId, surat.id);
  await sinkronStatusSuratPermohonan(villageId, surat.id, 3);
  if (permohonan && permohonan.status !== 3) {
    await notifyPermohonanStatusChange({
      villageId,
      residentId: permohonan.residentId,
      noAntrian: permohonan.noAntrian,
      statusLama: permohonan.status,
      statusBaru: 3,
    });
  }

  return { number, verificationToken };
}

export async function rejectSuratData(id: number, reason: string): Promise<void> {
  const user = await requirePermission(SURAT_RESOURCE, "update");
  const villageId = await resolveVillageId(user);

  const surat = await getSurat(villageId, id);
  if (!surat) throw notFound("Surat tidak ditemukan.");
  if (surat.status !== "verifikasi") {
    throw conflict("Hanya surat yang sedang menunggu verifikasi yang bisa ditolak.");
  }
  if (!reason?.trim()) throw conflict("Alasan penolakan wajib diisi.");

  const role = user.roleId === null ? null : await findRoleById(user.roleId, user.villageId);
  const nextStep = nextVerificationStep(surat);
  if (nextStep === null) {
    throw conflict("Surat ini sudah selesai diverifikasi.");
  }
  if (!roleCanVerifyStep(nextStep, role?.slug ?? null, user.permissions.isSuperadmin)) {
    throw forbidden(`Tahap ${VERIFICATION_STEP_LABELS[nextStep]} bukan wewenang role Anda.`);
  }
  if (!canVerifyStep(surat, nextStep)) {
    throw conflict(
      `Verifikasi harus berurutan. Tahap berikutnya: ${VERIFICATION_STEP_LABELS[nextStep]}.`,
    );
  }

  await rejectSurat(villageId, id, reason.trim());
  await recordAuditEvent({
    villageId,
    actorId: user.id,
    event: AUDIT_EVENTS.suratReject,
    resource: SURAT_RESOURCE,
    resourceId: String(id),
    details: { tahap: nextStep },
  });

  // Surat yang ditolak membuat permohonan terkait ikut dibatalkan dengan alasan.
  await sinkronStatusSuratPermohonan(villageId, id, 5, reason.trim());
}

/** Susun data cetak/PDF untuk desa & surat tertentu (tanpa cek izin). */

export async function getVerifikasiSuratData(input: { search: string; scope: ScopeVerifikasi }) {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  const villageId = await resolveVillageId(user);
  const role = user.roleId === null ? null : await findRoleById(user.roleId, user.villageId);
  const roleSlug = role?.slug ?? null;
  const isSuperadmin = user.permissions.isSuperadmin;

  const rows = await listAntreanVerifikasi(villageId, input.search);
  const antrean = susunAntreanVerifikasi(rows, roleSlug, isSuperadmin);
  const tersaring = saringAntreanVerifikasi(antrean, input.scope, roleSlug, isSuperadmin);

  return {
    rows: tersaring,
    totalAntrean: antrean.length,
    hitunganPerTahap: hitungAntreanPerTahap(antrean),
    roleSlug,
    isSuperadmin,
    tahapPengguna: tahapanUntukRole(roleSlug, isSuperadmin),
  };
}

export async function getSuratCurrentRoleSlugData(): Promise<string | null> {
  const user = await requirePermission(SURAT_RESOURCE, "read");
  if (user.roleId === null) return null;
  const role = await findRoleById(user.roleId, user.villageId);
  return role?.slug ?? null;
}

/**
 * Data cetak untuk warga pemilik surat.
 *
 * Hanya surat yang `residentId`-nya sama dengan sesi yang boleh dibaca. Surat
 * yang belum terbit (draft/verifikasi) tidak ditampilkan sebagai dokumen warga.
 */
