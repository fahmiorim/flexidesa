import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { getLayananDetailData } from "@/features/layanan-warga/pelayanan/application/layanan-use-cases";

export const metadata: Metadata = { title: "Detail Layanan" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const p = await params,
    id = Number(p.id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const r = await getLayananDetailData(id);
  if (!r) notFound();
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>{r.nama}</>}
        deskripsi={<>Detail konfigurasi layanan masyarakat.</>}
        aksi={
          <>
            <div className="table-actions">
              <ButtonLink variant="secondary" href="/pelayanan-publik/layanan">
                Kembali
              </ButtonLink>
              <ButtonLink variant="primary" href={"/pelayanan-publik/layanan/" + r.id + "/edit"}>
                Ubah Layanan
              </ButtonLink>
            </div>
          </>
        }
      />
      <section className="modul-card">
        <dl>
          <dt>Kategori</dt>
          <dd>{r.kategori}</dd>
          <dt>Status</dt>
          <dd>{r.aktif ? "Aktif" : "Nonaktif"}</dd>
          <dt>Estimasi</dt>
          <dd>{r.estimasiHari} hari kerja</dd>
          <dt>Biaya</dt>
          <dd>{r.biaya === 0 ? "Gratis" : r.biaya.toLocaleString("id-ID") + " rupiah"}</dd>
          <dt>Metode</dt>
          <dd>{r.metode}</dd>
          <dt>Deskripsi</dt>
          <dd>{r.deskripsi || "—"}</dd>
          <dt>Persyaratan</dt>
          <dd>
            <ul>
              {(r.persyaratan ?? "")
                .split("\n")
                .filter(Boolean)
                .map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
            </ul>
          </dd>
        </dl>
      </section>
    </div>
  );
}
