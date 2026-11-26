import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getWebsiteSettingsData } from "@/features/info-desa/publik/application/website-admin";

import { WebsiteAdminShell, WebsiteSection } from "../website-admin-shell";

export const metadata: Metadata = { title: "Pengaturan Website Desa" };

const mediaUrl = (path: string | null) =>
  path ? `/api/publik/media/${path.split("/").map(encodeURIComponent).join("/")}` : null;

export default async function WebsiteSettingsPage() {
  const data = await getWebsiteSettingsData();
  const desa = data.identitas;
  const domain = desa?.domain
    ? `https://${desa.domain}`
    : desa?.website?.startsWith("http")
      ? desa.website
      : null;
  const logoUrl = mediaUrl(desa?.logo ?? null);
  const wilayah = [desa?.namaKecamatan, desa?.namaKabupaten, desa?.namaPropinsi]
    .filter(Boolean)
    .join(", ");

  return (
    <WebsiteAdminShell title="Pengaturan Website" description="Kelola domain website desa.">
      <div className="website-settings-layout">
        <div className="website-settings-main">
          <WebsiteSection title="Identitas Desa">
            <p className="website-hint">
              Identitas desa dikelola di halaman Identitas Desa agar tidak ganda.
            </p>
            <div className="website-details">
              <div>
                <dt>Nama desa</dt>
                <dd>{desa?.namaDesa ?? "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Kode desa</dt>
                <dd>{desa?.kodeDesa ?? "—"}</dd>
              </div>
              <div>
                <dt>Wilayah</dt>
                <dd>{wilayah || "—"}</dd>
              </div>
              <div>
                <dt>Alamat kantor</dt>
                <dd>{desa?.alamatKantor ?? "—"}</dd>
              </div>
              <div>
                <dt>Kontak</dt>
                <dd>{[desa?.emailDesa, desa?.telepon].filter(Boolean).join(" · ") || "—"}</dd>
              </div>
              <div>
                <dt>Logo</dt>
                <dd>
                  {logoUrl ? (
                    <Image alt="Logo desa" height={36} src={logoUrl} unoptimized width={36} />
                  ) : (
                    "Belum diunggah"
                  )}
                </dd>
              </div>
            </div>
            <Link
              className="website-button website-button-outline"
              href="/profil-desa/identitas-desa"
            >
              Ubah di Identitas Desa
            </Link>
          </WebsiteSection>
          <WebsiteSection title="Domain & Akses Website">
            <div className="website-details" id="domain">
              <div>
                <dt>Domain utama</dt>
                <dd>{desa?.domain ?? "Belum dipetakan oleh Super Admin"}</dd>
              </div>
              <div>
                <dt>URL publik</dt>
                <dd>
                  {domain ? (
                    <Link href={domain} target="_blank" rel="noreferrer">
                      {domain}
                    </Link>
                  ) : (
                    "Belum tersedia"
                  )}
                </dd>
              </div>
            </div>
            <p className="website-hint">
              Domain dan SSL dikelola Super Admin; admin desa hanya mengubah alamat profil.
            </p>
          </WebsiteSection>
        </div>
        <aside className="website-settings-aside">
          <WebsiteSection title="Status & Akses Website">
            <div className="website-status-banner">
              <span>●</span>
              <div>
                <strong>{domain ? "Domain terkonfigurasi" : "Domain belum terkonfigurasi"}</strong>
                <small>
                  {domain
                    ? "Domain utama telah dipetakan."
                    : "Hubungi Super Admin untuk pemetaan domain."}
                </small>
              </div>
            </div>
            <dl className="website-details">
              <div>
                <dt>Identitas desa</dt>
                <dd>
                  {desa?.namaDesa && desa?.alamatKantor
                    ? "Identitas dasar tersedia"
                    : "Perlu dilengkapi"}
                </dd>
              </div>
              <div>
                <dt>Tema aktif</dt>
                <dd>{data.tema?.nama ?? "Belum disiapkan"}</dd>
              </div>
            </dl>
          </WebsiteSection>
        </aside>
      </div>
    </WebsiteAdminShell>
  );
}
