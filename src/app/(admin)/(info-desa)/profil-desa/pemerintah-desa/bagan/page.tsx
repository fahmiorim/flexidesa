import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Card } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/form-dialog";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { getPerangkatDesaData } from "@/features/info-desa/pemerintahan/application/perangkat";
import { susunBagan, type BaganNode } from "@/features/info-desa/pemerintahan/domain/aparat-desa";
import { simpanBaganFormAction } from "@/features/info-desa/pemerintahan/presentation/form-actions";

export const metadata = { title: "Bagan Organisasi Pemerintah Desa" };

const LABEL_LAYOUT: Record<string, string> = {
  hanging: "Menggantung",
  normal: "Normal",
};

const inisialNama = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? "")
    .join("");

function SimpulBagan({ node }: { node: BaganNode }) {
  return (
    <li className="pemerintahan-org-node">
      <div
        className="pemerintahan-org-card"
        style={node.warna ? { background: node.warna } : undefined}
      >
        <span aria-hidden="true" className="pemerintahan-org-avatar">
          {inisialNama(node.nama)}
        </span>
        <div className="pemerintahan-org-teks">
          <strong>{node.nama}</strong>
          <span>{node.jabatan ?? "Perangkat Desa"}</span>
          {node.statusPejabat ? <small>Pj Kepala Desa</small> : null}
        </div>
      </div>
      {node.anak.length ? (
        <ul>
          {node.anak.map((anak) => (
            <SimpulBagan key={anak.id} node={anak} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function BaganOrganisasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const denganBpd = params.bpd === "1";
  const { rows, akses } = await getPerangkatDesaData();
  const aktif = rows.filter((row) => row.status === "aktif");
  const namaAparat = new Map(rows.map((row) => [row.id, row.nama]));
  const pohon = susunBagan(
    aktif.map((row) => ({
      id: row.id,
      nama: row.nama,
      jabatan: row.jabatan,
      jenis: row.jenisJabatan ?? "lainnya",
      statusPejabat: row.statusPejabat,
      tingkat: row.baganTingkat,
      offset: row.baganOffset,
      layout: row.baganLayout,
      warna: row.baganWarna,
      atasanId: row.atasanId,
      urut: row.urut,
    })),
    { denganBpd },
  );

  const isiBagan = (row: (typeof rows)[number]) => (
    <>
      <input name="id" type="hidden" value={row.id} />
      <label>
        Atasan Langsung
        <select defaultValue={row.atasanId ?? ""} name="atasanId">
          <option value="">Tidak ada (akar bagan)</option>
          {rows
            .filter((lain) => lain.id !== row.id)
            .map((lain) => (
              <option key={lain.id} value={lain.id}>
                {lain.nama} — {lain.jabatan ?? "Perangkat"}
                {lain.status === "aktif" ? "" : " (nonaktif)"}
              </option>
            ))}
        </select>
      </label>
      <label>
        Tingkat
        <input defaultValue={row.baganTingkat ?? ""} min="0" name="baganTingkat" type="number" />
      </label>
      <label>
        Geser
        <input
          defaultValue={row.baganOffset ?? ""}
          maxLength={10}
          name="baganOffset"
          placeholder="-75%"
        />
      </label>
      <label>
        Tata Letak
        <select defaultValue={row.baganLayout ?? ""} name="baganLayout">
          <option value="">Bawaan</option>
          <option value="hanging">Menggantung</option>
          <option value="normal">Normal</option>
        </select>
      </label>
      <label>
        Warna
        <input
          defaultValue={row.baganWarna ?? ""}
          maxLength={7}
          name="baganWarna"
          placeholder="#FFFFFF"
        />
      </label>
    </>
  );

  return (
    <div className="modul-page pemerintahan-page bagan-page">
      <PageHeading
        judul={<>Bagan Organisasi</>}
        deskripsi={<>Susunan bagan mengikuti atasan langsung masing-masing aparat aktif.</>}
      />
      <Card variant="panel">
        <div className="pemerintahan-card-heading">
          <div>
            <h2>Struktur Organisasi {denganBpd ? "dengan BPD" : "tanpa BPD"}</h2>
            <p>Geser dan warna simpul diatur per aparat pada tabel di bawah.</p>
          </div>
          <div className="wilayah-toolbar">
            <div className="wilayah-toolbar-grup">
              <Link className="wilayah-tool" href="/profil-desa/pemerintah-desa">
                <span aria-hidden="true">←</span> Kembali
              </Link>
              <Link
                className="wilayah-tool"
                href={
                  denganBpd
                    ? "/profil-desa/pemerintah-desa/bagan"
                    : "/profil-desa/pemerintah-desa/bagan?bpd=1"
                }
              >
                <span aria-hidden="true">▤</span>
                {denganBpd ? "Tanpa BPD" : "Dengan BPD"}
              </Link>
              <Link className="wilayah-tool" href="/profil-desa/pemerintah-desa/cetak">
                <span aria-hidden="true">⧉</span> Cetak
              </Link>
            </div>
          </div>
        </div>
        {pohon.length ? (
          <div className="bagan-chart">
            <ul className="pemerintahan-org">
              {pohon.map((node) => (
                <SimpulBagan key={node.id} node={node} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="modul-empty">
            Bagan belum tersedia. Aktifkan minimal satu aparat pemerintah desa.
          </p>
        )}
      </Card>
      <Card variant="panel">
        <div className="pemerintahan-card-heading">
          <div>
            <h2>Atur Bagan</h2>
            <p>Tentukan atasan, tingkat, tata letak, dan warna simpul.</p>
          </div>
        </div>
        {rows.length ? (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell>Aparat</HeaderCell>
                  <HeaderCell>Susunan Bagan</HeaderCell>
                  {akses.ubah ? <HeaderCell>Aksi</HeaderCell> : null}
                </Row>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Row key={row.id}>
                    <Cell>
                      <strong>{row.nama}</strong>
                      <small>{row.jabatan ?? "Belum ditentukan"}</small>
                    </Cell>
                    <Cell>
                      {row.atasanId
                        ? `Atasan: ${namaAparat.get(row.atasanId) ?? "Tidak ditemukan"}`
                        : "Akar bagan"}
                      <small>
                        Tingkat {row.baganTingkat ?? "bawaan"} · Geser {row.baganOffset ?? "0%"} ·
                        Tata letak {LABEL_LAYOUT[row.baganLayout ?? ""] ?? "Bawaan"}
                        {row.baganWarna ? ` · Warna ${row.baganWarna}` : ""}
                      </small>
                    </Cell>
                    {akses.ubah ? (
                      <Cell>
                        <FormDialog
                          aksi={simpanBaganFormAction}
                          deskripsi={`Atur posisi ${row.nama} pada bagan organisasi.`}
                          judul={`Atur Bagan — ${row.nama}`}
                          key={`bagan-${row.id}`}
                          label="Atur"
                          labelSimpan="Simpan"
                          varian="ghost"
                        >
                          {isiBagan(row)}
                        </FormDialog>
                      </Cell>
                    ) : null}
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        ) : (
          <p className="modul-empty">Belum ada aparat untuk diatur pada bagan.</p>
        )}
      </Card>
    </div>
  );
}
