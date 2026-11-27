import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
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
      />

      <StatGrid columns={4}>
        <StatCard
          icon="◷"
          label="Total Antrean"
          utama
          note="Menunggu persetujuan"
          value={data.totalAntrean.toLocaleString("id-ID")}
        />
        {VERIFICATION_STEPS.map((step) => (
          <StatCard
            key={step}
            icon={step === "operator" ? "▣" : step === "sekdes" ? "✎" : "✓"}
            label={VERIFICATION_STEP_LABELS[step]}
            note={data.tahapPengguna.includes(step) ? "Tahap Anda" : "Tahap aktif"}
            tone={data.tahapPengguna.includes(step) ? "hijau" : "biru"}
            value={data.hitunganPerTahap[step].toLocaleString("id-ID")}
          />
        ))}
      </StatGrid>

      <TableCard
        title="Antrean Verifikasi"
        description={`${total.toLocaleString("id-ID")} surat · ${labelScope}`}
        actions={
          data.tahapPengguna.length === 0 ? (
            <span className="beranda-chip" data-tone="netral">
              Akses baca — tidak ada tahap verifikasi untuk role Anda
            </span>
          ) : (
            <span className="beranda-chip" data-tone="hijau">
              Anda dapat menyetujui tahap{" "}
              {data.tahapPengguna.map((s) => VERIFICATION_STEP_LABELS[s]).join(", ")}
            </span>
          )
        }
        filter={
          <form
            method="get"
            action="/layanan-surat/persuratan/verifikasi"
            className="modul-filter-row"
          >
            <FormField
              label="Kata kunci"
              name="q"
              type="search"
              maxLength={100}
              defaultValue={(params.q ?? "").trim().slice(0, 100)}
              placeholder="Jenis, nama pemohon, keperluan..."
            />
            <FormField
              label="Cakupan antrean"
              kind="select"
              name="scope"
              defaultValue={scope}
              options={[
                { value: "saya", label: "Tahap saya saja" },
                { value: "semua", label: "Semua tahap" },
                ...VERIFICATION_STEPS.map((step) => ({
                  value: step,
                  label: `Tahap ${VERIFICATION_STEP_LABELS[step]}`,
                })),
              ]}
            />
            <Button type="submit">Terapkan Filter</Button>
          </form>
        }
      >
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
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell scope="col">Jenis Surat</HeaderCell>
                  <HeaderCell scope="col">Pemohon</HeaderCell>
                  <HeaderCell scope="col">Tanggal Surat</HeaderCell>
                  <HeaderCell scope="col">Tahap Aktif</HeaderCell>
                  <HeaderCell scope="col">Progres</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {pageRows.map((item) => (
                  <Row key={item.surat.id}>
                    <Cell>
                      <strong>{item.surat.typeName}</strong>
                      {item.surat.purpose ? (
                        <span className="modul-muted">{item.surat.purpose}</span>
                      ) : null}
                    </Cell>
                    <Cell>{item.surat.residentName ?? "Tanpa penduduk terkait"}</Cell>
                    <Cell>
                      {FORMAT_TANGGAL.format(new Date(`${item.surat.letterDate}T00:00:00`))}
                    </Cell>
                    <Cell>
                      <span className="beranda-chip" data-tone="ungu">
                        {item.langkah ? VERIFICATION_STEP_LABELS[item.langkah] : "—"}
                      </span>
                    </Cell>
                    <Cell>
                      <span className="modul-muted">
                        Operator {item.surat.verifikasiOperator ? "✓" : "…"} · Sekdes{" "}
                        {item.surat.verifikasiSekdes ? "✓" : "…"} · Kades{" "}
                        {item.surat.verifikasiKades ? "✓" : "…"}
                      </span>
                    </Cell>
                    <Cell>
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
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
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
                <ButtonLink variant="secondary" href={hrefPage(page - 1)}>
                  Sebelumnya
                </ButtonLink>
              ) : null}
              <span style={{ alignSelf: "center" }}>
                Halaman {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <ButtonLink variant="secondary" href={hrefPage(page + 1)}>
                  Berikutnya
                </ButtonLink>
              ) : null}
            </div>
          </div>
        ) : null}
      </TableCard>
    </div>
  );
}
