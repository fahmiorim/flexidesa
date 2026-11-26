import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  hapusRumahTanggaAction,
  lepasAnggotaAction,
  lepasAnggotaMassalAction,
  ubahLevelAnggotaAction,
} from "@/app/(admin)/(kependudukan)/kependudukan/rumah-tangga/actions";
import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  getRumahTanggaDetail,
  getRumahTanggaReference,
} from "@/features/kependudukan/rumah-tangga/application/use-cases";
import {
  filterAnggotaRtm,
  parseFilterAnggotaRtm,
  RTM_GENDER_LABELS,
  RTM_LEVEL_ANGGOTA,
  RTM_LEVEL_KEPALA,
  RTM_SEX_FILTERS,
  RTM_SEX_LABELS,
  rtmLevelLabel,
  rtmLifeStatusLabel,
  RUMAH_TANGGA_RESOURCE,
} from "@/features/kependudukan/rumah-tangga/domain/rumah-tangga";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { asalDanaLabel } from "@/features/program-data-desa/bantuan/domain/bantuan";
import { verifySession } from "@/lib/dal";

import styles from "../rumah-tangga.module.css";
import { FormAnggotaRumahTangga } from "./form-anggota";

export const metadata: Metadata = { title: "Detail Rumah Tangga" };
const number = new Intl.NumberFormat("id-ID");

function labelKelas(value: number | null): string {
  return value === null ? "Belum ditetapkan" : `Kelas ${value}`;
}

export default async function DetailRumahTanggaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: raw }, query] = await Promise.all([params, searchParams]);
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [detail, reference, user] = await Promise.all([
    getRumahTanggaDetail(id),
    getRumahTanggaReference(),
    verifySession(),
  ]);
  const filterAnggota = parseFilterAnggotaRtm(query);
  const members = filterAnggotaRtm(detail.members, filterAnggota);
  const bolehUbah = hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "update");
  const bolehHapus = hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "delete");
  const bolehKelolaAnggota = hasPermission(user.permissions, RUMAH_TANGGA_RESOURCE, "create");
  const kepala = detail.members.find((member) => member.level === RTM_LEVEL_KEPALA) ?? null;
  const anggotaIds = new Set(detail.members.map((member) => member.id));
  const pendudukTersedia = reference.penduduk.filter((item) => !anggotaIds.has(item.id));

  return (
    <div className="modul-page data-kependudukan-page">
      <Link className={styles.back} href="/kependudukan/rumah-tangga">
        ← Kembali ke daftar rumah tangga
      </Link>

      <PageHeading
        judul={<>Detail Rumah Tangga</>}
        deskripsi={<>Nomor RTM {detail.rumahTangga.number}</>}
        aksi={
          <>
            <div className="page-heading-actions">
              <Link
                className="button button-secondary"
                href={`/kependudukan/rumah-tangga/${id}/cetak`}
                target="_blank"
              >
                Cetak Kartu
              </Link>
              {bolehUbah ? (
                <Link
                  className="button button-secondary"
                  href={`/kependudukan/rumah-tangga/${id}/ubah`}
                >
                  Ubah Data
                </Link>
              ) : null}
              {bolehHapus ? (
                <form action={hapusRumahTanggaAction}>
                  <input name="id" type="hidden" value={id} />
                  <ConfirmSubmit
                    className="button button-danger"
                    message="Hapus Rumah Tangga ini? Semua anggota akan dilepas dari RTM, tetapi data penduduk tetap ada."
                  >
                    Hapus RTM
                  </ConfirmSubmit>
                </form>
              ) : null}
            </div>
          </>
        }
      />

      <section className={styles.hero}>
        <div>
          <span className={styles.heroLabel}>Nomor Rumah Tangga</span>
          <strong>{detail.rumahTangga.number}</strong>
          <p>{kepala?.name ?? "Kepala rumah tangga belum ditentukan"}</p>
        </div>
        <div className={styles.heroMeta}>
          <span>
            <small>Anggota</small>
            <b>{number.format(detail.members.length)} orang</b>
          </span>
          <span>
            <small>Kelas sosial</small>
            <b>{labelKelas(detail.rumahTangga.kelasSosial)}</b>
          </span>
          <span>
            <small>BDT</small>
            <b>{detail.rumahTangga.bdt ?? "—"}</b>
          </span>
          <span>
            <small>DTKS</small>
            <b>{detail.hasDtks ? "Terdaftar" : "Belum"}</b>
          </span>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <section className="platform-card data-panel">
          <header>
            <h2>Data Rumah Tangga</h2>
            <p>Informasi administrasi dan domisili.</p>
          </header>
          <dl className={styles.infoList}>
            <div>
              <dt>Kepala rumah tangga</dt>
              <dd>{kepala?.name ?? "Belum ditentukan"}</dd>
            </div>
            <div>
              <dt>Alamat</dt>
              <dd>{detail.rumahTangga.address ?? "—"}</dd>
            </div>
            <div>
              <dt>Wilayah</dt>
              <dd>{detail.regionLabel ?? "—"}</dd>
            </div>
            <div>
              <dt>Kelas sosial</dt>
              <dd>{labelKelas(detail.rumahTangga.kelasSosial)}</dd>
            </div>
            <div>
              <dt>BDT</dt>
              <dd>{detail.rumahTangga.bdt ?? "—"}</dd>
            </div>
            <div>
              <dt>DTKS</dt>
              <dd>{detail.hasDtks ? "Terdaftar" : "Belum terdaftar"}</dd>
            </div>
            <div>
              <dt>Jumlah anggota</dt>
              <dd>{number.format(detail.members.length)} orang</dd>
            </div>
          </dl>
        </section>

        <section className="platform-card data-panel">
          <header>
            <h2>Tambah Anggota</h2>
            <p>Hubungkan penduduk ke rumah tangga ini.</p>
          </header>
          {bolehKelolaAnggota ? (
            <FormAnggotaRumahTangga penduduk={pendudukTersedia} rtmId={id} />
          ) : (
            <p className="form-help">Anda tidak memiliki izin mengubah anggota rumah tangga.</p>
          )}
        </section>
      </div>

      <section className="platform-card data-panel">
        <header>
          <h2>Anggota Rumah Tangga</h2>
          <p>
            {number.format(detail.members.length)} anggota
            {kepala ? ` · Kepala: ${kepala.name}` : " · Kepala belum ditentukan"}
          </p>
        </header>

        <form className="data-filter" method="get">
          <select
            aria-label="Jenis kelamin anggota"
            defaultValue={filterAnggota.sex ?? ""}
            name="sexAnggota"
          >
            <option value="">Semua jenis kelamin</option>
            {RTM_SEX_FILTERS.map((sex) => (
              <option key={sex} value={sex}>
                {RTM_SEX_LABELS[sex]}
              </option>
            ))}
          </select>
          <select
            aria-label="Status anggota"
            defaultValue={filterAnggota.status ?? ""}
            name="statusAnggota"
          >
            <option value="">Semua status</option>
            <option value="hidup">Hidup</option>
            <option value="tidak">Tidak Hidup</option>
          </select>
          <button className="button button-secondary" type="submit">
            Terapkan
          </button>
          {filterAnggota.sex || filterAnggota.status ? (
            <Link className="button button-secondary" href={`/kependudukan/rumah-tangga/${id}`}>
              Reset
            </Link>
          ) : null}
        </form>

        {members.length === 0 ? (
          <div className="modul-empty">
            <strong>
              {detail.members.length === 0 ? "Belum ada anggota." : "Tidak ada anggota yang cocok."}
            </strong>
            <p>
              {detail.members.length === 0
                ? "Tambahkan penduduk melalui form di atas."
                : "Ubah filter anggota untuk melihat anggota lain."}
            </p>
          </div>
        ) : (
          <form action={lepasAnggotaMassalAction.bind(null, id)}>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {bolehHapus ? <th>Lepas</th> : null}
                    <th>No.</th>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>Tingkat</th>
                    <th>Jenis Kelamin</th>
                    <th>Status</th>
                    <th>Aksi</th>
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
                      <td>{member.nationalId ?? "—"}</td>
                      <td>
                        <strong>{member.name}</strong>
                      </td>
                      <td>
                        <span
                          className={
                            member.level === RTM_LEVEL_KEPALA
                              ? styles.badgeKepala
                              : styles.badgeAnggota
                          }
                        >
                          {rtmLevelLabel(member.level)}
                        </span>
                      </td>
                      <td>{RTM_GENDER_LABELS[member.gender]}</td>
                      <td>{rtmLifeStatusLabel(member.lifeStatus)}</td>
                      <td>
                        {bolehKelolaAnggota || bolehHapus ? (
                          <div className={styles.memberActions}>
                            {bolehKelolaAnggota ? (
                              <form
                                action={ubahLevelAnggotaAction.bind(null, id)}
                                className={styles.inlineForm}
                              >
                                <input name="residentId" type="hidden" value={member.id} />
                                <select
                                  aria-label={`Tingkat ${member.name}`}
                                  className="form-input"
                                  defaultValue={member.level ?? RTM_LEVEL_ANGGOTA}
                                  name="level"
                                >
                                  <option value={RTM_LEVEL_KEPALA}>Kepala</option>
                                  <option value={RTM_LEVEL_ANGGOTA}>Anggota</option>
                                </select>
                                <button className="button button-ghost" type="submit">
                                  Simpan
                                </button>
                              </form>
                            ) : null}
                            {bolehHapus ? (
                              <form action={lepasAnggotaAction.bind(null, id)}>
                                <input name="residentId" type="hidden" value={member.id} />
                                <ConfirmSubmit
                                  className="button button-danger"
                                  message={`Lepas ${member.name} dari rumah tangga ini?`}
                                >
                                  Lepas
                                </ConfirmSubmit>
                              </form>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bolehHapus ? (
              <div className={styles.toolbar}>
                <ConfirmSubmit
                  className="button button-danger"
                  message="Lepas anggota yang dicentang dari rumah tangga ini? Data penduduk tetap ada."
                >
                  Lepas Anggota Terpilih
                </ConfirmSubmit>
              </div>
            ) : null}
          </form>
        )}
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Program Bantuan</h2>
          <p>Program bantuan yang diterima rumah tangga ini sebagai sasaran RTM.</p>
        </header>
        {detail.programBantuan.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum menerima program bantuan.</strong>
            <p>RTM ini belum terdaftar sebagai peserta program bantuan apa pun.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Program</th>
                  <th>Masa Aktif</th>
                  <th>Asal Dana</th>
                  <th>No. Kartu</th>
                </tr>
              </thead>
              <tbody>
                {detail.programBantuan.map((program, index) => (
                  <tr key={program.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{program.name}</strong>
                    </td>
                    <td>
                      {program.startDate ?? "—"} s.d. {program.endDate ?? "—"}
                    </td>
                    <td>{asalDanaLabel(program.asalDana)}</td>
                    <td>{program.cardNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
