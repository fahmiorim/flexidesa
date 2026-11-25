import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getPermohonanAdminData } from "@/features/layanan-mandiri/application/admin-use-cases";
import {
  labelPermohonanStatus,
  PERMOHONAN_STATUS_LABELS,
} from "@/features/layanan-mandiri/domain/layanan-mandiri";

import { hapusPermohonanAction, hapusPermohonanMassalAction } from "./actions";

export const metadata: Metadata = { title: "Permohonan Surat" };

type SearchParams = Promise<{
  dari?: string;
  sampai?: string;
  jenis?: string;
  status?: string;
  q?: string;
  berhasil?: string;
  jumlah?: string;
  page?: string;
}>;

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function tanggalValid(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function angkaValid(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}

function tanggal(value: Date | null): string {
  return value ? FORMAT_TANGGAL.format(value) : "—";
}

/**
 * Filter status: satu nilai (`2`) atau beberapa nilai dipisah koma (`1,2`).
 * Nilai di luar 0–5 diabaikan agar URL manual tidak mengubah perilaku.
 */
function statusValid(nilai: string | undefined): number | readonly number[] | undefined {
  if (!nilai) return undefined;
  const bagian = nilai
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^[0-5]$/.test(item));
  if (bagian.length === 0) return undefined;

  const unik = [...new Set(bagian.map(Number))];
  return unik.length === 1 ? unik[0] : unik;
}

function toneStatus(status: number): string {
  if (status === 3 || status === 4) return "hijau";
  if (status === 5) return "merah";
  if (status === 0) return "netral";
  return "ungu";
}

export default async function PermohonanSuratPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const kataKunci = (params.q ?? "").trim().slice(0, 100);
  const filter = {
    q: kataKunci || undefined,
    dari: tanggalValid(params.dari),
    sampai: tanggalValid(params.sampai),
    typeId: angkaValid(params.jenis),
    status: statusValid(params.status),
  };
  const hasil = await getPermohonanAdminData(filter);
  const { permohonan, jenis, canManage, canDelete } = hasil;
  const total = permohonan.length;
  const pageSize = 20;
  const requestedPage = angkaValid(params.page) ?? 1;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const pageRows = permohonan.slice((page - 1) * pageSize, page * pageSize);
  const menunggu = permohonan.filter(
    (row) => row.status === 0 || row.status === 1 || row.status === 2,
  ).length;
  const selesai = permohonan.filter((row) => row.status === 3 || row.status === 4).length;
  const dibatalkan = permohonan.filter((row) => row.status === 5).length;

  const query = new URLSearchParams();
  if (filter.q) query.set("q", filter.q);
  if (filter.dari) query.set("dari", filter.dari);
  if (filter.sampai) query.set("sampai", filter.sampai);
  if (filter.typeId !== undefined) query.set("jenis", String(filter.typeId));
  if (filter.status !== undefined) {
    query.set(
      "status",
      Array.isArray(filter.status) ? filter.status.join(",") : String(filter.status),
    );
  }
  const exportHref = query.size
    ? `/permohonan-surat/ekspor?${query.toString()}`
    : "/permohonan-surat/ekspor";

  return (
    <div className="modul-page">
      <PageHeading>
        <div className="page-heading">
          <div>
            <h1>Permohonan Surat</h1>
            <p>Proses permohonan surat dari warga.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link className="button button-secondary" href="/persuratan/dashboard">
              Dashboard Surat
            </Link>
            <a className="button button-primary" href={exportHref}>
              Ekspor CSV
            </a>
          </div>
        </div>
      </PageHeading>

      <div
        className="beranda-kpi-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}
      >
        <article className="beranda-card beranda-kpi" data-tone="ungu">
          <span className="beranda-kpi-icon" aria-hidden="true">
            ▤
          </span>
          <div className="beranda-kpi-body">
            <span className="beranda-kpi-label">Total Permohonan</span>
            <strong className="beranda-kpi-value">{total.toLocaleString("id-ID")}</strong>
            <span className="beranda-chip" data-tone="netral">
              Sesuai filter
            </span>
          </div>
        </article>
        <article className="beranda-card beranda-kpi" data-tone="biru">
          <span className="beranda-kpi-icon" aria-hidden="true">
            ◷
          </span>
          <div className="beranda-kpi-body">
            <span className="beranda-kpi-label">Dalam Proses</span>
            <strong className="beranda-kpi-value">{menunggu.toLocaleString("id-ID")}</strong>
            <span className="beranda-chip" data-tone="ungu">
              Belum selesai
            </span>
          </div>
        </article>
        <article className="beranda-card beranda-kpi" data-tone="hijau">
          <span className="beranda-kpi-icon" aria-hidden="true">
            ✓
          </span>
          <div className="beranda-kpi-body">
            <span className="beranda-kpi-label">Selesai</span>
            <strong className="beranda-kpi-value">{selesai.toLocaleString("id-ID")}</strong>
            <span className="beranda-chip" data-tone="hijau">
              Siap / sudah diambil
            </span>
          </div>
        </article>
        <article className="beranda-card beranda-kpi" data-tone="jingga">
          <span className="beranda-kpi-icon" aria-hidden="true">
            ×
          </span>
          <div className="beranda-kpi-body">
            <span className="beranda-kpi-label">Dibatalkan</span>
            <strong className="beranda-kpi-value">{dibatalkan.toLocaleString("id-ID")}</strong>
            <span className="beranda-chip" data-tone="netral">
              Permohonan batal
            </span>
          </div>
        </article>
      </div>

      <section className="modul-card" style={{ marginBottom: 18 }}>
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Filter Permohonan</h2>
            <p className="modul-muted">
              Cari berdasarkan tanggal masuk, jenis surat, atau status layanan.
            </p>
          </div>
          <Link href="/permohonan-surat" className="modul-muted">
            Reset filter
          </Link>
        </div>
        <form
          method="get"
          action="/permohonan-surat"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <label
            style={{
              display: "grid",
              gap: 6,
              color: "var(--color-text-muted)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>Dari tanggal</span>
            <input type="date" name="dari" defaultValue={filter.dari} />
          </label>
          <label className="modul-field">
            <span>Sampai tanggal</span>
            <input type="date" name="sampai" min={filter.dari} defaultValue={filter.sampai} />
          </label>
          <label className="modul-field">
            <span>Jenis surat</span>
            <select name="jenis" defaultValue={filter.typeId?.toString() ?? ""}>
              <option value="">Semua jenis surat</option>
              {jenis.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama}
                </option>
              ))}
            </select>
          </label>
          <label className="modul-field">
            <span>Status</span>
            <select
              name="status"
              defaultValue={
                Array.isArray(filter.status)
                  ? filter.status.join(",")
                  : (filter.status?.toString() ?? "")
              }
            >
              <option value="">Semua status</option>
              <option value="1,2">Menunggu tindakan (diperiksa + TTE)</option>
              {Object.entries(PERMOHONAN_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="modul-field" style={{ gridColumn: "1 / -1" }}>
            <span>Cari nama, NIK, nomor antrean, nomor HP, atau jenis surat</span>
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={kataKunci}
              placeholder="Contoh: Budi atau 3201010101010001"
            />
          </label>
          <div style={{ display: "flex", alignItems: "end" }}>
            <button type="submit" className="button button-primary">
              Terapkan Filter
            </button>
          </div>
        </form>
      </section>

      {params.berhasil === "dihapus" ? (
        <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
          {params.jumlah && /^\d+$/.test(params.jumlah)
            ? `${params.jumlah} permohonan yang dibatalkan berhasil dihapus.`
            : "Permohonan yang dibatalkan berhasil dihapus."}
        </div>
      ) : null}

      <section className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Daftar Permohonan</h2>
            <p className="modul-muted">{total.toLocaleString("id-ID")} permohonan ditemukan</p>
          </div>
          {canManage ? (
            <span className="beranda-chip" data-tone="hijau">
              Akses pengelolaan aktif
            </span>
          ) : (
            <span className="beranda-chip" data-tone="netral">
              Akses baca saja
            </span>
          )}
        </div>
        {canDelete ? (
          <>
            {/* Checkbox di tabel terhubung ke form ini lewat atribut `form` agar
                tidak bersarang dengan form hapus per baris. */}
            <form id="hapus-permohonan-massal" action={hapusPermohonanMassalAction} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <ConfirmSubmit
                className="button button-danger"
                form="hapus-permohonan-massal"
                message="Hapus semua permohonan batal yang dicentang? Berkas persyaratannya juga akan dihapus."
              >
                Hapus Terpilih
              </ConfirmSubmit>
            </div>
          </>
        ) : null}

        {permohonan.length === 0 ? (
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 8,
              padding: "42px 20px",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            <span aria-hidden="true">▤</span>
            <strong>Belum ada permohonan</strong>
            <p>Tidak ada data yang sesuai dengan filter saat ini.</p>
            <Link href="/permohonan-surat">Tampilkan semua permohonan</Link>
          </div>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  {canDelete ? <th scope="col">Pilih</th> : null}
                  <th scope="col">No. Antrian</th>
                  <th scope="col">Pemohon</th>
                  <th scope="col">No. HP Aktif</th>
                  <th scope="col">Jenis Surat</th>
                  <th scope="col">Keterangan</th>
                  <th scope="col">Tanggal Masuk</th>
                  <th scope="col">Status</th>
                  <th scope="col">Nomor Surat</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    {canDelete ? (
                      <td>
                        {row.status === 5 ? (
                          <input
                            aria-label={`Pilih permohonan ${row.noAntrian ?? `#${row.id}`}`}
                            form="hapus-permohonan-massal"
                            name="idCb"
                            type="checkbox"
                            value={row.id}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td className="modul-mono">{row.noAntrian ?? `#${row.id}`}</td>
                    <td>
                      <strong>{row.namaPemohon ?? "Data pemohon tidak tersedia"}</strong>
                      <span className="modul-muted">{row.nikPemohon ?? "NIK tidak tersedia"}</span>
                    </td>
                    <td>{row.noHpAktif ?? "—"}</td>
                    <td>
                      <strong>{row.namaSurat ?? "Jenis surat tidak tersedia"}</strong>
                    </td>
                    <td style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>
                      {row.keterangan?.trim() ? row.keterangan : "—"}
                    </td>
                    <td>{tanggal(row.createdAt)}</td>
                    <td>
                      <span className="beranda-chip" data-tone={toneStatus(row.status)}>
                        {labelPermohonanStatus(row.status)}
                      </span>
                    </td>
                    <td className="modul-mono">{row.letterNumber ?? "—"}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Link
                          href={`/permohonan-surat/${row.id}`}
                          style={{
                            color: "var(--color-brand)",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Lihat detail →
                        </Link>
                        {row.status === 5 && canDelete ? (
                          <form action={hapusPermohonanAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <ConfirmSubmit
                              className="button button-danger-ghost"
                              message={`Hapus permohonan ${row.noAntrian ?? `#${row.id}`} secara permanen? Berkas persyaratan juga akan dihapus.`}
                            >
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 ? (
          <div
            className="modul-total"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>
              Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari{" "}
              {total.toLocaleString("id-ID")} permohonan
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {page > 1 ? (
                <Link
                  className="button button-secondary"
                  href={`/permohonan-surat?${query.toString()}${query.size ? "&" : ""}page=${page - 1}`}
                >
                  Sebelumnya
                </Link>
              ) : null}
              <span style={{ alignSelf: "center" }}>
                Halaman {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <Link
                  className="button button-secondary"
                  href={`/permohonan-surat?${query.toString()}${query.size ? "&" : ""}page=${page + 1}`}
                >
                  Berikutnya
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
