import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { hapusKeluargaAction, lepasAnggotaKeluargaAction } from "@/app/(admin)/keluarga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getKeluargaDetail } from "@/features/keluarga/application/use-cases";
import {
  AKSI_LOG_LABELS,
  formatTanggalKeluarga,
  HEAD_OF_FAMILY_RELATION_ID,
  KELUARGA_RESOURCE,
  welfareClassLabel,
} from "@/features/keluarga/domain/keluarga";
import { LIFE_STATUS_LABELS, PENDUDUK_RESOURCE } from "@/features/penduduk/domain/penduduk";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Detail Kartu Keluarga" };
const number = new Intl.NumberFormat("id-ID");
const waktu = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  return kata
    .slice(0, 2)
    .map((bagian) => bagian.charAt(0).toUpperCase())
    .join("");
}

export default async function DetailKeluargaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: raw }, query] = await Promise.all([params, searchParams]);
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [detail, user] = await Promise.all([getKeluargaDetail(id), verifySession()]);
  const bolehUbahKk = hasPermission(user.permissions, KELUARGA_RESOURCE, "update");
  const bolehHapusKk = hasPermission(user.permissions, KELUARGA_RESOURCE, "delete");
  const bolehUbahPenduduk = hasPermission(user.permissions, PENDUDUK_RESOURCE, "update");
  const bolehTambahPenduduk = hasPermission(user.permissions, PENDUDUK_RESOURCE, "create");
  const kepala = detail.members.find((member) => member.relationId === HEAD_OF_FAMILY_RELATION_ID);
  const bolehPecah =
    bolehUbahKk &&
    kepala !== undefined &&
    kepala.lifeStatus !== "alive" &&
    detail.members.some((member) => member.lifeStatus === "alive");
  const anggotaHidup = detail.members.filter((member) => member.lifeStatus === "alive").length;
  const anggotaRtm = detail.members.filter((member) => member.rtmNumber).length;

  return (
    <div className="modul-page penduduk-page data-kependudukan-page keluarga-page">
      <Link className="penduduk-back" href="/keluarga">
        ← Kembali ke daftar Kartu Keluarga
      </Link>

      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Detail Kartu Keluarga</h1>
            <p>Profil keluarga, anggota, rumah tangga, dan riwayat perubahannya.</p>
          </div>
        </header>
      </PageHeading>

      {query.memberRemoved === "1" ? (
        <div className="alert alert-success" role="status">
          Anggota berhasil dilepas dari Kartu Keluarga ini.
        </div>
      ) : null}

      <section className="keluarga-hero">
        <div className="keluarga-hero-main">
          <span className="keluarga-hero-eyebrow">Kartu Keluarga</span>
          <div className="keluarga-hero-number-row">
            <strong>{detail.keluarga.number}</strong>
            <span
              className="beranda-chip"
              data-tone={detail.keluarga.temporary ? "oranye" : "hijau"}
            >
              {detail.keluarga.temporary ? "Sementara" : "Permanen"}
            </span>
          </div>
          <p>
            {detail.headName ?? "Kepala keluarga belum ditentukan"} ·{" "}
            {number.format(detail.members.length)} anggota tercatat
          </p>
        </div>
        <dl className="keluarga-hero-meta">
          <div>
            <dt>Wilayah</dt>
            <dd>{detail.regionLabel ?? "Belum ditentukan"}</dd>
          </div>
          <div>
            <dt>Terdaftar</dt>
            <dd>{formatTanggalKeluarga(detail.keluarga.registeredAt) ?? "—"}</dd>
          </div>
          <div>
            <dt>Terakhir dicetak</dt>
            <dd>{formatTanggalKeluarga(detail.keluarga.cardPrintedAt) ?? "Belum dicetak"}</dd>
          </div>
        </dl>
      </section>

      <div className="penduduk-detail-layout">
        <div className="penduduk-detail-main">
          <section className="platform-card penduduk-card">
            <div className="penduduk-card-head">
              <div>
                <h2>Informasi Keluarga</h2>
                <p>Data administrasi dan domisili yang tercatat pada KK.</p>
              </div>
            </div>
            <dl className="penduduk-detail-grid">
              <div className="penduduk-detail-lebar">
                <dt>Alamat</dt>
                <dd>{detail.keluarga.address ?? "Belum diisi"}</dd>
              </div>
              <div>
                <dt>Dusun / RT / RW</dt>
                <dd>{detail.regionLabel ?? "Belum ditentukan"}</dd>
              </div>
              <div>
                <dt>Kelas sosial</dt>
                <dd>{welfareClassLabel(detail.keluarga.welfareClass)}</dd>
              </div>
              <div>
                <dt>Kepala keluarga</dt>
                <dd>{detail.headName ?? "Belum ditentukan"}</dd>
              </div>
              <div>
                <dt>Status nomor KK</dt>
                <dd>{detail.keluarga.temporary ? "Sementara" : "Permanen"}</dd>
              </div>
            </dl>
          </section>

          <section className="platform-card penduduk-card">
            <div className="penduduk-card-head">
              <div>
                <h2>Anggota Keluarga</h2>
                <p>
                  {number.format(anggotaHidup)} anggota hidup
                  {anggotaRtm > 0
                    ? ` · ${number.format(anggotaRtm)} sudah masuk rumah tangga`
                    : " · belum ada yang masuk rumah tangga"}
                </p>
              </div>
              {bolehTambahPenduduk ? (
                <Link className="button button-primary" href={`/penduduk/baru?familyId=${id}`}>
                  + Tambah Anggota
                </Link>
              ) : null}
            </div>
            {detail.members.length ? (
              <div className="modul-scroll">
                <table className="modul-table penduduk-table keluarga-member-table">
                  <thead>
                    <tr>
                      <th scope="col">No</th>
                      <th scope="col">Anggota</th>
                      <th scope="col">NIK</th>
                      <th scope="col">JK</th>
                      <th scope="col">Hubungan</th>
                      <th scope="col">Status</th>
                      <th scope="col">RTM</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.members.map((member, index) => (
                      <tr key={member.id}>
                        <td className="penduduk-nomor">{index + 1}</td>
                        <td>
                          <div className="penduduk-identitas">
                            <span
                              aria-hidden="true"
                              className={
                                member.gender === "female"
                                  ? "penduduk-avatar is-female"
                                  : "penduduk-avatar"
                              }
                            >
                              {inisial(member.name)}
                            </span>
                            <Link className="penduduk-nama" href={`/penduduk/${member.id}`}>
                              {member.name}
                            </Link>
                          </div>
                        </td>
                        <td>
                          <span className="penduduk-nik">{member.nationalId ?? "—"}</span>
                        </td>
                        <td>{member.gender === "male" ? "L" : "P"}</td>
                        <td>{member.relationName ?? "Belum ditentukan"}</td>
                        <td>
                          <span
                            className="beranda-chip"
                            data-tone={member.lifeStatus === "alive" ? "hijau" : "oranye"}
                          >
                            {LIFE_STATUS_LABELS[member.lifeStatus]}
                          </span>
                        </td>
                        <td>
                          {member.rtmNumber ? (
                            <span className="modul-mono">{member.rtmNumber}</span>
                          ) : (
                            <span className="modul-muted">Belum ada</span>
                          )}
                        </td>
                        <td>
                          <div className="keluarga-row-actions">
                            <Link className="penduduk-aksi" href={`/penduduk/${member.id}`}>
                              Detail
                            </Link>
                            {bolehUbahPenduduk ? (
                              <Link className="penduduk-aksi" href={`/penduduk/${member.id}/ubah`}>
                                Ubah
                              </Link>
                            ) : null}
                          </div>
                          {bolehUbahPenduduk &&
                          !(
                            member.relationName?.toLowerCase().includes("kepala") &&
                            detail.members.length > 1
                          ) ? (
                            <form action={lepasAnggotaKeluargaAction} className="inline-form">
                              <input name="id" type="hidden" value={member.id} />
                              <input name="familyId" type="hidden" value={id} />
                              <button className="button button-danger" type="submit">
                                Lepas
                              </button>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="modul-empty">
                Belum ada anggota pada KK ini. Tambahkan anggota atau lengkapi data keluarga.
              </p>
            )}
          </section>

          <section className="platform-card penduduk-card">
            <div className="penduduk-card-head">
              <div>
                <h2>Riwayat Perubahan</h2>
                <p>Jejak perubahan keanggotaan pada Kartu Keluarga ini.</p>
              </div>
            </div>
            {detail.logs.length ? (
              <ol className="keluarga-timeline">
                {detail.logs.map((log) => (
                  <li key={log.id}>
                    <span aria-hidden="true" className="keluarga-timeline-dot" />
                    <div>
                      <strong>{log.residentName}</strong>
                      <p>{AKSI_LOG_LABELS[log.aksi]}</p>
                      <small>
                        {waktu.format(new Date(log.createdAt))} · {log.actorName ?? "Sistem"}
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="modul-empty">Belum ada riwayat perubahan anggota.</p>
            )}
          </section>
        </div>

        <aside className="penduduk-detail-rail">
          <section className="platform-card keluarga-action-card">
            <h2>Aksi KK</h2>
            <p>Cetak, ubah, atau proses keluarga ini.</p>
            <div className="keluarga-action-list">
              {bolehUbahKk ? (
                <Link className="button button-secondary" href={`/keluarga/${id}/ubah`}>
                  Ubah Data KK
                </Link>
              ) : null}
              <Link className="button button-primary" href={`/keluarga/${id}/pdf`} target="_blank">
                Cetak KK
              </Link>
              <Link className="button button-secondary" href={`/keluarga/${id}/pdf?unduh=1`}>
                Unduh KK
              </Link>
              {bolehPecah ? (
                <Link className="button button-secondary" href={`/keluarga/${id}/pecah`}>
                  Pecah KK
                </Link>
              ) : null}
              {bolehHapusKk && detail.members.length === 0 ? (
                <form action={hapusKeluargaAction}>
                  <input name="id" type="hidden" value={id} />
                  <ConfirmSubmit
                    className="button button-danger button-block"
                    message="Hapus Kartu Keluarga kosong ini?"
                  >
                    Hapus KK Kosong
                  </ConfirmSubmit>
                </form>
              ) : null}
            </div>
          </section>

          <section className="penduduk-detail-catatan">
            <h2>Ringkasan Keluarga</h2>
            <dl className="keluarga-mini-summary">
              <div>
                <dt>Anggota tercatat</dt>
                <dd>{number.format(detail.members.length)} orang</dd>
              </div>
              <div>
                <dt>Anggota hidup</dt>
                <dd>{number.format(anggotaHidup)} orang</dd>
              </div>
              <div>
                <dt>Sudah punya RTM</dt>
                <dd>{number.format(anggotaRtm)} orang</dd>
              </div>
            </dl>
            <p>RTM dapat dibuat kolektif dari daftar KK.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
