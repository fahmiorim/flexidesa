import Link from "next/link";

import type { TokenTemplate } from "@/features/multi-desa/domain/template-website";
import type { ActionState } from "@/lib/action-state";

import { PlatformCard } from "./platform-ui";

export interface PilihanTemplateTenant {
  id: number;
  slug: string;
  name: string;
  description: string;
  version: string;
  tokens: TokenTemplate;
}

export interface PilihanPaketTenant {
  planId: number;
  planSlug: string;
  planName: string;
  description: string | null;
  versionId: number;
  version: number;
  features: readonly { slug: string; name: string }[];
}

export const LANGKAH = [
  { nomor: 1, judul: "Identitas Desa", keterangan: "Nama, kode, dan wilayah desa" },
  { nomor: 2, judul: "Domain", keterangan: "Alamat website desa" },
  { nomor: 3, judul: "Template", keterangan: "Tema website publik" },
  { nomor: 4, judul: "Paket", keterangan: "Langganan tenant baru" },
  { nomor: 5, judul: "Administrator", keterangan: "Akun admin desa pertama" },
  { nomor: 6, judul: "Ringkasan", keterangan: "Periksa lalu buat tenant" },
] as const;

export const slugDariNama = (nama: string): string => {
  const dasar = nama
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return dasar || "desa";
};

/** Pratinjau alamat dan identitas desa yang sedang didaftarkan. */
export function PratinjauTenantCard({
  hostTarget,
  namaDesa,
  kodeDesa,
}: {
  hostTarget: string | null;
  namaDesa: string;
  kodeDesa: string;
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
          <span className="domain-preview-url">{hostTarget ?? "domain-belum-dipilih"}</span>
        </div>
        <div className="domain-preview-nav">
          <span className="domain-preview-brand">
            <span aria-hidden="true">{(namaDesa.trim().charAt(0) || "D").toUpperCase()}</span>
            {namaDesa.trim() || "Desa baru"}
          </span>
          <span>Beranda</span>
          <span>Profil</span>
          <span>Layanan</span>
          <span>Berita</span>
          <span>Kontak</span>
        </div>
        <div className="domain-preview-hero">
          <div>
            <strong>{namaDesa.trim() || "Desa baru"}</strong>
            <span>Kode {kodeDesa.trim() || "—"}</span>
          </div>
        </div>
        <p className="domain-preview-caption">
          Pratinjau alamat dan identitas desa. Tampilan situs mengikuti tema terpilih.
        </p>
      </div>
    </PlatformCard>
  );
}

/** Daftar langkah pendaftaran tenant beserta statusnya. */
export function AlurTenantCard({ langkahTampil }: { langkahTampil: number }) {
  return (
    <PlatformCard title="Alur Pendaftaran Tenant">
      <ol className="domain-wizard-flow">
        {LANGKAH.map((item) => (
          <li
            className={
              item.nomor < langkahTampil
                ? "is-done"
                : item.nomor === langkahTampil
                  ? "is-active"
                  : undefined
            }
            key={item.nomor}
          >
            <span aria-hidden="true">{item.nomor < langkahTampil ? "✓" : item.nomor}</span>
            <div>
              <strong>{item.judul}</strong>
              <p>{item.keterangan}</p>
            </div>
          </li>
        ))}
      </ol>
    </PlatformCard>
  );
}

/** Ringkasan seluruh isian sebelum tenant dibuat. */
export function RingkasanTenant({
  namaDesa,
  kodeDesa,
  hostTarget,
  officeAddress,
  phone,
  emailDesa,
  templateTerpilih,
  paketTerpilih,
  adminName,
  adminUsername,
  adminEmail,
  kuotaMediaMb,
  formState,
}: {
  namaDesa: string;
  kodeDesa: string;
  hostTarget: string | null;
  officeAddress: string;
  phone: string;
  emailDesa: string;
  templateTerpilih: PilihanTemplateTenant | null;
  paketTerpilih: PilihanPaketTenant | null;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  kuotaMediaMb: string;
  formState: ActionState<{ id: number }>;
}) {
  return (
    <PlatformCard>
      <div className="domain-wizard-card-head">
        <div>
          <span className="domain-wizard-eyebrow">Langkah 6</span>
          <h2>Ringkasan pendaftaran</h2>
          <p>Periksa kembali sebelum tenant dibuat. Fondasi tenant disalin otomatis.</p>
        </div>
      </div>

      <dl className="domain-wizard-finish-list">
        <div>
          <dt>Desa</dt>
          <dd>
            {namaDesa} · kode {kodeDesa}
          </dd>
        </div>
        <div>
          <dt>Domain</dt>
          <dd>{hostTarget ?? "Belum diisi"}</dd>
        </div>
        <div>
          <dt>Kontak desa</dt>
          <dd>
            {[officeAddress.trim(), phone.trim(), emailDesa.trim()].filter(Boolean).join(" · ") ||
              "Belum diisi"}
          </dd>
        </div>
        <div>
          <dt>Template</dt>
          <dd>
            {templateTerpilih
              ? `${templateTerpilih.name} · v${templateTerpilih.version}`
              : "Tema bawaan platform"}
          </dd>
        </div>
        <div>
          <dt>Paket</dt>
          <dd>
            {paketTerpilih
              ? `${paketTerpilih.planName} · v${paketTerpilih.version}`
              : "Belum dipilih"}
          </dd>
        </div>
        <div>
          <dt>Administrator</dt>
          <dd>
            {adminName} · {adminUsername} · {adminEmail}
          </dd>
        </div>
        <div>
          <dt>Kuota media</dt>
          <dd>{kuotaMediaMb.trim() ? `${kuotaMediaMb} MB` : "Tanpa batas"}</dd>
        </div>
      </dl>

      {formState.status === "error" ? (
        <p className="domain-wizard-note is-error" role="alert">
          {formState.message}
        </p>
      ) : null}
    </PlatformCard>
  );
}

/** Kartu hasil setelah tenant berhasil dibuat. */
export function TenantSelesai({
  namaDesa,
  kodeDesa,
  hostTarget,
  templateTerpilih,
  paketTerpilih,
  adminName,
  adminUsername,
  onMulaiLagi,
}: {
  namaDesa: string;
  kodeDesa: string;
  hostTarget: string | null;
  templateTerpilih: PilihanTemplateTenant | null;
  paketTerpilih: PilihanPaketTenant | null;
  adminName: string;
  adminUsername: string;
  onMulaiLagi: () => void;
}) {
  return (
    <PlatformCard>
      <div className="domain-wizard-finish">
        <span className="domain-wizard-finish-icon" aria-hidden="true">
          ✓
        </span>
        <span className="domain-wizard-eyebrow">Selesai</span>
        <h2>Tenant {namaDesa} berhasil dibuat</h2>
        <p>
          Fondasi tenant (role, modul, tema, menu publik) sudah disalin dan akun administrator sudah
          siap dipakai.
        </p>

        <dl className="domain-wizard-finish-list">
          <div>
            <dt>Desa</dt>
            <dd>
              {namaDesa} · kode {kodeDesa}
            </dd>
          </div>
          <div>
            <dt>Domain</dt>
            <dd>{hostTarget ?? "Belum diisi"}</dd>
          </div>
          <div>
            <dt>Template</dt>
            <dd>
              {templateTerpilih
                ? `${templateTerpilih.name} · v${templateTerpilih.version}`
                : "Tema bawaan platform"}
            </dd>
          </div>
          <div>
            <dt>Paket</dt>
            <dd>
              {paketTerpilih
                ? `${paketTerpilih.planName} · v${paketTerpilih.version}`
                : "Belum dipilih"}
            </dd>
          </div>
          <div>
            <dt>Administrator</dt>
            <dd>
              {adminName} · {adminUsername}
            </dd>
          </div>
        </dl>

        <div className="domain-wizard-finish-actions">
          <Link className="button button-primary" href="/super-admin/tenant">
            Lihat Konsol Tenant
          </Link>
          <button className="button button-secondary" onClick={onMulaiLagi} type="button">
            Tambah Tenant Lain
          </button>
        </div>
      </div>
    </PlatformCard>
  );
}
