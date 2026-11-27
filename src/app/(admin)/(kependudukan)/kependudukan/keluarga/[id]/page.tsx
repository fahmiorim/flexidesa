import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  hapusKeluargaAction,
  lepasAnggotaKeluargaAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/keluarga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { getKeluargaDetail } from "@/features/kependudukan/keluarga/application/use-cases";
import {
  AKSI_LOG_LABELS,
  formatTanggalKeluarga,
  HEAD_OF_FAMILY_RELATION_ID,
  KELUARGA_RESOURCE,
  welfareClassLabel,
} from "@/features/kependudukan/keluarga/domain/keluarga";
import {
  LIFE_STATUS_LABELS,
  PENDUDUK_RESOURCE,
} from "@/features/kependudukan/penduduk/domain/penduduk";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
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
      <Link className="penduduk-back" href="/kependudukan/keluarga">
        ← Kembali ke daftar Kartu Keluarga
      </Link>

      <PageHeading
        judul={<>Detail Kartu Keluarga</>}
        deskripsi={<>Profil keluarga, anggota, rumah tangga, dan riwayat perubahannya.</>}
      />

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
                <ButtonLink variant="primary" href={`/kependudukan/penduduk/baru?familyId=${id}`}>
                  + Tambah Anggota
                </ButtonLink>
              ) : null}
            </div>
            {detail.members.length ? (
              <TableScroll>
                <Table className="penduduk-table keluarga-member-table">
                  <THead>
                    <Row>
                      <HeaderCell scope="col">No</HeaderCell>
                      <HeaderCell scope="col">Anggota</HeaderCell>
                      <HeaderCell scope="col">NIK</HeaderCell>
                      <HeaderCell scope="col">JK</HeaderCell>
                      <HeaderCell scope="col">Hubungan</HeaderCell>
                      <HeaderCell scope="col">Status</HeaderCell>
                      <HeaderCell scope="col">RTM</HeaderCell>
                      <HeaderCell scope="col">Aksi</HeaderCell>
                    </Row>
                  </THead>
                  <TBody>
                    {detail.members.map((member, index) => (
                      <Row key={member.id}>
                        <Cell className="penduduk-nomor">{index + 1}</Cell>
                        <Cell>
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
                            <Link
                              className="penduduk-nama"
                              href={`/kependudukan/penduduk/${member.id}`}
                            >
                              {member.name}
                            </Link>
                          </div>
                        </Cell>
                        <Cell>
                          <span className="penduduk-nik">{member.nationalId ?? "—"}</span>
                        </Cell>
                        <Cell>{member.gender === "male" ? "L" : "P"}</Cell>
                        <Cell>{member.relationName ?? "Belum ditentukan"}</Cell>
                        <Cell>
                          <span
                            className="beranda-chip"
                            data-tone={member.lifeStatus === "alive" ? "hijau" : "oranye"}
                          >
                            {LIFE_STATUS_LABELS[member.lifeStatus]}
                          </span>
                        </Cell>
                        <Cell>
                          {member.rtmNumber ? (
                            <span className="modul-mono">{member.rtmNumber}</span>
                          ) : (
                            <span className="modul-muted">Belum ada</span>
                          )}
                        </Cell>
                        <Cell>
                          <div className="keluarga-row-actions">
                            <Link
                              className="penduduk-aksi"
                              href={`/kependudukan/penduduk/${member.id}`}
                            >
                              Detail
                            </Link>
                            {bolehUbahPenduduk ? (
                              <Link
                                className="penduduk-aksi"
                                href={`/kependudukan/penduduk/${member.id}/ubah`}
                              >
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
                              <Button variant="danger" type="submit">
                                Lepas
                              </Button>
                            </form>
                          ) : null}
                        </Cell>
                      </Row>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>
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
                <ButtonLink variant="secondary" href={`/kependudukan/keluarga/${id}/ubah`}>
                  Ubah Data KK
                </ButtonLink>
              ) : null}
              <ButtonLink
                variant="primary"
                href={`/kependudukan/keluarga/${id}/pdf`}
                target="_blank"
              >
                Cetak KK
              </ButtonLink>
              <ButtonLink variant="secondary" href={`/kependudukan/keluarga/${id}/pdf?unduh=1`}>
                Unduh KK
              </ButtonLink>
              {bolehPecah ? (
                <ButtonLink variant="secondary" href={`/kependudukan/keluarga/${id}/pecah`}>
                  Pecah KK
                </ButtonLink>
              ) : null}
              {bolehHapusKk && detail.members.length === 0 ? (
                <DialogHapusForm
                  aksi={hapusKeluargaAction}
                  id={id}
                  judul={`Hapus Kartu Keluarga ${detail.keluarga?.number ?? ""}?`}
                  keterangan="Kartu Keluarga kosong ini akan dihapus permanen. Pastikan tidak ada anggota yang masih tercatat."
                  label="Hapus KK Kosong"
                  labelAksi="Hapus KK"
                  varian="danger"
                />
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
