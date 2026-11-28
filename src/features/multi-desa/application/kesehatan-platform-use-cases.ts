import "server-only";

import { daftarSemuaDomain } from "@/features/multi-desa/application/kelola-desa-use-cases";
import { daftarPemeriksaanDomain } from "@/features/multi-desa/application/pemantauan-domain-use-cases";
import { getKonfigurasiPlatform } from "@/features/multi-desa/application/platform-info-use-cases";
import { daftarDesaSuperAdmin } from "@/features/multi-desa/application/provisioning-use-cases";
import { statusRetensi } from "@/features/multi-desa/domain/lifecycle-tenant";
import { cekKoneksiBasisData } from "@/features/multi-desa/infrastructure/kesehatan-repository";

/**
 * Ringkasan kesehatan platform untuk operator.
 *
 * Hanya membaca data yang memang tersedia: koneksi basis data, sebaran
 * domain/DNS/SSL dari cache pemeriksaan nyata, kondisi tenant yang perlu
 * tindakan, dan konfigurasi integrasi. Pemakaian media per tenant sengaja tidak
 * dilaporkan karena belum pernah diukur (kuota ada, pemakaian tidak dicatat).
 */

interface PerhatianKesehatan {
  kunci: string;
  judul: string;
  keterangan: string;
  href: string;
  aksi: string;
}

interface KesehatanPlatform {
  basisData: {
    terhubung: boolean;
    /** Selisih waktu query sederhana, indikator kasar latensi. */
    latensiMs: number | null;
    error: string | null;
  };
  tenant: {
    total: number;
    aktif: number;
    nonaktif: number;
    siapPurge: number;
    tanpaDomain: number;
    tanpaTema: number;
  };
  domain: {
    total: number;
    sslAktif: number;
    sslSegeraExpired: number;
    sslBermasalah: number;
    sslBelumDiperiksa: number;
    dnsNormal: number;
    dnsBermasalah: number;
    dnsBelumDiperiksa: number;
  };
  integrasi: {
    baseDomain: string | null;
    emailAktif: boolean;
    tteAktif: boolean;
  };
  perhatian: PerhatianKesehatan[];
}

export async function ambilKesehatanPlatform(): Promise<KesehatanPlatform> {
  // Otorisasi dijalankan oleh use case sumber (semuanya memanggil
  // `requireSuperAdmin`); panggilan pertama di bawah memastikan gerbang itu
  // dievaluasi sebelum query kesehatan tambahan dijalankan.
  const [desa, domain, pemeriksaan, konfigurasi, basisData] = await Promise.all([
    daftarDesaSuperAdmin(),
    daftarSemuaDomain(),
    daftarPemeriksaanDomain(),
    getKonfigurasiPlatform(),
    cekKoneksiBasisData(),
  ]);

  const terhubung = basisData.terhubung;
  const error = basisData.error;

  const sslById = new Map(pemeriksaan.ssl.map((item) => [item.domainId, item]));
  const dnsById = new Map(pemeriksaan.dns.map((item) => [item.domainId, item]));

  let sslAktif = 0;
  let sslSegeraExpired = 0;
  let sslBermasalah = 0;
  let sslBelumDiperiksa = 0;
  let dnsNormal = 0;
  let dnsBermasalah = 0;
  let dnsBelumDiperiksa = 0;

  for (const item of domain) {
    const ssl = sslById.get(item.id)?.status ?? "belum-diperiksa";
    if (ssl === "aktif") sslAktif += 1;
    else if (ssl === "segera-expired") sslSegeraExpired += 1;
    else if (ssl === "bermasalah") sslBermasalah += 1;
    else sslBelumDiperiksa += 1;

    const dns = dnsById.get(item.id)?.status ?? "belum-diperiksa";
    if (dns === "normal") dnsNormal += 1;
    else if (dns === "bermasalah") dnsBermasalah += 1;
    else dnsBelumDiperiksa += 1;
  }

  const rows = desa.map((item) => ({ ...item, status: statusRetensi(item) }));
  const aktif = rows.filter((item) => item.active).length;
  const siapPurge = rows.filter((item) => item.status === "siap-purge").length;
  const nonaktif = rows.filter((item) => !item.active && item.status !== "sudah-purge").length;
  const berdomain = new Set(domain.map((item) => item.villageId)).size;
  const tanpaDomain = rows.length - berdomain;
  const tanpaTema = rows.filter((item) => !item.tema).length;

  const perhatian: PerhatianKesehatan[] = [];
  if (sslBermasalah > 0) {
    perhatian.push({
      kunci: "ssl",
      judul: `${sslBermasalah} domain bermasalah SSL`,
      keterangan: "Sertifikat tidak aktif atau gagal diperiksa; website dapat ditolak browser.",
      href: "/super-admin/domain",
      aksi: "Periksa domain",
    });
  }
  if (sslSegeraExpired > 0) {
    perhatian.push({
      kunci: "ssl-expired",
      judul: `${sslSegeraExpired} sertifikat segera kedaluwarsa`,
      keterangan: "Perpanjang sertifikat sebelum masa berlaku habis (< 30 hari).",
      href: "/super-admin/domain",
      aksi: "Jadwalkan perpanjangan",
    });
  }
  if (dnsBermasalah > 0) {
    perhatian.push({
      kunci: "dns",
      judul: `${dnsBermasalah} domain bermasalah DNS`,
      keterangan: "Alamat domain belum mengarah ke server platform.",
      href: "/super-admin/domain",
      aksi: "Tinjau DNS",
    });
  }
  if (tanpaDomain > 0) {
    perhatian.push({
      kunci: "tanpa-domain",
      judul: `${tanpaDomain} desa tanpa domain`,
      keterangan: "Tenant hanya dapat diakses lewat alamat bawaan.",
      href: "/super-admin/tenant",
      aksi: "Atur domain",
    });
  }
  if (tanpaTema > 0) {
    perhatian.push({
      kunci: "tanpa-tema",
      judul: `${tanpaTema} desa belum memilih tema`,
      keterangan: "Website desa memakai tema bawaan aplikasi.",
      href: "/super-admin/template/penggunaan",
      aksi: "Tinjau tema",
    });
  }
  if (siapPurge > 0) {
    perhatian.push({
      kunci: "purge",
      judul: `${siapPurge} desa siap purge`,
      keterangan: `Masa tenggang selesai; purge permanen menghapus data desa.`,
      href: "/super-admin/tenant?status=siap-purge",
      aksi: "Buka tenant",
    });
  }
  if (!terhubung) {
    perhatian.push({
      kunci: "basis-data",
      judul: "Koneksi basis data gagal",
      keterangan: error ?? "Query pemeriksaan tidak dapat dijalankan.",
      href: "/super-admin/pengaturan",
      aksi: "Periksa konfigurasi",
    });
  }

  return {
    basisData,
    tenant: { total: rows.length, aktif, nonaktif, siapPurge, tanpaDomain, tanpaTema },
    domain: {
      total: domain.length,
      sslAktif,
      sslSegeraExpired,
      sslBermasalah,
      sslBelumDiperiksa,
      dnsNormal,
      dnsBermasalah,
      dnsBelumDiperiksa,
    },
    integrasi: {
      baseDomain: konfigurasi.baseDomain,
      emailAktif: konfigurasi.emailAktif,
      tteAktif: konfigurasi.tteAktif,
    },
    perhatian,
  };
}
