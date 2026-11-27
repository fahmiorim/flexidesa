import { ButtonLink } from "@/components/ui/button-link";
import { JudulCetak, KopCetak, TandaTanganCetak } from "@/components/ui/cetak-dokumen";
import { TombolCetak } from "@/components/ui/tombol-cetak";
import { getKopCetakData } from "@/features/info-desa/pemerintahan/application/lembaga";
import { getTingkatWilayah, labelWilayah } from "@/features/info-desa/wilayah/application/tingkat";
import { LABEL_TINGKAT, tingkatWilayah } from "@/features/info-desa/wilayah/domain/wilayah";

export const metadata = { title: "Cetak Wilayah Administratif" };

const angka = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export default async function CetakWilayahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parent = typeof params.parent === "string" ? Number(params.parent) : null;
  const [{ induk, daftar, judul }, { desa, sekretaris }] = await Promise.all([
    getTingkatWilayah(
      parent !== null && Number.isSafeInteger(parent) && parent > 0 ? parent : null,
    ),
    getKopCetakData(),
  ]);
  const kembali = induk
    ? `/profil-desa/wilayah-administratif?parent=${induk.id}`
    : "/profil-desa/wilayah-administratif";

  return (
    <div className="modul-page pemerintahan-page pemerintahan-cetak">
      <header className="page-heading pemerintahan-cetak-toolbar">
        <div>
          <span className="eyebrow">WILAYAH ADMINISTRATIF</span>
          <h1>{induk ? `Wilayah ${labelWilayah(induk)}` : "Daftar Dusun"}</h1>
          <p>{judul} beserta kepala, jumlah KK, dan penduduk.</p>
        </div>
        <div className="page-heading-actions">
          <ButtonLink variant="ghost" href={kembali}>
            Kembali
          </ButtonLink>
          <ButtonLink
            variant="ghost"
            href={`/profil-desa/wilayah-administratif/unduh/xlsx${induk ? `?parent=${induk.id}` : ""}`}
          >
            Unduh XLSX
          </ButtonLink>
          <ButtonLink
            variant="ghost"
            href={`/profil-desa/wilayah-administratif/unduh/pdf${induk ? `?parent=${induk.id}` : ""}`}
          >
            Unduh PDF
          </ButtonLink>
          <TombolCetak />
        </div>
      </header>
      <section className="modul-card">
        <KopCetak desa={desa} logo={desa?.logo} />
        <JudulCetak>Daftar {judul}</JudulCetak>
        <p className="pemerintahan-cetak-meta">{daftar.length} baris wilayah.</p>
        <div className="modul-table-wrap">
          <table className="modul-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Wilayah</th>
                <th>Tingkat</th>
                <th>Kepala Wilayah</th>
                <th>NIK Kepala</th>
                <th>KK</th>
                <th>Laki-laki</th>
                <th>Perempuan</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{labelWilayah(row)}</td>
                  <td>{LABEL_TINGKAT[tingkatWilayah(row)]}</td>
                  <td>{row.kepala || "—"}</td>
                  <td>{row.kepalaNik || "—"}</td>
                  <td>{angka(row.jumlahKk)}</td>
                  <td>{angka(row.lakiLaki)}</td>
                  <td>{angka(row.perempuan)}</td>
                  <td>{angka(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TandaTanganCetak desa={desa} sekretaris={sekretaris} />
      </section>
    </div>
  );
}
