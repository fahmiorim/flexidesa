import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeading } from "@/components/shell/page-heading";
import {
  dashboardAktivitasTerbaru,
  dashboardPermohonanTerbaru,
  dashboardStatistikUmur,
  dashboardStats,
  dashboardTrenPermohonan,
} from "@/features/beranda/dashboard/application/dashboard-use-cases";
import { labelAktivitas, toneAktivitas } from "@/features/beranda/dashboard/domain/aktivitas";
import { waktuRelatif } from "@/features/beranda/dashboard/domain/waktu-relatif";
import { getStatistikDesa } from "@/features/info-desa/desa/application/statistik-desa";
import { getIdentitasDesaUseCase } from "@/features/info-desa/desa/application/use-cases";
import { getLaporanKeuangan } from "@/features/keuangan-desa/keuangan/application/keuangan-use-cases";
import { isSuperAdminUser } from "@/features/multi-desa/application/provisioning-use-cases";
import { labelPermohonanStatus } from "@/features/pelayanan-persuratan/layanan-mandiri/domain/layanan-mandiri";
import { getBukuPembangunan } from "@/features/pembangunan-aset/pembangunan/application/use-cases";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { verifySession } from "@/lib/dal";

import { StatistikPenduduk } from "./statistik-penduduk";
import { TrenLayananSurat } from "./tren-layanan-surat";

export const metadata: Metadata = {
  title: "Dashboard Admin Desa",
};

function Ikon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function ikonKpi(jenis: "penduduk" | "keluarga" | "surat" | "pengaduan") {
  if (jenis === "penduduk") {
    return (
      <Ikon>
        <circle cx="9" cy="8" r="3.1" />
        <path d="M3.4 19.5a5.8 5.8 0 0 1 11.2 0" />
        <path d="M16.2 5.4a3.1 3.1 0 0 1 0 5.2" />
        <path d="M18.1 14.3a5.8 5.8 0 0 1 3 5.2" />
      </Ikon>
    );
  }
  if (jenis === "keluarga") {
    return (
      <Ikon>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 9.8V20h12V9.8" />
        <path d="M10 20v-4.6h4V20" />
      </Ikon>
    );
  }
  if (jenis === "surat") {
    return (
      <Ikon>
        <path d="M6 3.5h8.2L19 8.3V20.5H6z" />
        <path d="M14 3.5v5h5" />
        <path d="M9 13h6" />
        <path d="M9 16.5h4.5" />
      </Ikon>
    );
  }
  return (
    <Ikon>
      <path d="M4 5.5h16v10H9l-5 4z" />
      <path d="M8 9.5h8" />
      <path d="M8 12.5h5" />
    </Ikon>
  );
}

function ikonAktivitas(event: string) {
  if (event.startsWith("pengguna.") || event.startsWith("penduduk.")) {
    return (
      <Ikon>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </Ikon>
    );
  }
  if (event.startsWith("grup-akses.")) {
    return (
      <Ikon>
        <path d="M12 3.5 19 6v5.4c0 4.2-2.9 7.6-7 9.1-4.1-1.5-7-4.9-7-9.1V6z" />
        <path d="m9.3 11.8 1.9 1.9 3.5-3.6" />
      </Ikon>
    );
  }
  if (event.startsWith("auth.")) {
    return (
      <Ikon>
        <circle cx="8" cy="12" r="3.4" />
        <path d="M11.4 12H21" />
        <path d="M18 12v3" />
      </Ikon>
    );
  }
  if (event.startsWith("pengaduan.")) {
    return (
      <Ikon>
        <path d="M4 5.5h16v10H9l-5 4z" />
        <path d="M8 9.5h8" />
      </Ikon>
    );
  }
  if (event.startsWith("surat.") || event.startsWith("permohonan.")) {
    return (
      <Ikon>
        <path d="M6 3.5h8.2L19 8.3V20.5H6z" />
        <path d="M14 3.5v5h5" />
        <path d="M9 13h6" />
      </Ikon>
    );
  }
  return (
    <Ikon>
      <path d="M4.5 7h15" />
      <path d="M4.5 12h15" />
      <path d="M4.5 17h9" />
    </Ikon>
  );
}

export default async function AdminHomePage() {
  const user = await verifySession();

  if (await isSuperAdminUser(user)) {
    redirect("/super-admin");
  }

  const villageId = user.villageId;
  const bolehPenduduk = hasPermission(user.permissions, RESOURCES.penduduk, "read");

  const data =
    villageId === null
      ? null
      : await Promise.all([
          getIdentitasDesaUseCase(villageId),
          dashboardStats(villageId),
          // Agregat penduduk hanya diambil bila peran ini boleh membacanya.
          // Angka KPI dan grafik memakai sumber yang sama agar tidak ada data
          // yang tampil tanpa izin.
          bolehPenduduk ? getStatistikDesa(villageId) : Promise.resolve(null),
          bolehPenduduk ? dashboardStatistikUmur(villageId) : Promise.resolve([]),
          dashboardTrenPermohonan(villageId),
          dashboardAktivitasTerbaru(villageId),
          hasPermission(user.permissions, RESOURCES.laporanKeuangan, "read")
            ? getLaporanKeuangan()
            : Promise.resolve(null),
          hasPermission(user.permissions, RESOURCES.pembangunan, "read")
            ? getBukuPembangunan(new Date().getFullYear())
            : Promise.resolve([]),
          hasPermission(user.permissions, RESOURCES.surat, "read")
            ? dashboardPermohonanTerbaru(villageId, 5)
            : Promise.resolve([]),
        ]);

  const identitas = data?.[0] ?? null;
  const stats = data?.[1] ?? null;
  const statistik = data?.[2] ?? null;
  const perUmur = data?.[3] ?? [];
  const tren = data?.[4] ?? [];
  const aktivitas = data?.[5] ?? [];
  const laporanApbdes = data?.[6] ?? null;
  const programPrioritas = data?.[7] ?? [];
  const permohonanTerbaru = data?.[8] ?? [];

  const namaDesa = identitas?.namaDesa ?? "Desa";

  const sekarang = new Date();

  const bolehKeluarga = hasPermission(user.permissions, RESOURCES.keluarga, "read");
  const bolehSurat = hasPermission(user.permissions, RESOURCES.surat, "read");
  const bolehPengaduan = hasPermission(user.permissions, RESOURCES.pengaduan, "read");

  // KPI ringkas: empat angka yang menuntut tindakan atau dipakai harian.
  // Angka pendukung lain (penduduk per gender, dusun, RTM, kelompok, lembaga,
  // program bantuan) sengaja tidak dijadikan kartu agar beranda tidak padat;
  // semuanya tetap tersedia di halaman modul masing-masing.
  // Setiap KPI bisa diklik ke daftar yang sudah terfilter dan hanya tampil
  // bila pengguna punya izin baca modul tujuannya.
  const pintasan = [
    {
      tampil: bolehPenduduk && Boolean(statistik),
      label: "Penduduk",
      nilai: statistik?.total ?? 0,
      satuan: "jiwa",
      href: "/kependudukan/penduduk",
      tone: "biru",
      ikon: ikonKpi("penduduk"),
    },
    {
      tampil: bolehKeluarga && Boolean(stats),
      label: "Kartu Keluarga",
      nilai: stats?.families ?? 0,
      satuan: "KK",
      href: "/kependudukan/keluarga",
      tone: "ungu",
      ikon: ikonKpi("keluarga"),
    },
    {
      tampil: bolehSurat && Boolean(stats),
      label: "Surat Menunggu Tindakan",
      nilai: stats?.permohonanMenunggu ?? 0,
      satuan: "berkas",
      href: "/layanan-surat/permohonan-surat?status=1,2",
      tone: "hijau",
      ikon: ikonKpi("surat"),
    },
    {
      tampil: bolehPengaduan && Boolean(stats),
      label: "Pengaduan Belum Ditindaklanjuti",
      nilai: stats?.complaintsBaru ?? 0,
      satuan: "laporan",
      href: "/pengaduan-admin?status=baru",
      tone: "merah",
      ikon: ikonKpi("pengaduan"),
    },
  ].filter((item) => item.tampil);

  return (
    <div className="beranda">
      <PageHeading
        judul={<>Dashboard Admin Desa</>}
        deskripsi={<>Layanan, data, dan pembangunan {namaDesa}.</>}
        kelas="beranda-head"
      />

      {stats ? (
        <>
          <div className="beranda-pintasan">
            {pintasan.map((item) => (
              <Link
                className="beranda-shortcut"
                data-tone={item.tone}
                href={item.href}
                key={item.label}
              >
                <span className="beranda-kpi-icon">{item.ikon}</span>
                <div className="beranda-shortcut-body">
                  <span className="beranda-kpi-label">{item.label}</span>
                  <strong className="beranda-shortcut-value">
                    {item.nilai.toLocaleString("id-ID")} <span>{item.satuan}</span>
                  </strong>
                </div>
                <span className="beranda-shortcut-foot">
                  Lihat daftar
                  <Ikon>
                    <path d="M5 12h13" />
                    <path d="m13 6.5 5.5 5.5-5.5 5.5" />
                  </Ikon>
                </span>
              </Link>
            ))}
          </div>

          <div className="beranda-grid">
            {statistik ? (
              <StatistikPenduduk
                lakiLaki={statistik.lakiLaki}
                perempuan={statistik.perempuan}
                perDusun={statistik.perDusun}
                perUmur={perUmur}
              />
            ) : (
              <section className="beranda-card" aria-labelledby="statistik-penduduk-terbatas">
                <div className="beranda-card-head">
                  <h2 className="beranda-card-title" id="statistik-penduduk-terbatas">
                    Statistik Penduduk
                  </h2>
                </div>
                <p className="beranda-empty">
                  Akun ini tidak memiliki akses membaca statistik penduduk.
                </p>
              </section>
            )}
            <section className="beranda-card" aria-labelledby="tren-layanan-surat">
              <div className="beranda-card-head">
                <h2 className="beranda-card-title" id="tren-layanan-surat">
                  <span className="beranda-title-icon" aria-hidden="true">
                    <Ikon>
                      <path d="M4 19V5" />
                      <path d="M4 19h16" />
                      <path d="m7 14 3.5-3.5 3 2.5L20 7" />
                    </Ikon>
                  </span>
                  Tren Layanan Surat
                </h2>
                <span className="beranda-range">6 Bulan Terakhir</span>
              </div>
              <TrenLayananSurat titik={tren} />
            </section>
          </div>

          <div className="beranda-grid beranda-grid-dashboard-extra">
            {laporanApbdes ? (
              <section className="beranda-card" aria-labelledby="dashboard-apbdes">
                <div className="beranda-card-head">
                  <h2 className="beranda-card-title" id="dashboard-apbdes">
                    Realisasi APBDes Tahun {laporanApbdes.tahun}
                  </h2>
                  <Link href="/keuangan">Detail →</Link>
                </div>
                <div className="beranda-apbdes-summary">
                  <div
                    className="beranda-apbdes-ring"
                    style={
                      {
                        "--realisasi": `${Math.min(100, Math.max(0, Number(laporanApbdes.total.anggaran) > 0 ? (Number(laporanApbdes.total.realisasi) / Number(laporanApbdes.total.anggaran)) * 100 : 0))}%`,
                      } as React.CSSProperties
                    }
                  >
                    <strong>
                      {Number(laporanApbdes.total.anggaran) > 0
                        ? `${((Number(laporanApbdes.total.realisasi) / Number(laporanApbdes.total.anggaran)) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
                        : "—"}
                    </strong>
                    <span>Realisasi</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Pagu Anggaran</dt>
                      <dd>Rp {Number(laporanApbdes.total.anggaran).toLocaleString("id-ID")}</dd>
                    </div>
                    <div>
                      <dt>Realisasi</dt>
                      <dd>Rp {Number(laporanApbdes.total.realisasi).toLocaleString("id-ID")}</dd>
                    </div>
                    <div>
                      <dt>Sisa Anggaran</dt>
                      <dd>Rp {Number(laporanApbdes.total.selisih).toLocaleString("id-ID")}</dd>
                    </div>
                  </dl>
                </div>
              </section>
            ) : null}
            {hasPermission(user.permissions, RESOURCES.pembangunan, "read") ? (
              <section className="beranda-card" aria-labelledby="dashboard-program">
                <div className="beranda-card-head">
                  <h2 className="beranda-card-title" id="dashboard-program">
                    Program & Kegiatan Prioritas
                  </h2>
                  <Link href="/keuangan/kegiatan">Detail →</Link>
                </div>
                {programPrioritas.length === 0 ? (
                  <p className="beranda-empty">
                    Belum ada program pembangunan untuk tahun berjalan.
                  </p>
                ) : (
                  <ul className="beranda-program-list">
                    {programPrioritas.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.judul}</strong>
                          <span>{item.lokasi ?? "Lokasi belum diisi"}</span>
                        </div>
                        <div className="beranda-program-progress">
                          <span style={{ width: `${Math.min(100, Math.max(0, item.progres))}%` }} />
                        </div>
                        <strong>{item.progres}%</strong>
                        <span className="beranda-program-status">{item.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}
          </div>

          <div className="beranda-bottom beranda-bottom-dashboard">
            <section className="beranda-card" aria-labelledby="aktivitas-terbaru">
              <div className="beranda-card-head">
                <h2 className="beranda-card-title" id="aktivitas-terbaru">
                  <span className="beranda-title-icon" aria-hidden="true">
                    <Ikon>
                      <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
                    </Ikon>
                  </span>
                  Aktivitas Terbaru
                </h2>
              </div>
              {aktivitas.length === 0 ? (
                <p className="beranda-empty">Belum ada aktivitas tercatat.</p>
              ) : (
                <ol className="beranda-feed">
                  {aktivitas.slice(0, 5).map((catatan) => (
                    <li key={catatan.id}>
                      <span
                        className="beranda-feed-icon"
                        data-tone={toneAktivitas(catatan.event)}
                        aria-hidden="true"
                      >
                        {ikonAktivitas(catatan.event)}
                      </span>
                      <div className="beranda-feed-body">
                        <strong>{labelAktivitas(catatan.event)}</strong>
                        <span>
                          {catatan.actorName ?? "Sistem"} ·{" "}
                          {waktuRelatif(catatan.createdAt, sekarang)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="beranda-card" aria-labelledby="permohonan-terbaru">
              <div className="beranda-card-head">
                <h2 className="beranda-card-title" id="permohonan-terbaru">
                  <span className="beranda-title-icon" aria-hidden="true">
                    <Ikon>
                      <path d="M6 3h9l4 4v14H6z" />
                      <path d="M15 3v4h4M9 12h7M9 16h5" />
                    </Ikon>
                  </span>
                  Permohonan Surat Terbaru
                </h2>
                {bolehSurat ? (
                  <Link href="/layanan-surat/permohonan-surat">Lihat Semua →</Link>
                ) : null}
              </div>
              {!bolehSurat ? (
                <p className="beranda-empty">
                  Akun ini tidak memiliki akses membaca permohonan surat.
                </p>
              ) : permohonanTerbaru.length === 0 ? (
                <p className="beranda-empty">Belum ada permohonan surat yang masuk.</p>
              ) : (
                <ul className="beranda-permohonan-list">
                  {permohonanTerbaru.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <Link href={`/layanan-surat/permohonan-surat/${item.id}`}>
                        <strong>{item.pemohon}</strong>
                        <span>{item.jenisSurat}</span>
                      </Link>
                      <span className="beranda-chip" data-status={item.status}>
                        {labelPermohonanStatus(item.status)}
                      </span>
                      <time dateTime={item.diajukanPada.toISOString()}>
                        {waktuRelatif(item.diajukanPada, sekarang)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : (
        <section className="beranda-card">
          <h2>Data desa belum tersedia</h2>
          <p className="beranda-empty">Akun ini belum terhubung dengan tenant desa.</p>
        </section>
      )}
    </div>
  );
}
