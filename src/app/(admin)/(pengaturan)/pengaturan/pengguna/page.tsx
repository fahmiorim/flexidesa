import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { StatIcon } from "@/components/ui/stat-icon";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { labelAktivitas, toneAktivitas } from "@/features/beranda/dashboard/domain/aktivitas";
import { waktuRelatif } from "@/features/beranda/dashboard/domain/waktu-relatif";
import { getAuditLogPageData } from "@/features/pengaturan/audit/application/audit-use-cases";
import { getPenggunaAdminData } from "@/features/pengaturan/pengguna/application/pengguna-admin";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { verifySession } from "@/lib/dal";

import { buatPenggunaAction, hapusPenggunaAction, ubahPenggunaAction } from "./actions";
import { DialogPengguna } from "./dialog-pengguna";
import { PenggunaConsole } from "./pengguna-console";

export const metadata: Metadata = {
  title: "Manajemen Pengguna",
};

const angka = new Intl.NumberFormat("id-ID");

export default async function PenggunaPage() {
  const [user, data] = await Promise.all([verifySession(), getPenggunaAdminData()]);
  const bolehAudit = hasPermission(user.permissions, RESOURCES.auditLog, "read");
  const audit = bolehAudit ? await getAuditLogPageData({ page: 1 }) : null;

  const roles = data.roles.map((role) => ({ value: String(role.id), label: role.name }));
  const aktivitas = audit?.rows.slice(0, 5) ?? [];
  const persenAktif =
    data.statistik.total === 0
      ? 0
      : Math.round((data.statistik.aktif / data.statistik.total) * 100);
  const donut =
    data.statistik.total === 0
      ? "conic-gradient(#e6e9f4 0deg 360deg)"
      : `conic-gradient(#16a36a 0deg ${persenAktif * 3.6}deg, #f0a020 ${persenAktif * 3.6}deg 360deg)`;

  return (
    <div className="modul-page pengguna-page">
      <PageHeading
        judul={<>Manajemen Pengguna &amp; Hak Akses</>}
        deskripsi={<>Kelola akun pengguna, role, dan izin modul untuk desa ini.</>}
      />

      <div className="pengguna-kpi-grid">
        <article className="pengguna-kpi" data-tone="ungu">
          <StatIcon>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
            <path d="M16.4 5.6a3.2 3.2 0 0 1 0 6.4" />
          </StatIcon>
          <div>
            <span>Total Pengguna</span>
            <strong>{angka.format(data.statistik.total)}</strong>
            <small>{angka.format(data.roles.length)} role tersedia</small>
          </div>
        </article>
        <article className="pengguna-kpi" data-tone="hijau">
          <StatIcon>
            <path d="M12 3.4 19 6v5.4c0 4.2-2.9 7.6-7 9.2-4.1-1.6-7-5-7-9.2V6z" />
            <path d="m9 12 2.1 2.2L15.4 10" />
          </StatIcon>
          <div>
            <span>Aktif</span>
            <strong>{angka.format(data.statistik.aktif)}</strong>
            <small>{persenAktif}% dari total akun</small>
          </div>
        </article>
        <article className="pengguna-kpi" data-tone="oranye">
          <StatIcon>
            <circle cx="12" cy="12" r="8.4" />
            <path d="M12 7.6V12l3 1.8" />
          </StatIcon>
          <div>
            <span>Nonaktif</span>
            <strong>{angka.format(data.statistik.nonaktif)}</strong>
            <small>Akun tidak dapat masuk</small>
          </div>
        </article>
        <article className="pengguna-kpi" data-tone="biru">
          <StatIcon>
            <rect height="12" rx="2" width="16" x="4" y="4" />
            <path d="M8 9h8M8 13h5" />
          </StatIcon>
          <div>
            <span>Total Role</span>
            <strong>{angka.format(data.roles.length)}</strong>
            <small>Role milik desa ini</small>
          </div>
        </article>
        <article className="pengguna-kpi" data-tone="ungu">
          <StatIcon>
            <path d="M4 5h16M4 12h16M4 19h16" />
            <path d="M8 5v14M16 5v14" />
          </StatIcon>
          <div>
            <span>Total Hak Akses</span>
            <strong>{angka.format(data.totalHakAkses)}</strong>
            <small>{angka.format(data.moduleCount)} modul tersedia</small>
          </div>
        </article>
      </div>

      <div className="pengguna-layout">
        <TableCard
          actions={
            data.canCreate ? (
              <DialogPengguna
                aksi={buatPenggunaAction}
                currentUserId={data.currentUserId}
                label="+ Tambah Pengguna"
                roles={roles}
                varian="primary"
              />
            ) : (
              <span className="pengguna-rail-note">Anda hanya memiliki akses baca.</span>
            )
          }
          className="pengguna-card"
          description={`${angka.format(data.statistik.total)} akun terdaftar pada desa ini.`}
          title="Daftar Pengguna"
        >
          <div className="pengguna-card-body">
            <PenggunaConsole
              aksi={{
                buat: buatPenggunaAction,
                ubah: ubahPenggunaAction,
                hapus: hapusPenggunaAction,
              }}
              canDelete={data.canDelete}
              canUpdate={data.canUpdate}
              currentUserId={data.currentUserId}
              roles={roles}
              rows={data.rows}
            />
          </div>
        </TableCard>

        <aside className="pengguna-rail">
          <section className="pengguna-rail-card pengguna-rail-aksi">
            <Link className="pengguna-rail-tombol" href="/pengaturan/grup-akses">
              Kelola Role &amp; Hak Akses
            </Link>
          </section>

          <section className="pengguna-rail-card">
            <header className="pengguna-rail-head">
              <h2>Daftar Role ({data.roles.length})</h2>
              <Link href="/pengaturan/grup-akses">Kelola</Link>
            </header>
            <ul className="pengguna-role-list">
              {data.roles.map((role) => (
                <li key={role.id}>
                  <span className="pengguna-role-ikon" aria-hidden="true">
                    {role.isSystem ? "★" : "◇"}
                  </span>
                  <span>{role.name}</span>
                  <strong>{data.statistik.perRole[role.id] ?? 0}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="pengguna-rail-card">
            <header className="pengguna-rail-head">
              <h2>Keamanan & Pendaftaran</h2>
            </header>
            <ul className="pengguna-role-list">
              <li>
                <Link href="/pengaturan/pengguna/keamanan">Pengaturan Keamanan</Link>
              </li>
              {data.canUpdate ? (
                <li>
                  <Link href="/pengaturan/pengguna/pendaftaran">Pendaftaran Warga</Link>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="pengguna-rail-card">
            <header className="pengguna-rail-head">
              <h2>Statistik Pengguna</h2>
            </header>
            <div className="pengguna-donut-wrap">
              <div
                aria-label={`${data.statistik.total} pengguna: ${data.statistik.aktif} aktif, ${data.statistik.nonaktif} nonaktif`}
                className="pengguna-donut"
                role="img"
                style={{ background: donut }}
              >
                <span>
                  <strong>{angka.format(data.statistik.total)}</strong>
                  Pengguna
                </span>
              </div>
              <ul className="pengguna-legend">
                <li>
                  <span aria-hidden="true" data-warna="hijau" /> Aktif
                  <strong>{angka.format(data.statistik.aktif)}</strong>
                </li>
                <li>
                  <span aria-hidden="true" data-warna="oranye" /> Nonaktif
                  <strong>{angka.format(data.statistik.nonaktif)}</strong>
                </li>
              </ul>
            </div>
          </section>

          <section className="pengguna-rail-card">
            <header className="pengguna-rail-head">
              <h2>Aktivitas Terbaru</h2>
              {bolehAudit ? <Link href="/pengaturan/pengguna/aktivitas">Lihat semua</Link> : null}
            </header>
            {aktivitas.length === 0 ? (
              <p className="pengguna-rail-note">Belum ada aktivitas pengguna atau role.</p>
            ) : (
              <ul className="pengguna-aktivitas">
                {aktivitas.map((baris) => (
                  <li data-tone={toneAktivitas(baris.event)} key={baris.id}>
                    <span className="pengguna-aktivitas-titik" aria-hidden="true" />
                    <div>
                      <strong>{labelAktivitas(baris.event)}</strong>
                      <span>
                        {baris.actorName ?? "Sistem"} · {waktuRelatif(baris.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {bolehAudit && audit ? (
        <TableCard
          className="pengguna-audit"
          description={`${angka.format(audit.total)} peristiwa tercatat untuk desa ini.`}
          title="Log Aktivitas"
        >
          {audit.rows.length === 0 ? (
            <p className="modul-empty">Belum ada aktivitas yang tercatat.</p>
          ) : (
            <TableScroll className="tenant-table-scroll">
              <Table className="tenant-table">
                <THead>
                  <Row>
                    <HeaderCell scope="col">Peristiwa</HeaderCell>
                    <HeaderCell scope="col">Aktor</HeaderCell>
                    <HeaderCell scope="col">Resource</HeaderCell>
                    <HeaderCell scope="col">Waktu</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {audit.rows.map((baris) => (
                    <Row key={baris.id}>
                      <Cell>{labelAktivitas(baris.event)}</Cell>
                      <Cell>{baris.actorName ?? "Sistem"}</Cell>
                      <Cell className="pengguna-mono">
                        {baris.resource}
                        {baris.resourceId ? `:${baris.resourceId}` : ""}
                      </Cell>
                      <Cell>{waktuRelatif(baris.createdAt)}</Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          )}
        </TableCard>
      ) : null}
    </div>
  );
}
