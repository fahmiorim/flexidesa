import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { getLaporanKelompokRentanData } from "@/features/kependudukan/statistik/application/kelompok-rentan-use-cases";

import { KopLaporanRentan } from "./kop-laporan";
import { TabelKelompokRentan } from "./tabel-kelompok-rentan";

export const metadata: Metadata = {
  title: "Laporan Kelompok Rentan",
};

export default async function LaporanKelompokRentanPage({
  searchParams,
}: {
  searchParams: Promise<{ dusun?: string | string[] }>;
}) {
  const params = await searchParams;
  const dusunParam = Array.isArray(params.dusun) ? params.dusun[0] : params.dusun;
  const data = await getLaporanKelompokRentanData(dusunParam);

  const bulan = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date());
  const query = data.dusun ? `?dusun=${encodeURIComponent(data.dusun)}` : "";

  return (
    <div className="modul-page penduduk-page data-kependudukan-page">
      <PageHeading judul={<>Laporan Kelompok Rentan</>} />

      <section className="platform-card penduduk-card">
        <div className="kelompok-rentan-aksi">
          <ButtonLink
            variant="secondary"
            href={`/kependudukan/kelompok-rentan/cetak${query}`}
            target="_blank"
          >
            Cetak
          </ButtonLink>
          <ButtonLink variant="primary" href={`/kependudukan/kelompok-rentan/ekspor${query}`}>
            Unduh
          </ButtonLink>
        </div>

        <KopLaporanRentan
          bulan={bulan}
          desa={data.namaDesa}
          dusun={data.dusun}
          kabupaten={data.namaKabupaten}
          kecamatan={data.namaKecamatan}
          options={data.dusunOptions}
        />

        {data.rows.length === 0 ? (
          <p className="modul-empty">Belum ada data. Lengkapi data penduduk dan wilayah RT.</p>
        ) : (
          <>
            {data.dusun ? (
              <h3 className="kelompok-rentan-subjudul">
                DATA PILAH DUSUN {data.dusun.toUpperCase()}
              </h3>
            ) : null}
            <div className="modul-scroll">
              <TabelKelompokRentan rows={data.rows} total={data.total} tautkan />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
