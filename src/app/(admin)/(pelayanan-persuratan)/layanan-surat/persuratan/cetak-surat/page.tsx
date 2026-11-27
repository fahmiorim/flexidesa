import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { getCetakSuratData } from "@/features/pelayanan-persuratan/surat/application/cetak-surat-use-cases";
import { cariCetakSurat } from "@/features/pelayanan-persuratan/surat/domain/cetak-surat";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Cetak Surat" };

type SearchParams = Promise<{ q?: string }>;

export default async function CetakSuratPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, user, data] = await Promise.all([
    searchParams,
    verifySession(),
    getCetakSuratData(),
  ]);
  const kataKunci = (params.q ?? "").trim().slice(0, 100);
  const rows = cariCetakSurat(data.rows, kataKunci);
  const bolehBuat = hasPermission(user.permissions, "cetak-surat", "update");

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Cetak Surat</>}
        deskripsi={<>Pilih jenis surat, isi datanya, lalu cetak PDF.</>}
      />

      <TableCard
        title="Katalog Surat"
        description={`${data.jumlahJenis.toLocaleString("id-ID")} jenis surat aktif · ${data.jumlahSurat.toLocaleString("id-ID")} surat pernah dibuat · ${rows.length} ditampilkan`}
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              label="Nama, kode, klasifikasi, atau lampiran surat"
              name="q"
              type="search"
              defaultValue={kataKunci}
              maxLength={100}
              placeholder="Contoh: keterangan usaha"
            />
            <Button variant="primary" type="submit">
              Cari
            </Button>
            {kataKunci ? (
              <ButtonLink variant="secondary" href="/layanan-surat/persuratan/cetak-surat">
                Atur Ulang
              </ButtonLink>
            ) : null}
          </form>
        }
      >
        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada jenis surat aktif.</strong>
            <p>
              Tambahkan atau aktifkan jenis surat pada halaman{" "}
              <Link href="/layanan-surat/persuratan/jenis-surat">Template &amp; Jenis Surat</Link>{" "}
              agar dapat dicetak di sini.
            </p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell scope="col">No.</HeaderCell>
                  <HeaderCell scope="col">Nama Surat</HeaderCell>
                  <HeaderCell scope="col">Kode / Klasifikasi</HeaderCell>
                  <HeaderCell scope="col">Persyaratan</HeaderCell>
                  <HeaderCell scope="col">Lampiran</HeaderCell>
                  <HeaderCell scope="col">Tercetak</HeaderCell>
                  <HeaderCell scope="col">Aksi</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>{row.name}</Cell>
                    <Cell>
                      {row.code}
                      {row.classificationName ? (
                        <>
                          <br />
                          <small>{row.classificationName}</small>
                        </>
                      ) : null}
                    </Cell>
                    <Cell>{row.jumlahSyarat === 0 ? "-" : `${row.jumlahSyarat} dokumen`}</Cell>
                    <Cell>
                      {row.lampiran.length === 0 ? (
                        "-"
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                          {row.lampiran.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </Cell>
                    <Cell>{row.tercetak.toLocaleString("id-ID")}</Cell>
                    <Cell>
                      {bolehBuat ? (
                        <ButtonLink
                          variant="primary"
                          href={`/layanan-surat/persuratan/surat/baru?jenis=${row.id}`}
                        >
                          Buat Surat
                        </ButtonLink>
                      ) : (
                        <span className="form-help">Hanya dapat dilihat</span>
                      )}
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </TableCard>
    </div>
  );
}
