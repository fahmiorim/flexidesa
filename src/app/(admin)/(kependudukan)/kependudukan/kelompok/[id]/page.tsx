import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  lepasAnggotaKelompokAction,
  lepasAnggotaKelompokMassalAction,
  ubahPublikasiAnggotaAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/kelompok/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getKelompokDetail,
  getKelompokMembers,
  getReferensiKelompok,
} from "@/features/kependudukan/kelompok/application/use-cases";
import {
  isKetuaKelompok,
  jabatanLabel,
  KELOMPOK_RESOURCE,
  kelompokTipeLabel,
} from "@/features/kependudukan/kelompok/domain/kelompok";
import { RTM_GENDER_LABELS } from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../kelompok.module.css";

export const metadata: Metadata = { title: "Rincian Kelompok" };
const number = new Intl.NumberFormat("id-ID");

function umurTahun(birthDate: string | null): string {
  if (!birthDate) return "—";
  const lahir = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(lahir.getTime())) return "—";
  const sekarang = new Date();
  let umur = sekarang.getFullYear() - lahir.getFullYear();
  const selisihBulan = sekarang.getMonth() - lahir.getMonth();
  if (selisihBulan < 0 || (selisihBulan === 0 && sekarang.getDate() < lahir.getDate())) {
    umur -= 1;
  }
  return umur < 0 ? "—" : `${umur} tahun`;
}

function formatTanggal(birthDate: string | null): string {
  if (!birthDate) return "—";
  const tanggal = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(tanggal.getTime())) return birthDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tanggal);
}

export default async function DetailKelompokPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [detail, members, referensi, user] = await Promise.all([
    getKelompokDetail(id),
    getKelompokMembers(id),
    getReferensiKelompok(id),
    verifySession(),
  ]);
  const bolehUbah = hasPermission(user.permissions, KELOMPOK_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, KELOMPOK_RESOURCE, "delete");
  const bolehTambah = hasPermission(user.permissions, KELOMPOK_RESOURCE, "create");
  const ketua = members.find((member) => isKetuaKelompok(member.position)) ?? null;
  const kategori = referensi.kategori.find((item) => item.id === detail.categoryId) ?? null;
  const tipeLabel = kelompokTipeLabel(detail.type);

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kependudukan/kelompok">
        ← Kembali ke daftar kelompok
      </Link>

      <PageHeading
        judul={<>Rincian {tipeLabel}</>}
        deskripsi={<>{detail.name}</>}
        aksi={
          <>
            <div className="page-heading-actions">
              {bolehUbah ? (
                <Link
                  className="button button-secondary"
                  href={`/kependudukan/kelompok/${id}/ubah`}
                >
                  Ubah Data
                </Link>
              ) : null}
            </div>
          </>
        }
      />

      <section className={styles.hero}>
        <div>
          <span className={styles.heroLabel}>Nama {tipeLabel}</span>
          <strong>{detail.name}</strong>
          <p>{ketua?.name ?? "Ketua belum ditentukan"}</p>
        </div>
        <div className={styles.heroMeta}>
          <span>
            <small>Kode</small>
            <b>{detail.code ?? "—"}</b>
          </span>
          <span>
            <small>Anggota</small>
            <b>{number.format(members.length)} orang</b>
          </span>
          <span>
            <small>Kategori</small>
            <b>{kategori?.label ?? "—"}</b>
          </span>
          <span>
            <small>No. SK Pendirian</small>
            <b>{detail.decreeNumber ?? "—"}</b>
          </span>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <section className="platform-card data-panel">
          <header>
            <h2>Rincian {tipeLabel}</h2>
            <p>Informasi administrasi kelompok.</p>
          </header>
          <dl className={styles.infoList}>
            <div>
              <dt>Kode {tipeLabel}</dt>
              <dd>{detail.code ?? "—"}</dd>
            </div>
            <div>
              <dt>Nama {tipeLabel}</dt>
              <dd>{detail.name}</dd>
            </div>
            <div>
              <dt>Ketua {tipeLabel}</dt>
              <dd>{ketua?.name ?? "Belum ditentukan"}</dd>
            </div>
            <div>
              <dt>Kategori {tipeLabel}</dt>
              <dd>{kategori?.label ?? "—"}</dd>
            </div>
            <div>
              <dt>No. SK Pendirian</dt>
              <dd>{detail.decreeNumber ?? "—"}</dd>
            </div>
            <div>
              <dt>Keterangan</dt>
              <dd>{detail.description ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="platform-card data-panel">
        <header>
          <h2>Anggota {tipeLabel}</h2>
          <p>
            {number.format(members.length)} anggota
            {ketua ? ` · Ketua: ${ketua.name}` : " · Ketua belum ditentukan"}
          </p>
        </header>

        <form action={lepasAnggotaKelompokMassalAction.bind(null, id)}>
          <div className={styles.buttonGroups}>
            {bolehTambah ? (
              <div className={styles.buttonGroup} role="group" aria-label="Tambah anggota">
                <span className={styles.buttonGroupLabel}>Tambah</span>
                <Link
                  className="button button-primary"
                  href={`/kependudukan/kelompok/${id}/anggota-baru`}
                >
                  Satu Anggota
                </Link>
                <Link
                  className="button button-secondary"
                  href={`/kependudukan/kelompok/${id}/anggota-baru?mode=banyak`}
                >
                  Beberapa Anggota
                </Link>
              </div>
            ) : null}
            {bolehHapus ? (
              <div className={styles.buttonGroup} role="group" aria-label="Hapus anggota">
                <ConfirmSubmit
                  className="button button-danger"
                  message="Lepas anggota yang dicentang dari kelompok ini? Data penduduk tetap ada."
                >
                  Hapus Terpilih
                </ConfirmSubmit>
              </div>
            ) : null}
            <div className={styles.buttonGroup} role="group" aria-label="Laporan anggota">
              <span className={styles.buttonGroupLabel}>Laporan</span>
              <Link
                className="button button-secondary"
                href={`/kependudukan/kelompok/${id}/cetak`}
                target="_blank"
              >
                Cetak
              </Link>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="modul-empty">
              <strong>Belum ada anggota.</strong>
              <p>Tambahkan anggota melalui tombol Tambah di atas.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehHapus ? <th>Lepas</th> : null}
                    <th>No.</th>
                    <th>Aksi</th>
                    <th>No. Anggota</th>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Tempat / Tanggal Lahir</th>
                    <th>Umur</th>
                    <th>Jenis Kelamin</th>
                    <th>Alamat</th>
                    <th>Jabatan</th>
                    <th>Nomor SK Jabatan</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr key={member.id}>
                      {bolehHapus ? (
                        <td>
                          <input
                            aria-label={`Pilih ${member.name}`}
                            name="idCb"
                            type="checkbox"
                            value={member.id}
                          />
                        </td>
                      ) : null}
                      <td>{index + 1}</td>
                      <td>
                        <div className={styles.memberActions}>
                          {bolehUbah ? (
                            <Link
                              className="button button-ghost"
                              href={`/kependudukan/kelompok/${id}/anggota/${member.id}/ubah`}
                            >
                              Ubah
                            </Link>
                          ) : null}
                          {bolehUbah ? (
                            <span className={styles.inlineForm}>
                              <label className={styles.inlineForm}>
                                <input
                                  defaultChecked={member.tampilPublik}
                                  form={`publik-anggota-${member.id}`}
                                  name="tampilPublik"
                                  type="checkbox"
                                />
                                <span>Publik</span>
                              </label>
                              <button
                                className="button button-ghost"
                                form={`publik-anggota-${member.id}`}
                                type="submit"
                              >
                                Simpan
                              </button>
                            </span>
                          ) : null}
                          {bolehHapus ? (
                            <ConfirmSubmit
                              className="button button-danger"
                              form={`lepas-anggota-${member.id}`}
                              message={`Lepas ${member.name} dari kelompok ini?`}
                            >
                              Lepas
                            </ConfirmSubmit>
                          ) : null}
                        </div>
                      </td>
                      <td>{member.memberNumber ?? "—"}</td>
                      <td>{member.nationalId ?? "—"}</td>
                      <td>
                        <strong>{member.name}</strong>
                      </td>
                      <td>
                        {member.birthPlace ?? "—"}
                        {member.birthDate ? ` / ${formatTanggal(member.birthDate)}` : ""}
                      </td>
                      <td>{umurTahun(member.birthDate)}</td>
                      <td>{RTM_GENDER_LABELS[member.gender]}</td>
                      <td>{member.address ?? "—"}</td>
                      <td>
                        <span
                          className={
                            isKetuaKelompok(member.position)
                              ? styles.badgeKetua
                              : styles.badgeAnggota
                          }
                        >
                          {jabatanLabel(member.position)}
                        </span>
                      </td>
                      <td>{member.decreeNumber ?? "—"}</td>
                      <td>{member.keterangan ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </form>

        {bolehUbah
          ? members.map((member) => (
              <form
                action={ubahPublikasiAnggotaAction.bind(null, id)}
                id={`publik-anggota-${member.id}`}
                key={`publik-${member.id}`}
              >
                <input name="memberId" type="hidden" value={member.id} />
              </form>
            ))
          : null}
        {bolehHapus
          ? members.map((member) => (
              <form
                action={lepasAnggotaKelompokAction.bind(null, id)}
                id={`lepas-anggota-${member.id}`}
                key={`lepas-${member.id}`}
              >
                <input name="memberId" type="hidden" value={member.id} />
              </form>
            ))
          : null}
      </section>
    </div>
  );
}
