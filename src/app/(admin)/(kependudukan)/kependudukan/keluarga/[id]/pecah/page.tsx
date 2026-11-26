import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { pecahKeluargaAction } from "@/app/(admin)/(kependudukan)/kependudukan/keluarga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { getKeluargaDetail } from "@/features/kependudukan/keluarga/application/use-cases";
import {
  HEAD_OF_FAMILY_RELATION_ID,
  KELUARGA_RESOURCE,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Pecah Kartu Keluarga" };

export default async function PecahKeluargaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [detail, user] = await Promise.all([getKeluargaDetail(id), verifySession()]);
  if (!hasPermission(user.permissions, KELUARGA_RESOURCE, "update")) notFound();

  const kepala = detail.members.find((member) => member.relationId === HEAD_OF_FAMILY_RELATION_ID);
  const calonKepala = detail.members.filter(
    (member) => member.lifeStatus === "alive" && member.relationId !== HEAD_OF_FAMILY_RELATION_ID,
  );
  if (!kepala || kepala.lifeStatus === "alive" || calonKepala.length === 0) notFound();

  return (
    <div className="modul-page penduduk-page data-kependudukan-page keluarga-page">
      <Link className="penduduk-back" href={`/kependudukan/keluarga/${id}`}>
        ← Kembali ke detail KK
      </Link>
      <PageHeading
        judul={<>Pecah Kartu Keluarga</>}
        deskripsi={<>Pindahkan anggota ke KK baru dan pilih kepalanya.</>}
      />

      <section className="platform-card data-panel">
        <dl className="penduduk-detail-grid">
          <div>
            <dt>KK Lama</dt>
            <dd className="modul-mono">{detail.keluarga.number}</dd>
          </div>
          <div>
            <dt>Kepala Keluarga Lama</dt>
            <dd>{detail.headName ?? "—"}</dd>
          </div>
          <div>
            <dt>Anggota Hidup yang Dipindah</dt>
            <dd>{calonKepala.length} orang</dd>
          </div>
        </dl>
      </section>

      <section className="platform-card data-panel">
        <form action={pecahKeluargaAction.bind(null, id)} className="form-stack">
          <header className="data-section-heading">
            <div>
              <h2>Keluarga Baru</h2>
              <p>Nomor KK baru dan anggota yang akan menjadi kepala keluarga.</p>
            </div>
          </header>
          <div className="modul-form-grid">
            <label className="form-field">
              <span className="form-label">Nomor Kartu Keluarga Baru</span>
              <input
                className="form-input"
                inputMode="numeric"
                maxLength={16}
                name="number"
                pattern="[0-9]{16}"
                placeholder="16 angka"
              />
              <span className="form-help">
                Wajib 16 angka untuk KK permanen; kosongkan bila memakai nomor sementara.
              </span>
            </label>
            <label className="form-field">
              <span className="form-label">Nomor KK sementara</span>
              <span className="form-check">
                <input name="temporary" type="checkbox" />
                <span>Buat nomor sementara otomatis</span>
              </span>
            </label>
          </div>
          <label className="form-field">
            <span className="form-label">Kepala Keluarga Baru</span>
            <select className="form-input" defaultValue="" name="headResidentId" required>
              <option value="">Pilih anggota...</option>
              {calonKepala.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nationalId ? `${member.nationalId} - ` : ""}
                  {member.name}
                  {member.relationName ? ` (${member.relationName})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="penduduk-heading-actions">
            <Link className="button button-secondary" href={`/kependudukan/keluarga/${id}`}>
              Batal
            </Link>
            <button className="button button-primary" type="submit">
              Pecah &amp; Buat KK Baru
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
