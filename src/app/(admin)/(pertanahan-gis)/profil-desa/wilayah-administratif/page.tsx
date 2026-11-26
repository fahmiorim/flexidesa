import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { DialogHapus } from "@/components/ui/dialog-hapus";
import { getWilayahPemerintahanData } from "@/features/info-desa/pemerintahan/application/wilayah";
import {
  LABEL_TINGKAT,
  tingkatWilayah,
  wilayahTurunan,
  type WilayahDenganJumlah,
  type WilayahDTO,
} from "@/features/info-desa/wilayah/domain/wilayah";
import {
  geserUrutanWilayahAction,
  hapusWilayahAction,
} from "@/features/info-desa/wilayah/presentation/actions";
import { EditorBatas } from "@/features/info-desa/wilayah/presentation/editor-batas";
import { FormWilayah } from "@/features/info-desa/wilayah/presentation/form-wilayah";

export const metadata = { title: "Wilayah Administratif" };

const angka = (value: number) => new Intl.NumberFormat("id-ID").format(value);

type Baris = WilayahDenganJumlah;

function labelBaris(row: Pick<Baris, "dusun" | "rw" | "rt">) {
  const bagian: string[] = [];
  if (row.dusun) bagian.push(`Dusun ${row.dusun}`);
  if (row.rw) bagian.push(`RW ${row.rw}`);
  if (row.rt) bagian.push(`RT ${row.rt}`);
  return bagian.join(" · ") || "Wilayah tanpa nama";
}

function tautan(parent: Baris | null, tambahan = "") {
  if (!parent) return `/profil-desa/wilayah-administratif${tambahan}`;
  return `/profil-desa/wilayah-administratif?parent=${parent.id}${tambahan}`;
}

/** Induk langsung baris untuk ditampilkan pada form ubah. */
function indukDari(rows: Baris[], row: Baris): WilayahDTO | null {
  const tingkat = tingkatWilayah(row);
  if (tingkat === "dusun") return null;
  if (tingkat === "rw")
    return rows.find((item) => item.dusun === row.dusun && !item.rw && !item.rt) ?? null;
  return (
    rows.find((item) => item.dusun === row.dusun && item.rw === row.rw && !item.rt) ??
    rows.find((item) => item.dusun === row.dusun && !item.rw && !item.rt) ??
    null
  );
}

export default async function WilayahAdministratifPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { rows, ringkasan, tanpaWilayah } = await getWilayahPemerintahanData();

  const parentId = Number(typeof params.parent === "string" ? params.parent : "");
  const induk =
    Number.isSafeInteger(parentId) && parentId > 0
      ? (rows.find((row) => row.id === parentId) ?? null)
      : null;
  const anak = induk ? wilayahTurunan(rows, induk) : [];
  const daftar: Baris[] = induk
    ? rows.filter((row) => anak.some((item) => item.id === row.id))
    : rows.filter((row) => tingkatWilayah(row) === "dusun");

  const totalAnak = (row: Baris) => wilayahTurunan(rows, row).length;
  const tingkatInduk = induk ? tingkatWilayah(induk) : null;
  const judulTingkat = induk ? (tingkatInduk === "dusun" ? "RW / RT" : "RT") : "Dusun";

  return (
    <div className="modul-page pemerintahan-page wilayah-administratif-page">
      <PageHeading
        judul={<>Wilayah Administratif</>}
        deskripsi={<>Kelola dusun, RW, RT, dan kepala wilayah.</>}
        kelas="page-heading wilayah-page-heading"
      />

      <section className="pemerintahan-metrics wilayah-kpi">
        <article className="wilayah-kpi-kartu is-utama">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon">
              ▦
            </span>
            <span className="wilayah-kpi-label">
              {induk ? `Di bawah ${labelBaris(induk)}` : "Total Dusun"}
            </span>
          </div>
          <strong className="wilayah-kpi-nilai">{induk ? anak.length : daftar.length}</strong>
          <small className="wilayah-kpi-catatan">{judulTingkat}</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-biru">
              ⌂
            </span>
            <span className="wilayah-kpi-label">Kartu Keluarga</span>
          </div>
          <strong className="wilayah-kpi-nilai">
            {angka(induk ? induk.jumlahKk : ringkasan.jumlahKk)}
          </strong>
          <small className="wilayah-kpi-catatan">KK terdata di wilayah ini</small>
        </article>
        <article className="wilayah-kpi-kartu">
          <div className="wilayah-kpi-kepala">
            <span aria-hidden="true" className="wilayah-kpi-ikon is-hijau">
              ☺
            </span>
            <span className="wilayah-kpi-label">Penduduk Terdata</span>
          </div>
          <strong className="wilayah-kpi-nilai">
            {angka(induk ? induk.total : ringkasan.total)}
          </strong>
          <small className="wilayah-kpi-catatan">
            {angka(induk ? induk.lakiLaki : ringkasan.lakiLaki)} L ·{" "}
            {angka(induk ? induk.perempuan : ringkasan.perempuan)} P
            {!induk && tanpaWilayah.total > 0 ? (
              <>
                {" · "}
                <Link href="/kependudukan/penduduk">
                  {angka(tanpaWilayah.total)} belum terpetakan
                </Link>
              </>
            ) : null}
          </small>
        </article>
      </section>

      <section className="modul-card wilayah-table-card">
        <div className="pemerintahan-card-heading">
          <div>
            <h2>{judulTingkat}</h2>
            <p>
              {induk
                ? `Wilayah di bawah ${labelBaris(induk)}.`
                : "Daftar dusun beserta jumlah RW, RT, KK, dan penduduk."}
            </p>
          </div>
          <div className="wilayah-toolbar">
            <span className="wilayah-count-pill">{daftar.length} baris</span>
            <div className="wilayah-toolbar-grup">
              <Link
                className="wilayah-tool"
                href={`/profil-desa/wilayah-administratif/unduh/xlsx${induk ? `?parent=${induk.id}` : ""}`}
              >
                <span aria-hidden="true">⤓</span> XLSX
              </Link>
              <Link
                className="wilayah-tool"
                href={`/profil-desa/wilayah-administratif/unduh/pdf${induk ? `?parent=${induk.id}` : ""}`}
              >
                <span aria-hidden="true">⤓</span> PDF
              </Link>
              <Link
                className="wilayah-tool"
                href={`/profil-desa/wilayah-administratif/cetak${induk ? `?parent=${induk.id}` : ""}`}
              >
                <span aria-hidden="true">⧉</span> Cetak
              </Link>
            </div>
            <FormWilayah induk={induk} mode="tambah" urutAwal={daftar.length} varian="primary" />
          </div>
        </div>
        {daftar.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table">
              <thead>
                <tr>
                  <th>Wilayah</th>
                  <th>Kepala Wilayah</th>
                  <th>Turunan</th>
                  <th>KK</th>
                  <th>L</th>
                  <th>P</th>
                  <th>Total</th>
                  <th>Batas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {totalAnak(row) > 0 ? (
                        <Link href={tautan(row)}>{labelBaris(row)}</Link>
                      ) : (
                        <strong>{labelBaris(row)}</strong>
                      )}
                      <small>{LABEL_TINGKAT[tingkatWilayah(row)]}</small>
                    </td>
                    <td>
                      {row.kepala || "—"}
                      {row.kepala ? (
                        <small className="wilayah-kepala-nik">
                          {row.kepalaNik ? `NIK ${row.kepalaNik}` : "Bukan penduduk terdata"}
                        </small>
                      ) : null}
                    </td>
                    <td>{totalAnak(row)} wilayah</td>
                    <td>{angka(row.jumlahKk)}</td>
                    <td>{angka(row.lakiLaki)}</td>
                    <td>{angka(row.perempuan)}</td>
                    <td>
                      <strong>{angka(row.total)}</strong>
                    </td>
                    <td>
                      <div className="pemerintahan-row-actions">
                        <EditorBatas row={row} />
                      </div>
                    </td>
                    <td>
                      <div className="pemerintahan-row-actions">
                        <form action={geserUrutanWilayahAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="arah" value="naik" />
                          <button
                            className="button button-ghost"
                            type="submit"
                            aria-label="Naikkan urutan"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={geserUrutanWilayahAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="arah" value="turun" />
                          <button
                            className="button button-ghost"
                            type="submit"
                            aria-label="Turunkan urutan"
                          >
                            ↓
                          </button>
                        </form>
                        <FormWilayah
                          induk={indukDari(rows, row)}
                          mode="ubah"
                          row={row}
                          urutAwal={row.urut}
                          varian="ghost"
                        />
                        <DialogHapus
                          aksi={hapusWilayahAction}
                          id={String(row.id)}
                          judul={`Hapus ${labelBaris(row)}?`}
                          keterangan="Wilayah yang masih memiliki turunan, penduduk, keluarga, atau rumah tangga tidak dapat dihapus."
                          label="Hapus"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">
            {induk
              ? `Belum ada wilayah di bawah ${labelBaris(induk)}.`
              : "Belum ada dusun. Tambahkan lewat tombol di atas."}
          </p>
        )}
      </section>
    </div>
  );
}
