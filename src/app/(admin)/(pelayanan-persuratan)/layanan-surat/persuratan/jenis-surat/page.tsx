import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getMasterJenisSuratData } from "@/features/pelayanan-persuratan/surat/application/jenis-surat-use-cases";
import {
  parseIsianFields,
  parseSyaratIds,
} from "@/features/pelayanan-persuratan/surat/domain/isian";
import {
  labelMasaBerlaku,
  parseDaftarLampiran,
} from "@/features/pelayanan-persuratan/surat/domain/surat";

export const metadata: Metadata = { title: "Template & Jenis Surat" };
type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function JenisSuratPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { jenis, klasifikasi, syarat, canCreate, canUpdate } = await getMasterJenisSuratData();
  const q = (params.q ?? "").trim().toLocaleLowerCase("id");
  const filtered = jenis.filter((item) => {
    const match =
      !q ||
      item.name.toLocaleLowerCase("id").includes(q) ||
      item.code.toLocaleLowerCase("id").includes(q);
    const active =
      params.status === "aktif"
        ? item.isActive
        : params.status === "nonaktif"
          ? !item.isActive
          : true;
    return match && active;
  });
  const active = jenis.filter((item) => item.isActive).length;
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Pengaturan Surat</>}
        deskripsi={<>Kelola katalog dan template surat desa.</>}
      />
      <StatGrid columns={4}>
        <StatCard
          icon="▤"
          label="Total Jenis Surat"
          utama
          note="Katalog desa"
          value={jenis.length}
        />
        <StatCard icon="✓" label="Aktif" note="Tersedia di formulir" tone="hijau" value={active} />
        <StatCard
          icon="▧"
          label="Klasifikasi"
          note="Kategori surat"
          tone="biru"
          value={klasifikasi.length}
        />
        <StatCard
          icon="☷"
          label="Persyaratan"
          note="Dokumen pendukung"
          tone="oranye"
          value={syarat.length}
        />
      </StatGrid>
      <TableCard
        title="Katalog jenis surat"
        description={`${filtered.length} dari ${jenis.length} jenis surat ditampilkan`}
        actions={
          <>
            <ButtonLink size="sm" variant="secondary" href="/layanan-surat/persuratan/master">
              Master Klasifikasi
            </ButtonLink>
            <ButtonLink
              size="sm"
              variant="secondary"
              href="/layanan-surat/persuratan/jenis-surat/pengaturan"
            >
              Pengaturan Global
            </ButtonLink>
            {canCreate ? (
              <ButtonLink size="sm" href="/layanan-surat/persuratan/jenis-surat/baru">
                ＋ Tambah Jenis Surat
              </ButtonLink>
            ) : null}
          </>
        }
        filter={
          <form
            method="get"
            action="/layanan-surat/persuratan/jenis-surat"
            className="modul-filter-row"
          >
            <FormField
              label="Kata kunci"
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Cari kode atau nama surat..."
            />
            <FormField
              label="Status"
              kind="select"
              name="status"
              defaultValue={params.status ?? ""}
              options={[
                { value: "", label: "Semua" },
                { value: "aktif", label: "Aktif" },
                { value: "nonaktif", label: "Nonaktif" },
              ]}
            />
            <Button variant="primary" type="submit">
              Cari
            </Button>
            <ButtonLink variant="secondary" href="/layanan-surat/persuratan/jenis-surat">
              Reset
            </ButtonLink>
          </form>
        }
      >
        {filtered.length === 0 ? (
          <div className="modul-empty">
            <strong>Jenis surat belum tersedia</strong>
            <p className="modul-muted">Tambahkan jenis surat pertama atau ubah filter pencarian.</p>
            {canCreate ? (
              <ButtonLink variant="primary" href="/layanan-surat/persuratan/jenis-surat/baru">
                Tambah Jenis Surat
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>Kode</HeaderCell>
                  <HeaderCell>Nama jenis surat</HeaderCell>
                  <HeaderCell>Klasifikasi</HeaderCell>
                  <HeaderCell>Lampiran</HeaderCell>
                  <HeaderCell>Konfigurasi</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {filtered.map((item) => {
                  const fields = parseIsianFields(item.formIsian).length;
                  const requirements = parseSyaratIds(item.syaratSurat).length;
                  return (
                    <Row key={item.id}>
                      <Cell className="modul-mono">{item.code}</Cell>
                      <Cell>
                        <strong>{item.name}</strong>
                        <span className="modul-muted">
                          Masa berlaku:{" "}
                          {labelMasaBerlaku(item.validityMonths, item.satuanMasaBerlaku)}
                        </span>
                      </Cell>
                      <Cell>{item.classificationName ?? "—"}</Cell>
                      <Cell>
                        {parseDaftarLampiran(item.lampiran).length === 0
                          ? "—"
                          : parseDaftarLampiran(item.lampiran).join(", ")}
                      </Cell>
                      <Cell>
                        <span className="beranda-chip" data-tone="ungu">
                          {fields} isian dinamis
                        </span>
                        <span className="beranda-chip" data-tone="netral">
                          {requirements} persyaratan
                        </span>
                      </Cell>
                      <Cell>
                        <span
                          className="beranda-chip"
                          data-tone={item.isActive ? "hijau" : "netral"}
                        >
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </Cell>
                      <Cell>
                        {canUpdate ? (
                          <Link
                            href={`/layanan-surat/persuratan/jenis-surat/${item.id}/edit`}
                            className="table-action-link"
                          >
                            Kelola →
                          </Link>
                        ) : (
                          <span className="modul-muted">Tidak ada izin ubah</span>
                        )}
                      </Cell>
                    </Row>
                  );
                })}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </TableCard>
      <section className="modul-card">
        <div className="beranda-card-head">
          <div>
            <h2 className="beranda-card-title">Komponen master</h2>
            <p className="modul-muted">
              Persyaratan dan klasifikasi dipakai bersama oleh beberapa jenis surat.
            </p>
          </div>
        </div>
        <div className="modul-form-grid">
          <div>
            <strong>Klasifikasi surat</strong>
            <p className="modul-muted">{klasifikasi.length} klasifikasi terdaftar</p>
            {klasifikasi.slice(0, 5).map((item) => (
              <p key={item.id}>
                <span className="modul-mono">{item.code}</span> · {item.name}
              </p>
            ))}
          </div>
          <div>
            <strong>Persyaratan dokumen</strong>
            <p className="modul-muted">{syarat.length} persyaratan terdaftar</p>
            {syarat.slice(0, 5).map((item) => (
              <p key={item.id}>{item.name}</p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
