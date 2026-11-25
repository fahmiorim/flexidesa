import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { muatStuntingData } from "@/features/kesehatan/application/kia-use-cases";
import { buildSkorcardKonvergensi, hitungSkorcardKia } from "@/features/kesehatan/domain/kesehatan";
import { hasPermission } from "@/features/rbac/application/authorization";
import { verifySession } from "@/lib/dal";

import { BagianAnak } from "./bagian-anak";
import { BagianIbuHamil } from "./bagian-ibu-hamil";
import { BagianKia } from "./bagian-kia";
import { BagianPaud } from "./bagian-paud";
import { BagianPosyandu } from "./bagian-posyandu";
import { BagianRekap } from "./bagian-rekap";
import { BagianRekapPaud } from "./bagian-rekap-paud";
import styles from "./stunting.module.css";

export const metadata: Metadata = { title: "Stunting" };

const number = new Intl.NumberFormat("id-ID");

/**
 * Tab mengikuti navigasi modul Stunting OpenSID
 * (`resources/views/admin/stunting/navigasi.blade.php`): Posyandu, KIA,
 * pemantauan bulanan ibu hamil/anak, rekapitulasi, dan scorecard konvergensi.
 */
const TABS = [
  { kunci: "posyandu", label: "Posyandu" },
  { kunci: "kia", label: "Kesehatan Ibu dan Anak (KIA)" },
  { kunci: "ibu-hamil", label: "Bulanan Ibu Hamil" },
  { kunci: "anak", label: "Bulanan Anak 0-2 Tahun" },
  { kunci: "paud", label: "Sasaran PAUD 2-6 Tahun" },
  { kunci: "rekapitulasi", label: "Rekapitulasi" },
  { kunci: "scorecard", label: "Scorecard Konvergensi" },
] as const;

type TabKunci = (typeof TABS)[number]["kunci"];

function tabAktif(nilai: string | undefined): TabKunci {
  return TABS.find((tab) => tab.kunci === nilai)?.kunci ?? "posyandu";
}

export default async function StuntingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user, data] = await Promise.all([
    searchParams,
    verifySession(),
    muatStuntingData(),
  ]);

  const tab = tabAktif(typeof params.tab === "string" ? params.tab : undefined);
  const bolehUbah = hasPermission(user.permissions, "kesehatan", "update");
  const bolehHapus = hasPermission(user.permissions, "kesehatan", "delete");

  const { posyandu, kia, ibuHamil, anak, paud, penduduk } = data;
  const skorcard = buildSkorcardKonvergensi(ibuHamil, anak);
  const rekapKia = hitungSkorcardKia(
    anak.map((row) => ({ statusGizi: row.statusGizi, statusTikar: row.statusTikar })),
  );

  const posyanduNama = new Map(posyandu.map((row) => [row.id, row.nama]));
  const kiaNama = new Map(
    kia.map((row) => [
      row.id,
      { noKia: row.noKia, ibuName: row.ibuName ?? null, anakId: row.anakId },
    ]),
  );
  const filterBulan = typeof params.bulan === "string" ? params.bulan : "";
  const filterTahun = typeof params.tahun === "string" ? params.tahun : "";
  const sekarang = new Date();
  const bulanIni = (nilai: Date | string | null | undefined) => {
    if (!nilai) return false;
    const tanggal = nilai instanceof Date ? nilai : new Date(nilai);
    return (
      tanggal.getMonth() === sekarang.getMonth() && tanggal.getFullYear() === sekarang.getFullYear()
    );
  };
  const ibuHamilBulanIni = ibuHamil.filter((row) => bulanIni(row.createdAt)).length;
  const anakBulanIni = anak.filter((row) => bulanIni(row.createdAt)).length;
  const awalBulan = Number(params.awal) >= 1 && Number(params.awal) <= 12 ? Number(params.awal) : 1;
  const akhirBulan =
    Number(params.akhir) >= awalBulan && Number(params.akhir) <= 12 ? Number(params.akhir) : 12;

  return (
    <div className="modul-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Stunting</h1>
            <p>Posyandu, pemantauan ibu dan anak, serta rekap stunting.</p>
          </div>
        </header>
      </PageHeading>

      <section aria-label="Ringkasan stunting" className="data-kependudukan-kpis">
        <article className="data-kpi data-kpi-primary">
          <span>Posyandu</span>
          <strong>{number.format(posyandu.length)}</strong>
          <small>Posyandu terdaftar</small>
        </article>
        <article className="data-kpi">
          <span>Buku KIA</span>
          <strong>{number.format(kia.length)}</strong>
          <small>Ibu dan anak terdaftar</small>
        </article>
        <article className="data-kpi">
          <span>Pemantauan Ibu Hamil</span>
          <strong>{number.format(ibuHamil.length)}</strong>
          <small>
            {number.format(ibuHamilBulanIni)} periksa bulan ini ·{" "}
            {number.format(skorcard.jumlahKekRisti)} KEK/risti
          </small>
        </article>
        <article className="data-kpi">
          <span>Pemantauan Anak</span>
          <strong>{number.format(anak.length)}</strong>
          <small>
            {number.format(anakBulanIni)} periksa bulan ini · {number.format(rekapKia.stunting)}{" "}
            terindikasi stunting
          </small>
        </article>
      </section>

      <nav aria-label="Navigasi modul stunting" className={styles.tabs}>
        {TABS.map((item) => (
          <Link
            aria-current={tab === item.kunci ? "page" : undefined}
            className={tab === item.kunci ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            href={`/kesehatan/stunting?tab=${item.kunci}`}
            key={item.kunci}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "posyandu" ? (
        <BagianPosyandu
          bolehHapus={bolehHapus}
          bolehUbah={bolehUbah}
          posyandu={posyandu}
          ubahId={Number(params.ubah) || null}
        />
      ) : null}

      {tab === "kia" ? (
        <BagianKia
          anak={anak}
          bolehHapus={bolehHapus}
          bolehUbah={bolehUbah}
          ibuHamil={ibuHamil}
          kia={kia}
          penduduk={penduduk}
          ubahId={Number(params.ubah) || null}
        />
      ) : null}

      {tab === "ibu-hamil" ? (
        <BagianIbuHamil
          bolehHapus={bolehHapus}
          bolehUbah={bolehUbah}
          data={ibuHamil}
          filterBulan={filterBulan}
          filterPosyandu={typeof params.posyandu === "string" ? params.posyandu : ""}
          filterTahun={filterTahun}
          kiaNama={kiaNama}
          posyandu={posyandu}
          posyanduNama={posyanduNama}
          ubahId={Number(params.ubah) || null}
        />
      ) : null}

      {tab === "anak" ? (
        <BagianAnak
          bolehHapus={bolehHapus}
          bolehUbah={bolehUbah}
          data={anak}
          filterBulan={filterBulan}
          filterPosyandu={typeof params.posyandu === "string" ? params.posyandu : ""}
          filterTahun={filterTahun}
          kiaNama={kiaNama}
          penduduk={penduduk}
          posyandu={posyandu}
          posyanduNama={posyanduNama}
          ubahId={Number(params.ubah) || null}
        />
      ) : null}

      {tab === "paud" ? (
        <BagianPaud
          bolehHapus={bolehHapus}
          bolehUbah={bolehUbah}
          data={paud}
          kiaNama={kiaNama}
          posyandu={posyandu}
          posyanduNama={posyanduNama}
          ubahId={Number(params.ubah) || null}
        />
      ) : null}

      {tab === "rekapitulasi" ? (
        <>
          <BagianRekap
            akhirBulan={akhirBulan}
            anak={anak}
            awalBulan={awalBulan}
            filterPosyandu={typeof params.posyandu === "string" ? params.posyandu : ""}
            filterTahun={filterTahun}
            ibuHamil={ibuHamil}
            kiaNama={kiaNama}
            penduduk={penduduk}
            posyandu={posyandu}
            posyanduNama={posyanduNama}
            skorcard={skorcard}
          />
          <BagianRekapPaud
            akhirBulan={akhirBulan}
            awalBulan={awalBulan}
            kiaNama={kiaNama}
            paud={paud}
            penduduk={penduduk}
          />
        </>
      ) : null}

      {tab === "scorecard" ? (
        <BagianRekap
          akhirBulan={akhirBulan}
          anak={anak}
          awalBulan={awalBulan}
          filterPosyandu=""
          filterTahun=""
          ibuHamil={ibuHamil}
          kiaNama={kiaNama}
          penduduk={penduduk}
          posyandu={posyandu}
          posyanduNama={posyanduNama}
          skorcard={skorcard}
          tampilkan="scorecard"
        />
      ) : null}
    </div>
  );
}
