import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import "./globals.css";
import "@/themes/cakrawala/1.0.0/cakrawala-publik.css";
import "@/themes/samudra/1.0.0/samudra-publik.css";

import { hostPlatform } from "@/features/info-desa/desa/application/platform-host";
import { getIdentitasFromRequest } from "@/features/info-desa/desa/application/resolve-village";
import { adalahHostPlatform } from "@/features/info-desa/desa/domain/host";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-config";

/** Ikon default aplikasi (host platform, landing page, dan fallback). */
const IKON_DEFAULT_APLIKASI = "/images/flexidesa-icon.svg";

/** Judul konsol platform dan fallback saat identitas desa tidak tersedia. */
const metadataAplikasi: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: { icon: IKON_DEFAULT_APLIKASI },
};

/**
 * Judul tab mengikuti tenant: halaman desa memakai nama desa, bukan nama
 * aplikasi. Host platform (konsol Super Admin) tetap memakai identitas
 * aplikasi. Host tak dikenal atau gagal resolusi memakai fallback aplikasi agar
 * metadata tidak pernah menggagalkan render halaman.
 */
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  if (adalahHostPlatform(host, hostPlatform)) return metadataAplikasi;

  try {
    const desa = await getIdentitasFromRequest();
    const namaDesa = desa.namaDesa?.trim();
    if (!namaDesa) return metadataAplikasi;

    return {
      title: {
        default: namaDesa,
        template: `%s | ${namaDesa}`,
      },
      description: `Portal informasi dan layanan Pemerintah ${namaDesa}.`,
      icons: { icon: "/api/publik/favicon" },
    };
  } catch {
    return metadataAplikasi;
  }
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
