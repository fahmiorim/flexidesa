import type { ReactNode } from "react";

import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";

import { resolveTema } from "./registry";
import { validasiOpsiTenant, type SurfaceKey } from "./types";

type TemaRendererProps = {
  villageId: number;
  villageName: string | null;
  location: string;
  activePath?: string;
  surface?: SurfaceKey;
  children: ReactNode;
};

/**
 * Pembungkus tema server-side.
 *
 * Satu-satunya jembatan dari slug/versi database ke kode paket:
 * `muatTemaPublik` → `resolveTema` (registry statis) → opsi tervalidasi →
 * layout tema. Slug asing tanpa paket tidak dirender sebagai kode tak
 * terpercaya — konten dibungkus kerangka fallback netral.
 */
export async function TemaRenderer({
  villageId,
  villageName,
  location,
  activePath = "/",
  surface = "beranda",
  children,
}: TemaRendererProps) {
  const tema = await muatTemaPublik(villageId);
  const definisi = resolveTema(tema?.slug, tema?.versi);
  if (!definisi || !tema) {
    return (
      <div data-tema-fallback="ya" style={{ display: "contents" }}>
        {children}
      </div>
    );
  }
  const opsi = validasiOpsiTenant(definisi.opsi, tema.templateOptions ?? null);
  const Layout = definisi.layout;
  const Page = definisi.pages?.[surface];
  return (
    <Layout
      villageId={villageId}
      villageName={villageName}
      location={location}
      activePath={activePath}
      opsi={opsi}
      widgets={definisi.widgets}
      tema={{
        primary: tema.primary,
        secondary: tema.secondary,
        accent: tema.accent,
        background: tema.background,
        surface: tema.surface,
        text: tema.text,
        judulHero: tema.judulHero,
        layout: tema.layout,
        style: tema.style === "gelap" ? "gelap" : "terang",
      }}
    >
      {Page ? (
        <Page
          villageId={villageId}
          villageName={villageName}
          location={location}
          activePath={activePath}
          opsi={opsi}
          widgets={definisi.widgets}
        >
          {children}
        </Page>
      ) : (
        children
      )}
    </Layout>
  );
}
