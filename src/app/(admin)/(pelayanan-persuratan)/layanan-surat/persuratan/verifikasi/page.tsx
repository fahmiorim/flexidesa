import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getVerifikasiSuratData } from "@/features/pelayanan-persuratan/surat/application/verifikasi";
import {
  VERIFICATION_STEP_LABELS,
  VERIFICATION_STEPS,
} from "@/features/pelayanan-persuratan/surat/domain/surat";
import type { ScopeVerifikasi } from "@/features/pelayanan-persuratan/surat/domain/verifikasi-antrean";

export const metadata: Metadata = { title: "Verifikasi Surat" };

type SearchParams = Promise<{ q?: string; scope?: string; page?: string }>;

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function scopeValid(value: string | undefined, tahapPengguna: readonly string[]): ScopeVerifikasi {
  if (value === "semua") return "semua";
  if (value && (VERIFICATION_STEPS as readonly string[]).includes(value)) {
    return value as ScopeVerifikasi;
  }
  return tahapPengguna.length > 0 ? "saya" : "semua";
}

function angkaHalaman(value: string | undefined): number {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}

export default async function VerifikasiSuratPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  // Scope baku bergantung pada tahap role pengguna; dibaca dulu lewat
  // pencarian ringan agar tautan tanpa parameter tetap konsisten.
  const awal = await getVerifikasiSuratData({ search: "", scope: "semua" });
  const scope = scopeValid(params.scope, awal.tahapPengguna);
  const data =
    scope === "semua" && awal.tahapPengguna.length === 0
      ? awal
      : await getVerifikasiSuratData({
          search: (params.q ?? "").trim().slice(0, 100),
          scope,
        });

  const total = data.rows.length;
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(angkaHalaman(params.page), pageCount);
  const pageRows = data.rows.slice((page - 1) * pageSize, page * pageSize);

  const query = new URLSearchParams();
  if (params.q?.trim()) query.set("q", params.q.trim().slice(0, 100));
  if (scope !== "semua") query.set("scope", scope);
  const hrefPage = (target: number) => {
    const next = new URLSearchParams(query);
    next.set("page", String(target));
    return `/layanan-surat/persuratan/verifikasi?${next.toString()}`;
  };

  const labelScope =
    scope === "saya"
      ? `Tahap saya (${data.tahapPengguna.map((step) => VERIFICATION_STEP_LABELS[step]).join(", ") || "tidak ada"})`
      : scope === "semua"
        ? "Semua tahap"
        : `Tahap ${VERIFICATION_STEP_LABELS[scope]}`;

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Verifikasi Surat</>}
        deskripsi={<>Antrean persetujuan surat berjenjang.</>}
        aksi={
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/layanan-surat/persuratan/surat" className="button button-secondary">
                Daftar Surat
              </Link>
              <Link href="/layanan-surat/persuratan/dashboard" className="button button-secondary">
                Dashboard Surat
              </Link>
            </div>
          </>
        }
      />

      <div className="beranda-kpi-grid">
        <article className="beranda-card beranda-kpi" data-tone="ungu">
          <span className="beranda-kpi-icon" aria-hidden="true">
            ◷
          </span>
          <div className="beranda-kpi-body">
            <span className="beranda-kpi-label">Total Antrean</span>
            <strong className="beranda-kpi-value">
              {data.totalAntrean.toLocaleString("id-ID")}
            </strong>
            <span className="beranda-chip" data-tone="ungu">
              Menunggu persetujuan
            </span>
          </div>
        </article>
        {VERIFICATION_STEPS.map((step) => (
          <article key={step} className="beranda-card beranda-kpi" data-tone="biru">
            <span className="beranda-kpi-icon" aria-hidden="true">
              {step === "operator" ? "▣" : step === "sekdes" ? "✎" : "✓"}
            </span>
            <div className="beranda-kpi-body">
              <span className="beranda-kpi-label">{VERIFICATION_STEP_LABELS[step]}</span>
              <strong className="beranda-kpi-value">
                {data.hitunganPerTahap[step].toLocaleString("id-ID")}
              </strong>
              <span
                className="beranda-chip"
                data-tone={data.tahapPengguna.includes(step) ? "hijau" : "netral"}
              >
                {data.tahapPengguna.includes(step) ? "Tahap Anda" : "Tahap aktif"}
              </span>
            </div>
          </article>
        ))}
      </div>

      <section className="modul-card" style={{ marginBottom: 18 }}>
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Cari & Filter Antrean</h2>
            <p className="modul-muted">
              Menampilkan: <strong>{labelScope}</strong>. Cari nomor, jenis surat, nama pemohon,
              atau keperluan.
            </p>
          </div>
          <Link href="/layanan-surat/persuratan/verifikasi" className="modul-muted">
            Reset filter
          </Link>
        </div>
        <form
          method="get"
          action="/layanan-surat/persuratan/verifikasi"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 700 }}>
            Kata kunci
            <input
              type="search"
              name="q"
              maxLength={100}
              defaultValue={(params.q ?? "").trim().slice(0, 100)}
              placeholder="Jenis, nama pemohon, keperluan..."
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 700 }}>
            Cakupan antrean
            <select name="scope" defaultValue={scope}>
              <option value="saya">Tahap saya saja</option>
              <option value="semua">Semua tahap</option>
              {VERIFICATION_STEPS.map((step) => (
                <option key={step} value={step}>
                  Tahap {VERIFICATION_STEP_LABELS[step]}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button button-primary" type="submit">
              Terapkan Filter
            </button>
          </div>
        </form>
      </section>

      <section className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Antrean Verifikasi</h2>
            <p className="modul-muted">{total.toLocaleString("id-ID")} surat pada cakupan ini</p>
          </div>
          {data.tahapPengguna.length === 0 ? (
            <span className="beranda-chip" data-tone="netral">
              Akses baca — tidak ada tahap verifikasi untuk role Anda
            </span>
          ) : (
            <span className="beranda-chip" data-tone="hijau">
              Anda dapat menyetujui tahap{" "}
              {data.tahapPengguna.map((s) => VERIFICATION_STEP_LABELS[s]).join(", ")}
            </span>
          )}
        </div>

        {pageRows.length === 0 ? (
          <div
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 8,
              padding: "42px 20px",
              textAlign: "center",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 28 }}>
              ✓
            </span>
            <strong>Antrean kosong</strong>
            <p className="modul-muted">
              Tidak ada surat yang menunggu pada cakupan ini. Surat baru yang diajukan operator akan
              muncul di sini.
            </p>
          </div>
        ) : (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th scope="col">Jenis Surat</th>
                  <th scope="col">Pemohon</th>
                  <th scope="col">Tanggal Surat</th>
                  <th scope="col">Tahap Aktif</th>
                  <th scope="col">Progres</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <tr key={item.surat.id}>
                    <td>
                      <strong>{item.surat.typeName}</strong>
                      {item.surat.purpose ? (
                        <span className="modul-muted">{item.surat.purpose}</span>
                      ) : null}
                    </td>
                    <td>{item.surat.residentName ?? "Tanpa penduduk terkait"}</td>
                    <td>{FORMAT_TANGGAL.format(new Date(`${item.surat.letterDate}T00:00:00`))}</td>
                    <td>
                      <span className="beranda-chip" data-tone="ungu">
                        {item.langkah ? VERIFICATION_STEP_LABELS[item.langkah] : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="modul-muted">
                        Operator {item.surat.verifikasiOperator ? "✓" : "…"} · Sekdes{" "}
                        {item.surat.verifikasiSekdes ? "✓" : "…"} · Kades{" "}
                        {item.surat.verifikasiKades ? "✓" : "…"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/layanan-surat/persuratan/surat/${item.surat.id}`}
                        style={{
                          color: "var(--color-brand)",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.bolehVerifikasi ? "Periksa & Setujui →" : "Lihat detail →"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
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
              {total.toLocaleString("id-ID")} surat
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {page > 1 ? (
                <Link className="button button-secondary" href={hrefPage(page - 1)}>
                  Sebelumnya
                </Link>
              ) : null}
              <span style={{ alignSelf: "center" }}>
                Halaman {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <Link className="button button-secondary" href={hrefPage(page + 1)}>
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
