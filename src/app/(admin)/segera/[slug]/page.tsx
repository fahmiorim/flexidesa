import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";

import { infoSegera } from "../segera-info";

interface Params {
  params: Promise<{ slug: string }>;
}

/** Judul tab mengikuti judul modul; slug tak dikenal memakai judul umum. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: infoSegera(slug)?.judul ?? "Segera Dibangun" };
}

/**
 * Halaman placeholder untuk modul yang halamannya belum dibangun penuh.
 *
 * Halaman ini menggantikan label "Segera" non-klik di sidebar: menu kini dapat
 * diklik dan menampilkan ringkasan fungsi, padanan OpenSID, serta rencana
 * fitur. Modul yang sudah punya halaman kanonis tetap diarahkan lewat halaman
 * redirect statis di folder ini (mis. `/segera/kelompok`).
 */
export default async function SegeraPage({ params }: Params) {
  const { slug } = await params;
  const info = infoSegera(slug);
  if (!info) notFound();

  return (
    <div className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>{info.judul}</h1>
            <p>Halaman ini sedang dibangun.</p>
          </div>
        </div>
      </PageHeading>
      <section className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Segera Dibangun</h2>
            <p className="modul-muted">{info.ringkasan}</p>
          </div>
        </div>
        <div className="modul-empty">
          <strong>Rencana fitur</strong>
          <ul>
            {info.rencana.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="modul-muted">{info.padanan}</p>
      </section>
    </div>
  );
}
