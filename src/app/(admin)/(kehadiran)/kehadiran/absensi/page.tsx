import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  daftarAbsensi,
  daftarKehadiranBulanan,
  getPengaturanKehadiran,
  getStatusAbsensiMandiri,
} from "@/features/kehadiran/kepegawaian/application/absensi";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import styles from "../absensi-kepegawaian.module.css";
import { simpanPengaturanKehadiranAction } from "../actions";
import { AbsensiMandiri } from "./absensi-mandiri";
import { absensiManualFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Absensi Pegawai" };

export default async function AbsensiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.tanggal) ? params.tanggal[0] : params.tanggal;
  const query = Array.isArray(params.q) ? (params.q[0] ?? "") : (params.q ?? "");
  const statusFilter = Array.isArray(params.status)
    ? (params.status[0] ?? "")
    : (params.status ?? "");
  const jabatanFilter = Array.isArray(params.jabatan)
    ? (params.jabatan[0] ?? "")
    : (params.jabatan ?? "");
  const tanggal =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const tahun = Number(tanggal.slice(0, 4));
  const bulan = Number(tanggal.slice(5, 7));
  const [rows, setting, calendarRows, user, statusMandiri] = await Promise.all([
    daftarAbsensi(tanggal),
    getPengaturanKehadiran(),
    daftarKehadiranBulanan(tahun, bulan),
    verifySession(),
    getStatusAbsensiMandiri(),
  ]);
  const canManage = hasPermission(user.permissions, "kehadiran", "update");
  let hariLibur: number[] = [0, 6];
  try {
    const parsed = JSON.parse(setting.hariLibur);
    if (Array.isArray(parsed)) hariLibur = parsed;
  } catch {
    /* fallback akhir pekan */
  }
  const statusLabel: Record<string, string> = {
    hadir: "Hadir",
    izin: "Izin",
    cuti: "Cuti",
    tidak_hadir: "Tidak Hadir",
  };
  const monthStart = new Date(Date.UTC(tahun, bulan - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const calendarMap = new Map<string, string[]>();
  for (const row of calendarRows) {
    const key = row.tanggal;
    const list = calendarMap.get(key) ?? [];
    list.push(row.status ?? "hadir");
    calendarMap.set(key, list);
  }
  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(tahun, bulan - 1, 1)));

  const counts = {
    hadir: rows.filter((x) => x.status === "hadir").length,
    izin: rows.filter((x) => x.status === "izin").length,
    cuti: rows.filter((x) => x.status === "cuti").length,
    tidak: rows.filter((x) => !x.status || x.status === "tidak_hadir").length,
  };
  const tingkatKehadiran = rows.length ? Math.round((counts.hadir / rows.length) * 1000) / 10 : 0;
  const filteredRows = rows.filter(
    (row) =>
      (!query || row.nama.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))) &&
      (!statusFilter || (row.status ?? "tidak_hadir") === statusFilter) &&
      (!jabatanFilter || (row.jabatan ?? "") === jabatanFilter),
  );
  const jabatanOptions = [
    ...new Set(rows.map((row) => row.jabatan).filter((value): value is string => Boolean(value))),
  ].sort();
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Absensi Pegawai</>}
        deskripsi={<>Kelola dan pantau kehadiran perangkat desa serta staf secara terpusat.</>}
      />
      {statusMandiri ? (
        <AbsensiMandiri attendance={statusMandiri} wajibGps={setting.wajibGps !== false} />
      ) : null}
      <section className={styles["ak-kpi-grid"]}>
        <article className={`${styles["ak-kpi"]} ${styles.primary}`}>
          <span>Kehadiran Hari Ini</span>
          <strong>{counts.hadir} orang</strong>
          <span>{tingkatKehadiran.toLocaleString("id-ID")}% tingkat kehadiran</span>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Hadir</span>
          <strong>{counts.hadir} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Izin</span>
          <strong>{counts.izin} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Cuti</span>
          <strong>{counts.cuti} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Tidak Hadir</span>
          <strong>{counts.tidak} orang</strong>
        </article>
      </section>
      <div className={styles["ak-grid"]}>
        <TableCard
          actions={
            <>
              <ButtonLink href={"/kehadiran/absensi/ekspor?tanggal=" + tanggal} variant="secondary">
                ↓ CSV Harian
              </ButtonLink>
              <ButtonLink
                href={"/kehadiran/absensi/ekspor-bulanan?tahun=" + tahun + "&bulan=" + bulan}
                variant="secondary"
              >
                ↓ CSV Bulanan
              </ButtonLink>
              <ButtonLink
                href={"/kehadiran/absensi/ekspor-xlsx?tahun=" + tahun + "&bulan=" + bulan}
                variant="secondary"
              >
                ↓ Excel
              </ButtonLink>
              <ButtonLink
                href={"/kehadiran/absensi/ekspor-pdf?tahun=" + tahun + "&bulan=" + bulan}
                variant="secondary"
              >
                ↓ PDF
              </ButtonLink>
            </>
          }
          description="Daftar kehadiran pegawai untuk tanggal yang dipilih."
          filter={
            <form className={styles["ak-filter"]} method="get">
              <FormField
                defaultValue={query}
                label="Cari pegawai"
                name="q"
                placeholder="Nama pegawai..."
                type="search"
              />
              <FormField defaultValue={tanggal} label="Tanggal" name="tanggal" type="date" />
              <FormField
                defaultValue={jabatanFilter}
                kind="select"
                label="Jabatan"
                name="jabatan"
                options={[
                  { value: "", label: "Semua Jabatan" },
                  ...jabatanOptions.map((name) => ({ value: name, label: name })),
                ]}
              />
              <FormField
                defaultValue={statusFilter}
                kind="select"
                label="Status"
                name="status"
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "hadir", label: "Hadir" },
                  { value: "izin", label: "Izin" },
                  { value: "cuti", label: "Cuti" },
                  { value: "tidak_hadir", label: "Tidak Hadir" },
                ]}
              />
              <Button type="submit">⌕ Filter</Button>
            </form>
          }
          title="Rekap Absensi Pegawai"
        >
          <TableScroll className={styles["ak-table-wrap"]}>
            <Table className={styles["ak-table"]}>
              <THead>
                <Row>
                  <HeaderCell>No.</HeaderCell>
                  <HeaderCell>Nama Pegawai</HeaderCell>
                  <HeaderCell>Jabatan</HeaderCell>
                  <HeaderCell>Jam Masuk</HeaderCell>
                  <HeaderCell>Jam Pulang</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {filteredRows.map((row, i) => (
                  <Row key={row.pegawaiId}>
                    <Cell>{i + 1}</Cell>
                    <Cell>
                      <span className={styles["ak-person"]}>
                        <span>
                          {row.nama
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <b>{row.nama}</b>
                      </span>
                    </Cell>
                    <Cell>{row.jabatan ?? "—"}</Cell>
                    <Cell>{row.jamMasuk ?? "—"}</Cell>
                    <Cell>{row.jamKeluar ?? "—"}</Cell>
                    <Cell>
                      <span
                        className={`${styles["ak-badge"]} ${styles[row.status ?? "tidak_hadir"] ?? ""}`}
                      >
                        {statusLabel[row.status ?? "tidak_hadir"] ?? "Tidak Hadir"}
                      </span>
                      {row.status === "hadir" &&
                      row.jamMasuk &&
                      Number(row.jamMasuk.slice(0, 2)) * 60 + Number(row.jamMasuk.slice(3, 5)) >
                        Number(setting.jamMasuk.slice(0, 2)) * 60 +
                          Number(setting.jamMasuk.slice(3, 5)) +
                          (setting.toleransiTerlambatMenit ?? 0) ? (
                        <small className={styles.terlambat}>Terlambat</small>
                      ) : null}
                      {row.fotoMasuk ? (
                        <a
                          href={"/api/kehadiran/foto/" + row.id}
                          target="_blank"
                          rel="noreferrer"
                          className={styles["ak-button"]}
                        >
                          {" "}
                          · Bukti selfie
                        </a>
                      ) : null}
                    </Cell>
                    <Cell>
                      {canManage ? (
                        <FormDialog
                          aksi={absensiManualFormAction}
                          deskripsi={`Isi absensi ${row.nama} untuk tanggal ${tanggal}.`}
                          judul="Ubah absensi"
                          label="Ubah"
                          labelSimpan="Simpan absensi"
                          varian="secondary"
                        >
                          <div className="modul-form-grid">
                            <input name="pegawaiId" type="hidden" value={row.pegawaiId} />
                            <input name="tanggal" type="hidden" value={tanggal} />
                            <FormField
                              defaultValue={row.jamMasuk ?? ""}
                              label="Jam masuk"
                              name="jamMasuk"
                              type="time"
                            />
                            <FormField
                              defaultValue={row.jamKeluar ?? ""}
                              label="Jam pulang"
                              name="jamKeluar"
                              type="time"
                            />
                            <FormField
                              defaultValue={row.status ?? "tidak_hadir"}
                              kind="select"
                              label="Status"
                              name="status"
                              options={[
                                { value: "hadir", label: "Hadir" },
                                { value: "izin", label: "Izin" },
                                { value: "cuti", label: "Cuti" },
                                { value: "tidak_hadir", label: "Tidak Hadir" },
                              ]}
                            />
                            <FormField
                              defaultValue={row.catatan ?? ""}
                              label="Catatan"
                              name="catatan"
                            />
                          </div>
                        </FormDialog>
                      ) : (
                        <span>—</span>
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
                ? "Tidak ada data yang sesuai dengan filter."
                : "Belum ada pegawai aktif. Tambahkan pegawai terlebih dahulu."}
            </div>
          ) : null}
        </TableCard>
        <div className={styles["ak-side-stack"]}>
          <section id="kalender" className={styles["ak-card"]}>
            <h2>Kalender Kehadiran</h2>
            <p>{monthLabel}</p>
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
                const key =
                  tahun + "-" + String(bulan).padStart(2, "0") + "-" + String(day).padStart(2, "0");
                const statuses = calendarMap.get(key) ?? [];
                const selectedDay = key === tanggal;
                return (
                  <div
                    key={key}
                    className={
                      styles["ak-calendar-day"] +
                      " " +
                      (statuses.length ? styles["has-data"] : "") +
                      " " +
                      (hariLibur.includes(new Date(Date.UTC(tahun, bulan - 1, day)).getUTCDay())
                        ? styles.weekend
                        : "") +
                      " " +
                      (selectedDay ? styles["selected-day"] : "")
                    }
                  >
                    <strong>{day}</strong>
                    {statuses.length ? <small>{statuses.length} catatan</small> : null}
                  </div>
                );
              })}
            </div>
            <div className={styles["ak-calendar-legend"]}>
              <span>
                <i className={styles.green} />
                Hadir
              </span>
              <span>
                <i className={styles.amber} />
                Izin
              </span>
              <span>
                <i className={styles.purple} />
                Cuti
              </span>
              <span>
                <i className={styles.red} />
                Tidak Hadir
              </span>
            </div>
          </section>
          <section className={styles["ak-card"]}>
            <h2>Ringkasan Periode</h2>
            <p>{tanggal}</p>
            <dl>
              <div>
                <dt>Total Pegawai Aktif</dt>
                <dd>{rows.length}</dd>
              </div>
              <div>
                <dt>Hadir</dt>
                <dd>{counts.hadir}</dd>
              </div>
              <div>
                <dt>Izin</dt>
                <dd>{counts.izin}</dd>
              </div>
              <div>
                <dt>Cuti</dt>
                <dd>{counts.cuti}</dd>
              </div>
              <div>
                <dt>Tidak Hadir</dt>
                <dd>{counts.tidak}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
      <section id="pengaturan" className={styles["ak-card"]} style={{ marginTop: 16 }}>
        <h2>Pengaturan Absensi</h2>
        <p>Atur jam kerja, hari libur, lokasi kantor, radius GPS, dan verifikasi absensi.</p>
        {canManage ? (
          <form action={simpanPengaturanKehadiranAction} className={styles["ak-form"]}>
            <label>
              Jam Masuk
              <input type="time" name="jamMasuk" defaultValue={setting.jamMasuk} />
            </label>
            <label>
              Jam Pulang
              <input type="time" name="jamKeluar" defaultValue={setting.jamKeluar} />
            </label>
            <label>
              Latitude Kantor
              <input
                name="latitudeKantor"
                type="number"
                step="any"
                min="-90"
                max="90"
                defaultValue={setting.latitudeKantor ?? ""}
                placeholder="-3.123456"
              />
            </label>
            <label>
              Longitude Kantor
              <input
                name="longitudeKantor"
                type="number"
                step="any"
                min="-180"
                max="180"
                defaultValue={setting.longitudeKantor ?? ""}
                placeholder="99.123456"
              />
            </label>
            <label>
              Radius Geofence (meter)
              <input
                name="radiusMeter"
                type="number"
                min="20"
                max="5000"
                defaultValue={setting.radiusMeter ?? 100}
              />
            </label>
            <label>
              Toleransi Terlambat (menit)
              <input
                name="toleransiTerlambatMenit"
                type="number"
                min="0"
                max="180"
                defaultValue={setting.toleransiTerlambatMenit ?? 0}
              />
            </label>
            <div className={styles.wide}>
              <strong>Validasi Absensi Mandiri</strong>
              <div className={styles["ak-filter"]}>
                <label>
                  <input
                    type="checkbox"
                    name="wajibGps"
                    value="1"
                    defaultChecked={setting.wajibGps !== false}
                  />{" "}
                  Wajib GPS dan radius lokasi kantor
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="wajibFoto"
                    value="1"
                    defaultChecked={setting.wajibFoto !== false}
                  />{" "}
                  Wajib foto selfie saat check-in
                </label>
              </div>
            </div>
            <div className={styles.wide}>
              <strong>Hari Libur</strong>
              <div className={styles["ak-filter"]}>
                {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map(
                  (day, index) => (
                    <label key={day}>
                      <input
                        type="checkbox"
                        name="hariLibur"
                        value={index}
                        defaultChecked={hariLibur.includes(index)}
                      />{" "}
                      {day}
                    </label>
                  ),
                )}
              </div>
            </div>
            <Button className={styles["ak-button"]} type="submit">
              Simpan Pengaturan
            </Button>
          </form>
        ) : (
          <p>Akun ini hanya memiliki akses baca pengaturan absensi.</p>
        )}
      </section>
    </div>
  );
}
