import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { PERSETUJUAN_IZIN_RESOURCE } from "@/features/kehadiran/kehadiran/domain/pengajuan-izin";
import { daftarCuti, ringkasanKuotaCuti } from "@/features/kehadiran/kepegawaian/application/cuti";
import { daftarPegawai } from "@/features/kehadiran/kepegawaian/application/pegawai";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../absensi-kepegawaian.module.css";
import { simpanKuotaCutiAction } from "../actions";
import { ajukanCutiFormAction, putuskanCutiFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Cuti & Izin" };

export default async function CutiIzinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? (params.q[0] ?? "") : (params.q ?? "");
  const jenisFilter = Array.isArray(params.jenis) ? (params.jenis[0] ?? "") : (params.jenis ?? "");
  const statusFilter = Array.isArray(params.status)
    ? (params.status[0] ?? "")
    : (params.status ?? "");
  const [rows, pegawai, kuota, user] = await Promise.all([
    daftarCuti(),
    daftarPegawai(),
    ringkasanKuotaCuti(),
    verifySession(),
  ]);
  const canManage = hasPermission(user.permissions, PERSETUJUAN_IZIN_RESOURCE, "update");
  const pegawaiAkun = pegawai.find(
    (x) => x.status === "aktif" && x.email?.toLowerCase() === user.email.toLowerCase(),
  );
  const canRequest = canManage || Boolean(pegawaiAkun);
  const disetujui = rows.filter((x) => x.status === "disetujui").length;
  const menunggu = rows.filter((x) => x.status === "menunggu").length;
  const ditolak = rows.filter((x) => x.status === "ditolak").length;
  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const tahun = Number(hariIni.slice(0, 4));
  const bulan = Number(hariIni.slice(5, 7));
  const cutiAktif = rows.filter(
    (x) => x.status === "disetujui" && x.mulai <= hariIni && x.selesai >= hariIni,
  ).length;
  const sisaPegawai = kuota.filter((x) => x.total - x.terpakai > 0).length;
  const monthStart = new Date(Date.UTC(tahun, bulan - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const calendarMap = new Map<number, string[]>();
  const monthFirst = Date.UTC(tahun, bulan - 1, 1);
  const monthLast = Date.UTC(tahun, bulan, 0);
  for (const item of rows) {
    const start = Date.UTC(
      Number(item.mulai.slice(0, 4)),
      Number(item.mulai.slice(5, 7)) - 1,
      Number(item.mulai.slice(8, 10)),
    );
    const end = Date.UTC(
      Number(item.selesai.slice(0, 4)),
      Number(item.selesai.slice(5, 7)) - 1,
      Number(item.selesai.slice(8, 10)),
    );
    for (let day = Math.max(monthFirst, start); day <= Math.min(monthLast, end); day += 86400000) {
      const date = new Date(day).getUTCDate();
      const list = calendarMap.get(date) ?? [];
      list.push(item.status);
      calendarMap.set(date, list);
    }
  }
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(tahun, bulan - 1, 1)));
  const jenisLabel: Record<string, string> = {
    cuti_tahunan: "Cuti Tahunan",
    cuti_sakit: "Cuti Sakit",
    izin: "Izin",
    cuti_penting: "Cuti Penting",
  };
  const statusClass: Record<string, string> = {
    disetujui: styles.hadir ?? "",
    menunggu: styles.menunggu ?? "",
    ditolak: styles.ditolak ?? "",
  };
  const filteredRows = rows.filter(
    (x) =>
      (!query || x.nama.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))) &&
      (!jenisFilter || x.jenis === jenisFilter) &&
      (!statusFilter || x.status === statusFilter),
  );

  return (
    <div className="modul-page">
      <PageHeading judul={<>Cuti & Izin</>} deskripsi={<>Pengajuan dan riwayat cuti pegawai.</>} />
      <section className={styles["ak-kpi-grid"]}>
        <article className={styles["ak-kpi"] + " " + styles.primary}>
          <span>Total Pengajuan</span>
          <strong>{rows.length} pengajuan</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Disetujui</span>
          <strong>{disetujui} pengajuan</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Menunggu</span>
          <strong>{menunggu} pengajuan</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Ditolak</span>
          <strong>{ditolak} pengajuan</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Cuti Aktif Hari Ini</span>
          <strong>{cutiAktif} pegawai</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Sisa Kuota Pegawai</span>
          <strong>{sisaPegawai} pegawai</strong>
        </article>
      </section>

      <div className={styles["ak-grid"]}>
        <TableCard
          actions={
            canRequest ? (
              <FormDialog
                aksi={ajukanCutiFormAction}
                deskripsi="Pengajuan baru akan tercatat dengan status menunggu persetujuan."
                judul="Ajukan cuti / izin"
                label="＋ Ajukan Cuti / Izin"
                labelSimpan="Ajukan cuti / izin"
              >
                <div className="modul-form-grid">
                  {canManage ? (
                    <FormField
                      kind="select"
                      label="Nama pegawai"
                      name="pegawaiId"
                      options={pegawai
                        .filter((x) => x.status === "aktif")
                        .map((x) => ({ value: String(x.id), label: x.nama }))}
                      required
                    />
                  ) : (
                    <>
                      <input type="hidden" name="pegawaiId" value={pegawaiAkun?.id} />
                      <FormField label="Nama pegawai" readOnly value={pegawaiAkun?.nama ?? ""} />
                    </>
                  )}
                  <FormField
                    defaultValue="cuti_tahunan"
                    kind="select"
                    label="Jenis"
                    name="jenis"
                    options={[
                      { value: "cuti_tahunan", label: "Cuti Tahunan" },
                      { value: "cuti_sakit", label: "Cuti Sakit" },
                      { value: "izin", label: "Izin" },
                      { value: "cuti_penting", label: "Cuti Penting" },
                    ]}
                  />
                  <FormField
                    label="Tanggal mulai"
                    min={hariIni}
                    name="mulai"
                    required
                    type="date"
                  />
                  <FormField
                    label="Tanggal selesai"
                    min={hariIni}
                    name="selesai"
                    required
                    type="date"
                  />
                  <FormField
                    containerClassName="form-field-full"
                    kind="textarea"
                    label="Alasan"
                    name="alasan"
                    required
                    rows={3}
                  />
                  <FormField
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    containerClassName="form-field-full"
                    label="Lampiran pendukung"
                    name="lampiran"
                    type="file"
                  />
                </div>
              </FormDialog>
            ) : null
          }
          description={`Riwayat dan status seluruh pengajuan pegawai · ${rows.length} pengajuan.`}
          filter={
            <form className={styles["ak-filter"]} method="get">
              <FormField
                defaultValue={query}
                label="Cari pegawai"
                name="q"
                placeholder="Cari nama pegawai..."
                type="search"
              />
              <FormField
                defaultValue={jenisFilter}
                kind="select"
                label="Jenis"
                name="jenis"
                options={[
                  { value: "", label: "Semua Jenis" },
                  { value: "cuti_tahunan", label: "Cuti Tahunan" },
                  { value: "cuti_sakit", label: "Cuti Sakit" },
                  { value: "izin", label: "Izin" },
                  { value: "cuti_penting", label: "Cuti Penting" },
                ]}
              />
              <FormField
                defaultValue={statusFilter}
                kind="select"
                label="Status"
                name="status"
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "disetujui", label: "Disetujui" },
                  { value: "menunggu", label: "Menunggu" },
                  { value: "ditolak", label: "Ditolak" },
                ]}
              />
              <Button type="submit">⌕ Filter</Button>
            </form>
          }
          title="Daftar Pengajuan Cuti & Izin"
        >
          <TableScroll className={styles["ak-table-wrap"]}>
            <Table className={styles["ak-table"]}>
              <THead>
                <Row>
                  <HeaderCell>Nama Pegawai</HeaderCell>
                  <HeaderCell>Jenis</HeaderCell>
                  <HeaderCell>Tanggal / Durasi</HeaderCell>
                  <HeaderCell>Alasan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {filteredRows.map((x) => (
                  <Row key={x.id}>
                    <Cell>
                      <strong>{x.nama}</strong>
                      <br />
                      <small>{x.jabatan ?? "—"}</small>
                    </Cell>
                    <Cell>{jenisLabel[x.jenis] ?? x.jenis}</Cell>
                    <Cell>
                      {x.mulai} – {x.selesai}
                      <br />
                      <small>{x.durasi} hari kerja</small>
                    </Cell>
                    <Cell>
                      {x.alasan}
                      {x.lampiran ? (
                        <>
                          <br />
                          <a href={"/api/kepegawaian/cuti/" + x.id + "/lampiran"}>Lihat lampiran</a>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>
                      <span className={styles["ak-badge"] + " " + (statusClass[x.status] ?? "")}>
                        {x.status}
                      </span>
                    </Cell>
                    <Cell>
                      {x.status === "menunggu" && canManage ? (
                        <FormDialog
                          aksi={putuskanCutiFormAction}
                          deskripsi={`Putuskan pengajuan cuti/izin ${x.nama}.`}
                          judul="Putuskan pengajuan"
                          label="Putuskan"
                          labelSimpan="Simpan keputusan"
                          varian="secondary"
                        >
                          <div className="modul-form-grid">
                            <input name="id" type="hidden" value={x.id} />
                            <FormField
                              containerClassName="form-field-full"
                              label="Catatan keputusan"
                              name="catatan"
                            />
                            <FormField
                              defaultValue="disetujui"
                              kind="select"
                              label="Keputusan"
                              name="status"
                              options={[
                                { value: "disetujui", label: "Setujui" },
                                { value: "ditolak", label: "Tolak" },
                              ]}
                            />
                          </div>
                        </FormDialog>
                      ) : (
                        "—"
                      )}
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {!filteredRows.length ? (
            <div className={styles["ak-empty"]}>
              {rows.length
                ? "Tidak ada pengajuan yang sesuai filter."
                : "Belum ada pengajuan cuti atau izin."}
            </div>
          ) : null}
        </TableCard>

        <div className={styles["ak-side-stack"]}>
          <section id="kalender-cuti" className={styles["ak-card"]}>
            <div className={styles["ak-card-heading-row"]}>
              <div>
                <h2>Kalender Cuti & Izin</h2>
                <p>{monthLabel}</p>
              </div>
              <span className={styles["ak-calendar-month-icon"]}>▦</span>
            </div>
            <div className={styles["ak-calendar"]}>
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <span className={styles["ak-calendar-head"]} key={day}>
                  {day}
                </span>
              ))}
              {Array.from({ length: monthStart }, (_, i) => (
                <span key={"blank-" + i} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const types = calendarMap.get(day) ?? [];
                return (
                  <div
                    key={day}
                    className={
                      styles["ak-calendar-day"] +
                      " " +
                      (types.includes("disetujui")
                        ? styles.hadir
                        : types.includes("menunggu")
                          ? styles.menunggu
                          : types.includes("ditolak")
                            ? styles.ditolak
                            : "")
                    }
                  >
                    <strong>{day}</strong>
                    {types.length ? <small>{types.length} agenda</small> : null}
                  </div>
                );
              })}
            </div>
            <div className={styles["ak-calendar-legend"]}>
              <span>
                <i className={styles.green} />
                Cuti disetujui
              </span>
              <span>
                <i className={styles.amber} />
                Menunggu
              </span>
              <span>
                <i className={styles.red} />
                Ditolak
              </span>
            </div>
          </section>
          <section id="kuota" className={styles["ak-card"]}>
            <h2>Kuota Cuti Tahunan ({tahun})</h2>
            <p>Default 12 hari per tahun. Kuota dapat disesuaikan per pegawai.</p>
            <TableScroll className={styles["ak-table-wrap"]}>
              <Table className={styles["ak-table"]}>
                <THead>
                  <Row>
                    <HeaderCell>Pegawai</HeaderCell>
                    <HeaderCell>Terpakai</HeaderCell>
                    <HeaderCell>Sisa</HeaderCell>
                    <HeaderCell>Kuota</HeaderCell>
                  </Row>
                </THead>
                <TBody>
                  {kuota.map((x) => (
                    <Row key={x.id}>
                      <Cell>{x.nama}</Cell>
                      <Cell>{x.terpakai}</Cell>
                      <Cell>
                        <strong>{x.total - x.terpakai}</strong>
                      </Cell>
                      <Cell>
                        {canManage ? (
                          <form action={simpanKuotaCutiAction} className={styles["ak-inline-form"]}>
                            <input type="hidden" name="pegawaiId" value={x.id} />
                            <input type="hidden" name="tahun" value={tahun} />
                            <input
                              aria-label={"Kuota cuti " + x.nama}
                              type="number"
                              name="total"
                              min="0"
                              max="365"
                              defaultValue={x.total}
                            />
                            <Button className={styles["ak-icon-button"]} title="Simpan kuota">
                              ✓
                            </Button>
                          </form>
                        ) : (
                          x.total
                        )}
                      </Cell>
                    </Row>
                  ))}
                </TBody>
              </Table>
            </TableScroll>
          </section>
        </div>
      </div>
      <section className={styles["ak-card"]} style={{ marginTop: 16 }}>
        <h2>Informasi Singkat</h2>
        <ul>
          <li>Pengajuan cuti diproses melalui persetujuan pejabat berwenang.</li>
          <li>Cuti tahunan memiliki kuota default 12 hari per tahun.</li>
          <li>Durasi pengajuan dihitung berdasarkan hari kerja dan konfigurasi hari libur desa.</li>
          <li>Status persetujuan dan catatan keputusan tersimpan pada sistem.</li>
        </ul>
      </section>
    </div>
  );
}
