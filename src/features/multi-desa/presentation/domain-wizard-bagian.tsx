import type { StatusDns } from "@/features/multi-desa/domain/status-dns";

/** Desa yang dapat dipilih saat mendaftarkan domain. */
export interface DesaPilihanDomain {
  id: number;
  name: string | null;
  slug: string | null;
  district: string | null;
  regency: string | null;
  active: boolean;
  domain: string | null;
}

export const LANGKAH = [
  {
    nomor: 1,
    judul: "Pilih Tenant & Jenis",
    keterangan: "Tentukan desa dan tipe domain",
  },
  {
    nomor: 2,
    judul: "Konfigurasi Domain",
    keterangan: "Isi nama domain dan pengaturan",
  },
  {
    nomor: 3,
    judul: "Verifikasi & DNS",
    keterangan: "Cek arah DNS domain",
  },
  {
    nomor: 4,
    judul: "Aktivasi SSL",
    keterangan: "Pasang sertifikat SSL",
  },
  {
    nomor: 5,
    judul: "Selesai",
    keterangan: "Pendaftaran selesai",
  },
] as const;

const formatWaktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function labelDesa(desa: DesaPilihanDomain | null): string {
  return desa?.name?.trim() || (desa ? `Desa #${desa.id}` : "Belum dipilih");
}

export function kelasStatusDns(status: StatusDns): string {
  if (status === "normal") return "is-ok";
  if (status === "bermasalah") return "is-bad";
  return "is-unchecked";
}

export function kelasStatusSsl(status: string): string {
  if (status === "aktif") return "is-ok";
  if (status === "segera-expired") return "is-warn";
  if (status === "bermasalah") return "is-bad";
  return "is-unchecked";
}

export function formatTanggal(nilai: Date | null): string {
  return nilai ? formatWaktu.format(new Date(nilai)) : "-";
}

/** Pratinjau alamat dan identitas desa pada wizard. */

/** Ringkasan langkah dan penjelasan singkat tiap tahap pendaftaran. */

/** Tautan kembali ke daftar domain, dipakai pada footer wizard. */
