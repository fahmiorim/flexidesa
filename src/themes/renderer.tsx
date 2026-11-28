import type { ReactNode } from "react";

import { muatTemaPublik } from "@/features/info-desa/publik/application/website-admin";

import { resolveTema } from "./registry";
import {
  validasiOpsiTenant,
  type SurfaceKey,
  type ThemeBerandaData,
  type ThemeBerandaSlots,
  type ThemeHeroProps,
} from "./types";

type TemaRendererProps = {
  villageId: number;
  villageName: string | null;
  location: string;
  activePath?: string;
  surface?: SurfaceKey;
  /** Bagian beranda untuk paket yang ingin menyusun ulang komposisinya. */
  slots?: ThemeBerandaSlots;
  /** Data hero; diisi hanya bila paket menyediakan hero sendiri. */
  heroData?: ThemeHeroProps;
  /** Data beranda; diisi hanya bila paket merender isi beranda sendiri. */
  berandaData?: ThemeBerandaData;
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
  slots,
  heroData,
  berandaData,
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
  const Hero = definisi.hero && heroData ? definisi.hero : null;
  const BerandaTema =
    surface === "beranda" && definisi.beranda && berandaData ? definisi.beranda : null;
  return (
    <>
      {Hero && heroData ? <Hero {...heroData} /> : null}
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
        {BerandaTema && berandaData ? (
          <BerandaTema {...berandaData} />
        ) : Page ? (
          <Page
            villageId={villageId}
            villageName={villageName}
            location={location}
            activePath={activePath}
            opsi={opsi}
            widgets={definisi.widgets}
            slots={slots}
          >
            {children}
          </Page>
        ) : (
          children
        )}
      </Layout>
    </>
  );
}
