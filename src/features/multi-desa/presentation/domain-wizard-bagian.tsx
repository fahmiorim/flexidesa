import Link from "next/link";

import type { StatusDns } from "@/features/multi-desa/domain/status-dns";

import { PlatformCard } from "./platform-ui";

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

export function lokasiDesa(desa: DesaPilihanDomain | null): string {
  if (!desa) return "Pilih desa untuk melihat lokasi";
  const bagian = [
    desa.district ? `Kec. ${desa.district}` : null,
    desa.regency ? `Kab. ${desa.regency}` : null,
  ].filter(Boolean);

  return bagian.length > 0 ? bagian.join(", ") : "Kecamatan dan kabupaten belum diisi";
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
export function PratinjauDomainCard({
  desaTerpilih,
  hostTampil,
}: {
  desaTerpilih: DesaPilihanDomain | null;
  hostTampil: string;
}) {
  return (
    <PlatformCard title="Pratinjau Domain">
      <div className="domain-preview">
        <div className="domain-preview-browser">
          <span className="domain-preview-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="domain-preview-url">
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <rect height="11" rx="2" width="14" x="5" y="10" />
              <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
            </svg>
            {hostTampil || "domain-belum-dipilih"}
          </span>
        </div>
        <div className="domain-preview-nav">
          <span className="domain-preview-brand">
            <span aria-hidden="true">{labelDesa(desaTerpilih).charAt(0).toUpperCase()}</span>
            {labelDesa(desaTerpilih)}
          </span>
          <span>Beranda</span>
          <span>Profil</span>
          <span>Layanan</span>
          <span>Berita</span>
          <span>Kontak</span>
        </div>
        <div className="domain-preview-hero">
          <span className="domain-preview-hero-pattern" aria-hidden="true" />
          <div>
            <strong>{labelDesa(desaTerpilih)}</strong>
            <span>
              {desaTerpilih?.district
                ? `Kecamatan ${desaTerpilih.district}`
                : "Kecamatan belum diisi"}
            </span>
            <span>
              {desaTerpilih?.regency
                ? `Kabupaten ${desaTerpilih.regency}`
                : "Kabupaten belum diisi"}
            </span>
          </div>
        </div>
        <p className="domain-preview-caption">
          Pratinjau alamat dan identitas desa. Tampilan situs mengikuti tema aktif tenant.
        </p>
      </div>
    </PlatformCard>
  );
}

/** Ringkasan langkah dan penjelasan singkat tiap tahap pendaftaran. */
export function AlurPendaftaranCard({ langkah }: { langkah: number }) {
  return (
    <PlatformCard title="Alur Pendaftaran Domain">
      <ol className="domain-wizard-flow">
        {LANGKAH.map((item) => (
          <li
            className={
              item.nomor < langkah ? "is-done" : item.nomor === langkah ? "is-active" : undefined
            }
            key={item.nomor}
          >
            <span aria-hidden="true">{item.nomor < langkah ? "✓" : item.nomor}</span>
            <div>
              <strong>{item.judul}</strong>
              <p>
                {item.nomor === 1
                  ? "Tentukan desa dan tipe domain (subdomain/custom)."
                  : item.nomor === 2
                    ? "Isi nama domain dan pengaturan terkait."
                    : item.nomor === 3
                      ? "Periksa resolusi DNS domain (wajib untuk custom domain)."
                      : item.nomor === 4
                        ? "Pemeriksaan sertifikat SSL setelah DNS mengarah ke server."
                        : "Domain tersimpan; selesaikan DNS/SSL agar siap dipakai."}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </PlatformCard>
  );
}

/** Tautan kembali ke daftar domain, dipakai pada footer wizard. */
export function BatalDomainLink() {
  return (
    <Link className="button button-secondary domain-wizard-cancel" href="/super-admin/domain">
      <span aria-hidden="true">✕</span> Batal
    </Link>
  );
}
