import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { tambahTerdataAction } from "@/app/(admin)/(kependudukan)/kependudukan/penduduk/suplemen/actions";
import { PageHeading } from "@/components/shell/page-heading";
import {
  cariSasaranSuplemenData,
  getFormTerdataData,
  getReferensiIsianSuplemenData,
  labelSasaranSuplemen,
} from "@/features/kependudukan/penduduk/application/suplemen-use-cases";
import { SUPLEMEN_RESOURCE } from "@/features/kependudukan/penduduk/domain/suplemen";
import { FormTerdataSuplemen } from "@/features/kependudukan/penduduk/presentation/form-terdata-suplemen";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Tambah Data Terdata Suplemen" };

function teks(nilai: string | string[] | undefined): string {
  return (Array.isArray(nilai) ? nilai[0] : nilai)?.trim() ?? "";
}

export default async function TambahTerdataPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: mentah } = await params;
  const id = Number(mentah);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const query = await searchParams;
  const aksi = teks(query.aksi) === "2" ? 2 : 1;
  const sasaranId = Number(teks(query.sasaranId));
  const cari = teks(query.q).slice(0, 100);
  const dipilih = Number.isSafeInteger(sasaranId) && sasaranId > 0 ? sasaranId : null;

  const [user, referensi] = await Promise.all([verifySession(), getReferensiIsianSuplemenData()]);
  if (!hasPermission(user.permissions, SUPLEMEN_RESOURCE, "update")) notFound();

  const data = await getFormTerdataData(id, dipilih ? { sasaranId: dipilih } : {});
  if (!data) notFound();

  const { suplemen } = data;
  const sasaranPenduduk = suplemen.sasaran !== 2;
  const rincianHref = `/kependudukan/penduduk/suplemen/${id}`;
  const dasarHref = `/kependudukan/penduduk/suplemen/${id}/terdata/baru?aksi=${aksi}`;

  const kandidat = dipilih ? [] : await cariSasaranSuplemenData(id, cari);

  return (
    <div className="modul-page penduduk-page data-kependudukan-page suplemen-page">
      <PageHeading
        judul={<>Tambah Data Terdata</>}
        deskripsi={
          <>
            {suplemen.nama} · sasaran {labelSasaranSuplemen(suplemen.sasaran)}
          </>
        }
      />

      <p className="suplemen-kembali">
        <Link href={dasarHref}>
          ← {aksi === 2 ? "Tambah beberapa data warga" : "Daftar Terdata"}
        </Link>
      </p>

      {!dipilih ? (
        <section className="platform-card data-panel">
          <header>
            <h2>Pilih {sasaranPenduduk ? "Warga" : "Keluarga"} Terdata</h2>
            <p>
              Cari{" "}
              {sasaranPenduduk ? "NIK atau nama penduduk" : "nomor KK atau nama kepala keluarga"}.
              Warga yang sudah terdata pada suplemen ini tidak muncul lagi.
            </p>
          </header>

          <form className="penduduk-filter" method="get">
            <input name="aksi" type="hidden" value={aksi} />
            <label className="penduduk-search">
              <span>Cari</span>
              <input
                defaultValue={cari}
                name="q"
                placeholder={sasaranPenduduk ? "NIK atau nama" : "Nomor KK atau kepala keluarga"}
                type="search"
              />
            </label>
            <div className="penduduk-filter-aksi">
              <button className="button button-primary" type="submit">
                Cari
              </button>
            </div>
          </form>

          {kandidat.length === 0 ? (
            <p className="modul-empty">
              {cari
                ? "Tidak ada warga yang cocok atau semuanya sudah terdata pada suplemen ini."
                : "Belum ada kandidat. Masukkan kata kunci untuk mencari."}
            </p>
          ) : (
            <form method="get">
              <input name="aksi" type="hidden" value={aksi} />
              <div className="modul-scroll">
                <table className="modul-table">
                  <thead>
                    <tr>
                      <th scope="col">Pilih</th>
                      <th scope="col">{sasaranPenduduk ? "Warga" : "Keluarga"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kandidat.map((opsi) => (
                      <tr key={opsi.id}>
                        <td>
                          <input
                            aria-label={`Pilih ${opsi.text}`}
                            name="sasaranId"
                            required
                            type="radio"
                            value={opsi.id}
                          />
                        </td>
                        <td>{opsi.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="suplemen-form-actions">
                <Link className="button button-secondary" href={rincianHref}>
                  Batal
                </Link>
                <button className="button button-primary" type="submit">
                  Lanjut
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <section className="platform-card data-panel">
          <header>
            <h2>Konfirmasi & Isian Terdata</h2>
            <p>Periksa identitas sasaran, lalu isi kolom tambahan dan keterangan.</p>
          </header>
          <FormTerdataSuplemen
            aksi={tambahTerdataAction}
            fields={suplemen.formIsian}
            isianAwal={{}}
            keteranganAwal=""
            kembaliHref={aksi === 2 ? dasarHref : rincianHref}
            lanjutHref={aksi === 2 ? dasarHref : undefined}
            referensi={referensi}
            sasaran={suplemen.sasaran}
            sasaranDetail={data.sasaranDetail}
            sasaranId={dipilih}
            suplemenId={id}
          />
        </section>
      )}
    </div>
  );
}
