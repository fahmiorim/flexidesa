import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { getStatistikBantuanUseCase } from "@/features/kependudukan/statistik/application/statistik-use-cases";
import {
  STATISTIK_BANTUAN_KINDS,
  STATISTIK_BANTUAN_LABELS,
  type StatistikBantuanKind,
} from "@/features/kependudukan/statistik/domain/statistik";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

export const metadata: Metadata = { title: "Statistik Program Desa" };

const PER_HALAMAN = 20;

type Params = Record<string, string | string[] | undefined>;

function teks(params: Params, kunci: string) {
  const nilai = params[kunci];
  return (typeof nilai === "string" ? nilai : "").trim();
}

export default async function StatistikProgramPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const user = await requirePermission(RESOURCES.bantuan, "read");
  const villageId = await resolveVillageId(user);

  const diminta = teks(params, "kind");
  const kind: StatistikBantuanKind = (STATISTIK_BANTUAN_KINDS as readonly string[]).includes(
    diminta,
  )
    ? (diminta as StatistikBantuanKind)
    : "program";
  const dusun = teks(params, "dusun");
  const rw = teks(params, "rw");
  const rt = teks(params, "rt");
  const periodeMulai = teks(params, "periodeMulai");
  const periodeAkhir = teks(params, "periodeAkhir");
  const page = Math.max(1, Number(teks(params, "page")) || 1);

  const data = await getStatistikBantuanUseCase(villageId, {
    kind,
    dusun: dusun || undefined,
    rw: rw || undefined,
    rt: rt || undefined,
    periodeMulai: periodeMulai || undefined,
    periodeAkhir: periodeAkhir || undefined,
    page,
    perPage: PER_HALAMAN,
  });

  const filter = new URLSearchParams({ kind });
  for (const [kunci, nilai] of Object.entries({ dusun, rw, rt, periodeMulai, periodeAkhir })) {
    if (nilai) filter.set(kunci, nilai);
  }
  const queryEkspor = filter.toString();
  const halaman = (target: number) => {
    const q = new URLSearchParams(filter);
    q.set("page", String(target));
    return `/satu-data/statistik-program?${q.toString()}`;
  };

  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Statistik Program Desa</>}
        deskripsi={<>Jumlah penerima bantuan per {STATISTIK_BANTUAN_LABELS[kind].toLowerCase()}.</>}
        aksi={
          <>
            <ButtonLink variant="secondary" href={`/statistik/bantuan/ekspor?${queryEkspor}`}>
              Unduh CSV
            </ButtonLink>
            <ButtonLink variant="secondary" href={`/statistik/bantuan/ekspor/pdf?${queryEkspor}`}>
              Unduh PDF
            </ButtonLink>
          </>
        }
      />

      <section className="dashboard-stats" aria-label="Ringkasan penerima bantuan">
        <article className="modul-card">
          <span>Total penerima</span>
          <strong>{data.summary.total.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Laki-laki</span>
          <strong>{data.summary.male.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Perempuan</span>
          <strong>{data.summary.female.toLocaleString("id-ID")}</strong>
        </article>
        <article className="modul-card">
          <span>Baris data</span>
          <strong>{data.rows.length.toLocaleString("id-ID")}</strong>
        </article>
      </section>

      <TableCard
        filter={
          <form className="modul-filter-row" method="get">
            <FormField
              defaultValue={kind}
              kind="select"
              label="Kelompok data"
              name="kind"
              options={STATISTIK_BANTUAN_KINDS.map((nilai) => ({
                value: nilai,
                label: STATISTIK_BANTUAN_LABELS[nilai],
              }))}
            />
            <FormField defaultValue={dusun} label="Dusun" name="dusun" placeholder="Semua dusun" />
            <FormField defaultValue={rw} label="RW" name="rw" placeholder="Semua RW" />
            <FormField defaultValue={rt} label="RT" name="rt" placeholder="Semua RT" />
            <FormField
              defaultValue={periodeMulai}
              label="Periode mulai"
              name="periodeMulai"
              type="date"
            />
            <FormField
              defaultValue={periodeAkhir}
              label="Periode akhir"
              name="periodeAkhir"
              type="date"
            />
            <Button type="submit">Terapkan</Button>
            <ButtonLink variant="secondary" href="/satu-data/statistik-program">
              Bersihkan
            </ButtonLink>
          </form>
        }
        title={`Rekap ${STATISTIK_BANTUAN_LABELS[kind]}`}
        description={`${data.summary.total.toLocaleString("id-ID")} penerima tercatat pada ${data.rows.length.toLocaleString("id-ID")} baris data.`}
        footer={
          data.pageCount > 1 ? (
            <div className="table-pagination">
              <span>
                Halaman {data.page} dari {data.pageCount}
              </span>
              <div className="page-actions">
                <ButtonLink
                  aria-disabled={data.page <= 1}
                  variant="secondary"
                  href={halaman(Math.max(1, data.page - 1))}
                >
                  Sebelumnya
                </ButtonLink>
                <ButtonLink
                  aria-disabled={data.page >= data.pageCount}
                  variant="secondary"
                  href={halaman(Math.min(data.pageCount, data.page + 1))}
                >
                  Berikutnya
                </ButtonLink>
              </div>
            </div>
          ) : undefined
        }
      >
        {data.rows.length ? (
          <TableScroll className="modul-scroll">
            <Table className="modul-table">
              <THead>
                <Row>
                  <HeaderCell>{STATISTIK_BANTUAN_LABELS[kind]}</HeaderCell>
                  <HeaderCell>Total</HeaderCell>
                  <HeaderCell>Laki-laki</HeaderCell>
                  <HeaderCell>Perempuan</HeaderCell>
                  <HeaderCell>Persentase</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {data.rows.map((row) => (
                  <Row key={row.label}>
                    <Cell>
                      <strong>{row.label}</strong>
                    </Cell>
                    <Cell>{row.total.toLocaleString("id-ID")}</Cell>
                    <Cell>{row.male.toLocaleString("id-ID")}</Cell>
                    <Cell>{row.female.toLocaleString("id-ID")}</Cell>
                    <Cell>{row.percentage}%</Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">
            Belum ada data penerima bantuan pada filter ini. Ubah filter atau catat peserta pada
            menu Bantuan Sosial.
          </p>
        )}
      </TableCard>
    </div>
  );
}
