import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { listRentangUmurUseCase } from "@/features/kependudukan/statistik/application/rentang-umur-use-cases";
import { BATAS_UMUR_MAKSIMAL } from "@/features/kependudukan/statistik/domain/rentang-umur";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { verifySession } from "@/lib/dal";

import { hapusRentangUmurAction, simpanRentangUmurAction } from "./actions";

export const metadata: Metadata = { title: "Pengaturan Rentang Umur" };

function teks(params: Record<string, string | string[] | undefined>, kunci: string) {
  const nilai = params[kunci];
  return typeof nilai === "string" ? nilai : "";
}

export default async function PengaturanRentangUmurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, verifySession()]);
  const villageId = await resolveVillageId(user);
  const rows = await listRentangUmurUseCase({ villageId });
  const bolehUbah = hasPermission(user.permissions, RESOURCES.penduduk, "update");
  const bolehHapus = hasPermission(user.permissions, RESOURCES.penduduk, "delete");

  const maksSampai = rows.reduce(
    (maks, row) => (row.sampai === null ? maks : Math.max(maks, row.sampai)),
    -1,
  );
  const saranDari = rows.length === 0 ? 0 : maksSampai + 1;
  const pesan = teks(params, "pesan");
  const galat = teks(params, "galat");
  const kembali = "/kependudukan/statistik?kategori=rentang-umur";

  return (
    <div className="modul-page data-kependudukan-page">
      <PageHeading
        judul={<>Pengaturan Rentang Umur</>}
        deskripsi={<>Kelompok umur untuk laporan statistik desa.</>}
        aksi={
          <>
            <div className="penduduk-heading-actions">
              <ButtonLink variant="secondary" href={kembali}>
                Kembali ke Statistik
              </ButtonLink>
              <ButtonLink variant="primary" href="/statistik/rentang-umur/ekspor">
                Unduh CSV
              </ButtonLink>
            </div>
          </>
        }
      />

      {pesan ? (
        <p className="form-help" role="status">
          {pesan}
        </p>
      ) : null}
      {galat ? (
        <p className="dpt-form-error" role="alert">
          {galat}
        </p>
      ) : null}

      <section className="platform-card data-panel">
        <header>
          <h2>Rentang Umur Desa</h2>
          <p>
            {rows.length === 0
              ? "Belum ada rentang khusus. Statistik memakai kelompok Data Pilah bawaan."
              : `${rows.length} rentang aktif dipakai laporan desa. Rentang tidak boleh bertumpang tindih.`}
          </p>
        </header>

        {bolehUbah ? (
          <form action={simpanRentangUmurAction} className="data-custom-filter">
            <input name="id" type="hidden" value="" />
            <label className="form-field">
              <span className="form-label">Dari umur</span>
              <input
                className="form-input"
                defaultValue={saranDari}
                max={BATAS_UMUR_MAKSIMAL}
                min={0}
                name="dari"
                required
                type="number"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Sampai umur (opsional)</span>
              <input
                className="form-input"
                max={BATAS_UMUR_MAKSIMAL}
                min={0}
                name="sampai"
                placeholder={`Kosong = di atas ${saranDari} tahun`}
                type="number"
              />
            </label>
            <div className="data-custom-actions">
              <Button variant="primary" type="submit">
                Tambah Rentang
              </Button>
            </div>
          </form>
        ) : (
          <p className="form-help">Anda hanya memiliki akses baca untuk pengaturan ini.</p>
        )}
      </section>

      <section className="platform-card data-panel">
        <header>
          <h2>Daftar Rentang</h2>
          <p>Urutan mengikuti batas bawah. Nama rentang dibentuk otomatis dari batasnya.</p>
        </header>

        {rows.length === 0 ? (
          <div className="modul-empty">
            <strong>Belum ada rentang umur khusus.</strong>
            <p>
              Saat daftar kosong, laporan memakai kelompok Data Pilah bawaan sampai rentang pertama
              ditambahkan.
            </p>
          </div>
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <Row>
                  <HeaderCell>No.</HeaderCell>
                  <HeaderCell>Rentang</HeaderCell>
                  <HeaderCell>Dari</HeaderCell>
                  <HeaderCell>Sampai</HeaderCell>
                  {bolehUbah || bolehHapus ? <HeaderCell>Aksi</HeaderCell> : null}
                </Row>
              </THead>
              <TBody>
                {rows.map((row, index) => (
                  <Row key={row.id}>
                    <Cell>{index + 1}</Cell>
                    <Cell>
                      <strong>{row.nama}</strong>
                    </Cell>
                    <Cell>{row.dari}</Cell>
                    <Cell>{row.sampai === null ? "Tanpa batas" : row.sampai}</Cell>
                    {bolehUbah || bolehHapus ? (
                      <Cell>
                        <div className="pemerintahan-row-actions">
                          {bolehUbah ? (
                            <details className="pemerintahan-row-edit">
                              <summary>Ubah</summary>
                              <form action={simpanRentangUmurAction} className="wilayah-form">
                                <input name="id" type="hidden" value={row.id} />
                                <label className="form-field">
                                  <span className="form-label">Dari</span>
                                  <input
                                    className="form-input"
                                    defaultValue={row.dari}
                                    max={BATAS_UMUR_MAKSIMAL}
                                    min={0}
                                    name="dari"
                                    required
                                    type="number"
                                  />
                                </label>
                                <label className="form-field">
                                  <span className="form-label">Sampai</span>
                                  <input
                                    className="form-input"
                                    defaultValue={row.sampai ?? ""}
                                    max={BATAS_UMUR_MAKSIMAL}
                                    min={0}
                                    name="sampai"
                                    placeholder="Kosong = tanpa batas"
                                    type="number"
                                  />
                                </label>
                                <Button variant="primary" type="submit">
                                  Simpan
                                </Button>
                              </form>
                            </details>
                          ) : null}

                          {bolehHapus ? (
                            <DialogHapusForm
                              aksi={hapusRentangUmurAction}
                              id={row.id}
                              judul={`Hapus rentang ${row.nama}?`}
                              keterangan="Kategori rentang umur akan dihapus permanen dari statistik kependudukan."
                              labelAksi="Hapus rentang"
                            />
                          ) : null}
                        </div>
                      </Cell>
                    ) : null}
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </section>

      <p className="form-help">
        Batas atas inklusif; kosongkan “Sampai” untuk rentang terbuka. Maksimal{" "}
        {BATAS_UMUR_MAKSIMAL} tahun.
      </p>
    </div>
  );
}
