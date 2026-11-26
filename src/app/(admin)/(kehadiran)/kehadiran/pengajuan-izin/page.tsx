import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import {
  formatRentang,
  JENIS_PENGAJUAN_IZIN,
  KETERANGAN_PENGAJUAN_MAKS,
  labelJenisPengajuan,
  labelStatusPengajuan,
} from "@/features/kehadiran/kehadiran/domain/pengajuan-izin";
import { getPengajuanIzinData } from "@/features/kehadiran/kepegawaian/application/pengajuan-izin-use-cases";

import { ajukanPengajuanIzinAction, batalkanPengajuanIzinAction } from "./actions";

export const metadata: Metadata = { title: "Pengajuan Izin" };

const PESAN_STATUS: Readonly<Record<string, string>> = {
  diajukan: "Pengajuan izin berhasil dikirim dan menunggu keputusan.",
  dibatalkan: "Pengajuan izin berhasil dibatalkan.",
};

function nilaiTunggal(nilai: string | string[] | undefined): string {
  if (Array.isArray(nilai)) return nilai[0] ?? "";
  return nilai ?? "";
}

export default async function PengajuanIzinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, data] = await Promise.all([searchParams, getPengajuanIzinData()]);
  // Setiap pamong yang akunnya tertaut boleh mengajukan/membatalkan izinnya
  // sendiri; pemegang izin persetujuan boleh mewakili pegawai lain.
  const bolehAjukan = Boolean(data.pegawaiAkun) || data.bolehPilihPegawai;
  const bolehBatalkan = bolehAjukan;
  const pesanStatus = PESAN_STATUS[nilaiTunggal(params.status)];
  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Pengajuan Izin</>}
        deskripsi={<>Ajukan izin, sakit, dinas luar kota, atau cuti.</>}
      />

      {pesanStatus ? (
        <p className="form-help" role="status">
          {pesanStatus}
        </p>
      ) : null}

      {!data.pegawaiAkun ? (
        <p className="form-help" role="status">
          Akun belum tertaut ke data pegawai; minta admin mengisi email di profil pegawai.
        </p>
      ) : null}

      {bolehAjukan ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Ajukan Izin</h2>
            <p>
              Lampiran surat dokter wajib untuk jenis Sakit. Durasi dihitung dari hari kerja sesuai
              pengaturan hari libur desa.
            </p>
          </header>

          <form action={ajukanPengajuanIzinAction} className="form-stack">
            <div className="modul-form-grid">
              {data.bolehPilihPegawai ? (
                <label className="form-field">
                  <span className="form-label">Nama Pegawai</span>
                  <select className="form-input" name="pegawaiId" required>
                    {data.pegawai.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                        {item.jabatan ? ` — ${item.jabatan}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="form-field">
                  <span className="form-label">Nama Pegawai</span>
                  <input
                    className="form-input"
                    readOnly
                    value={data.pegawaiAkun?.nama ?? "Akun belum tertaut ke pegawai"}
                  />
                </label>
              )}

              <label className="form-field">
                <span className="form-label">Jenis Izin</span>
                <select className="form-input" defaultValue="izin" name="jenis" required>
                  {JENIS_PENGAJUAN_IZIN.map((item) => (
                    <option key={item.nilai} value={item.nilai}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span className="form-help">
                  {JENIS_PENGAJUAN_IZIN.map((item) => `${item.label}: ${item.keterangan}`).join(
                    ". ",
                  )}
                  .
                </span>
              </label>

              <label className="form-field">
                <span className="form-label">Tanggal Mulai</span>
                <input className="form-input" min={hariIni} name="mulai" required type="date" />
              </label>

              <label className="form-field">
                <span className="form-label">Tanggal Selesai</span>
                <input className="form-input" min={hariIni} name="selesai" required type="date" />
              </label>

              <label className="form-field">
                <span className="form-label">Keterangan</span>
                <textarea
                  className="form-input"
                  maxLength={KETERANGAN_PENGAJUAN_MAKS}
                  name="keterangan"
                  placeholder="Jelaskan alasan pengajuan izin"
                  required
                  rows={3}
                />
              </label>

              <label className="form-field">
                <span className="form-label">Lampiran Pendukung</span>
                <input
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="form-input"
                  name="lampiran"
                  type="file"
                />
                <span className="form-help">
                  PDF/JPG/PNG/WEBP, maksimal 10 MB. Wajib untuk jenis Sakit.
                </span>
              </label>
            </div>

            <div className="penduduk-heading-actions">
              <button className="button button-primary" type="submit">
                Kirim Pengajuan
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Pengajuan Saya</h2>
          <p>
            {data.rows.length === 0
              ? "Belum ada pengajuan pada tahun ini."
              : `${data.rows.length} pengajuan pada tahun ${data.tahun}.`}
          </p>
        </header>

        {data.rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada pengajuan izin.</strong>
            <p>Pengajuan yang Anda kirim akan tampil di sini beserta status keputusannya.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Jenis</th>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Durasi</th>
                  <th scope="col">Keterangan</th>
                  <th scope="col">Status</th>
                  {bolehBatalkan ? <th scope="col">Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{labelJenisPengajuan(row.jenis)}</td>
                    <td>{formatRentang(row.mulai, row.selesai)}</td>
                    <td>{row.durasi} hari kerja</td>
                    <td>
                      {row.keterangan}
                      {row.lampiran ? (
                        <>
                          <br />
                          <a href={`/api/kepegawaian/cuti/${row.id}/lampiran`}>Lihat lampiran</a>
                        </>
                      ) : null}
                      {row.catatan ? (
                        <>
                          <br />
                          <span className="form-help">Catatan: {row.catatan}</span>
                        </>
                      ) : null}
                    </td>
                    <td>{labelStatusPengajuan(row.status)}</td>
                    {bolehBatalkan ? (
                      <td>
                        {row.status === "menunggu" ? (
                          <form action={batalkanPengajuanIzinAction}>
                            <input name="id" type="hidden" value={row.id} />
                            <ConfirmSubmit
                              className="button button-ghost"
                              message="Batalkan pengajuan izin ini?"
                            >
                              Batalkan
                            </ConfirmSubmit>
                          </form>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="form-help">
          Keputusan pengajuan dilakukan pada menu{" "}
          <Link href="/kehadiran/persetujuan-izin">Persetujuan Izin</Link>.
        </p>
      </section>
    </div>
  );
}
