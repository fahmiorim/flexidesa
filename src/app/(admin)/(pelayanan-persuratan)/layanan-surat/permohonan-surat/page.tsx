import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormField } from "@/components/ui/form-field";
import { HapusTerpilih } from "@/components/ui/hapus-terpilih";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getPermohonanAdminData } from "@/features/pelayanan-persuratan/layanan-mandiri/application/admin-use-cases";
import {
  labelPermohonanStatus,
  PERMOHONAN_STATUS_LABELS,
} from "@/features/pelayanan-persuratan/layanan-mandiri/domain/layanan-mandiri";

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
    ? `/layanan-surat/permohonan-surat/ekspor?${query.toString()}`
    : "/layanan-surat/permohonan-surat/ekspor";

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Permohonan Surat</>}
        deskripsi={<>Proses permohonan surat dari warga.</>}
      />

      <StatGrid columns={4}>
        <StatCard
          icon="▤"
          label="Total Permohonan"
          utama
          note="Sesuai filter"
          value={total.toLocaleString("id-ID")}
        />
        <StatCard
          icon="◷"
          label="Dalam Proses"
          note="Belum selesai"
          tone="biru"
          value={menunggu.toLocaleString("id-ID")}
        />
        <StatCard
          icon="✓"
          label="Selesai"
          note="Siap / sudah diambil"
          tone="hijau"
          value={selesai.toLocaleString("id-ID")}
        />
        <StatCard
          icon="×"
          label="Dibatalkan"
          note="Permohonan batal"
          tone="oranye"
          value={dibatalkan.toLocaleString("id-ID")}
        />
      </StatGrid>

      {params.berhasil === "dihapus" ? (
        <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
          {params.jumlah && /^\d+$/.test(params.jumlah)
            ? `${params.jumlah} permohonan yang dibatalkan berhasil dihapus.`
            : "Permohonan yang dibatalkan berhasil dihapus."}
        </div>
      ) : null}

      <TableCard
        title="Daftar Permohonan"
        description={`${total.toLocaleString("id-ID")} permohonan ditemukan`}
        actions={
          <>
            <ButtonLink href={exportHref} size="sm" variant="secondary">
              Ekspor CSV
            </ButtonLink>
            {canManage ? (
              <span className="beranda-chip" data-tone="hijau">
                Akses pengelolaan aktif
              </span>
            ) : (
              <span className="beranda-chip" data-tone="netral">
                Akses baca saja
              </span>
            )}
          </>
        }
        filter={
          <form method="get" action="/layanan-surat/permohonan-surat" className="modul-filter-row">
            <FormField label="Dari tanggal" name="dari" type="date" defaultValue={filter.dari} />
            <FormField
              label="Sampai tanggal"
              name="sampai"
              type="date"
              min={filter.dari}
              defaultValue={filter.sampai}
            />
            <FormField
              label="Jenis surat"
              kind="select"
              name="jenis"
              defaultValue={filter.typeId?.toString() ?? ""}
              options={[
                { value: "", label: "Semua jenis surat" },
                ...jenis.map((item) => ({ value: String(item.id), label: item.nama })),
              ]}
            />
            <FormField
              label="Status"
              kind="select"
              name="status"
              defaultValue={
                Array.isArray(filter.status)
                  ? filter.status.join(",")
                  : (filter.status?.toString() ?? "")
              }
              options={[
                { value: "", label: "Semua status" },
                { value: "1,2", label: "Menunggu tindakan (diperiksa + TTE)" },
                ...Object.entries(PERMOHONAN_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
            <FormField
              label="Cari nama, NIK, nomor antrean, nomor HP, atau jenis surat"
              name="q"
              type="search"
              maxLength={100}
              defaultValue={kataKunci}
              placeholder="Contoh: Budi atau 3201010101010001"
              containerClassName="form-field-full"
            />
            <Button type="submit">Terapkan Filter</Button>
          </form>
        }
      >
        {canDelete ? (
          <div className="table-actions" style={{ justifyContent: "flex-end", marginBottom: 10 }}>
            <HapusTerpilih
              aksi={hapusPermohonanMassalAction}
              judul="Hapus permohonan terpilih?"
              label="Hapus terpilih"
            />
          </div>
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
            <Link href="/layanan-surat/permohonan-surat">Tampilkan semua permohonan</Link>
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  {canDelete ? <HeaderCell scope="col">Pilih</HeaderCell> : null}
                  <HeaderCell scope="col">No. Antrian</HeaderCell>
                  <HeaderCell scope="col">Pemohon</HeaderCell>
                  <HeaderCell scope="col">No. HP Aktif</HeaderCell>
                  <HeaderCell scope="col">Jenis Surat</HeaderCell>
                  <HeaderCell scope="col">Keterangan</HeaderCell>
                  <HeaderCell scope="col">Tanggal Masuk</HeaderCell>
                  <HeaderCell scope="col">Status</HeaderCell>
                  <HeaderCell scope="col">Nomor Surat</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {pageRows.map((row) => (
                  <Row key={row.id}>
                    {canDelete ? (
                      <Cell>
                        {row.status === 5 ? (
                          <input
                            aria-label={`Pilih permohonan ${row.noAntrian ?? `#${row.id}`}`}
                            name="idCb"
                            type="checkbox"
                            value={row.id}
                          />
                        ) : null}
                      </Cell>
                    ) : null}
                    <Cell className="modul-mono">{row.noAntrian ?? `#${row.id}`}</Cell>
                    <Cell>
                      <strong>{row.namaPemohon ?? "Data pemohon tidak tersedia"}</strong>
                      <span className="modul-muted">{row.nikPemohon ?? "NIK tidak tersedia"}</span>
                    </Cell>
                    <Cell>{row.noHpAktif ?? "—"}</Cell>
                    <Cell>
                      <strong>{row.namaSurat ?? "Jenis surat tidak tersedia"}</strong>
                    </Cell>
                    <Cell style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>
                      {row.keterangan?.trim() ? row.keterangan : "—"}
                    </Cell>
                    <Cell>{tanggal(row.createdAt)}</Cell>
                    <Cell>
                      <span className="beranda-chip" data-tone={toneStatus(row.status)}>
                        {labelPermohonanStatus(row.status)}
                      </span>
                    </Cell>
                    <Cell className="modul-mono">{row.letterNumber ?? "—"}</Cell>
                    <Cell>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Link
                          href={`/layanan-surat/permohonan-surat/${row.id}`}
                          style={{
                            color: "var(--color-brand)",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Lihat detail →
                        </Link>
                        {row.status === 5 && canDelete ? (
                          <DialogHapusForm
                            aksi={hapusPermohonanAction}
                            id={row.id}
                            judul={`Hapus permohonan ${row.noAntrian ?? `#${row.id}`}?`}
                            keterangan="Permohonan yang dibatalkan ini dihapus permanen bersama berkas persyaratannya."
                            labelAksi="Hapus permohonan"
                          />
                        ) : null}
                      </div>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
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
                <ButtonLink
                  variant="secondary"
                  href={`/layanan-surat/permohonan-surat?${query.toString()}${query.size ? "&" : ""}page=${page - 1}`}
                >
                  Sebelumnya
                </ButtonLink>
              ) : null}
              <span style={{ alignSelf: "center" }}>
                Halaman {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <ButtonLink
                  variant="secondary"
                  href={`/layanan-surat/permohonan-surat?${query.toString()}${query.size ? "&" : ""}page=${page + 1}`}
                >
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
