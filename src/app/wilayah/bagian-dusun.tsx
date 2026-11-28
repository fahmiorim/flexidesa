import Image from "next/image";

import type { daftarWilayahPublik } from "@/features/info-desa/wilayah/application/wilayah-publik";
import { formatNumber } from "@/lib/format-tanggal";

import { palette } from "./bagian-wilayah";
import styles from "./wilayah.module.css";

type WilayahRow = Awaited<ReturnType<typeof daftarWilayahPublik>>[number];
type DusunGroup = { name: string; items: WilayahRow[]; luas: number | null };

export function TabelDusun({
  namaDesa,
  groups,
  totalLuas,
  jumlahRt,
  totalKk,
  totalPenduduk,
  pendudukPerDusun,
  kkPerDusun,
}: {
  namaDesa: string | null;
  groups: DusunGroup[];
  totalLuas: number;
  jumlahRt: number;
  totalKk: number;
  totalPenduduk: number;
  pendudukPerDusun: Map<string, number>;
  kkPerDusun: Map<string, number>;
}) {
  return (
    <section className={styles.tableCard}>
      <h2>
        <span>♙</span> Pembagian Wilayah Dusun
      </h2>
      <p className={styles.subtitle}>
        Daftar dusun, luas wilayah, dan jumlah penduduk di {namaDesa ?? "desa"}.
      </p>
      {groups.length ? (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Dusun</th>
                <th>Luas Wilayah</th>
                <th>Jumlah RT</th>
                <th>Jumlah KK</th>
                <th>Jumlah Penduduk</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, i) => (
                <tr key={group.name}>
                  <td>{i + 1}</td>
                  <td>
                    <i style={{ background: palette[i % palette.length] }} />
                    {group.name}
                  </td>
                  <td>{group.luas !== null ? `${formatNumber(group.luas)} Ha` : "—"}</td>
                  <td>
                    {new Set(group.items.filter((r) => r.rt).map((r) => `${r.rw ?? ""}::${r.rt}`))
                      .size || "—"}
                  </td>
                  <td>
                    {kkPerDusun.get(group.name) !== undefined
                      ? `${formatNumber(kkPerDusun.get(group.name)!)} KK`
                      : "—"}
                  </td>
                  <td>
                    {pendudukPerDusun.get(group.name) !== undefined
                      ? `${formatNumber(pendudukPerDusun.get(group.name)!)} jiwa`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptySmall}>Data dusun belum tersedia.</div>
      )}
      <div className={styles.tableFoot}>
        <span>Total</span>
        <span>Luas: {totalLuas > 0 ? `${formatNumber(totalLuas)} Ha` : "—"}</span>
        <span>{jumlahRt} RT</span>
        <span>{formatNumber(totalKk)} KK</span>
        <span>{formatNumber(totalPenduduk)} jiwa</span>
      </div>
      <p className={styles.note}>
        Luas per dusun diisi lewat data wilayah; jumlah KK dan penduduk per dusun diambil dari data
        kependudukan.
      </p>
    </section>
  );
}

export function KondisiGeografis({
  namaDesa,
  details,
  mapPhoto,
}: {
  namaDesa: string | null;
  details: [string, string][];
  mapPhoto: string | null | undefined;
}) {
  return (
    <section className={styles.geoCard}>
      <h2>
        <span>⌁</span> Kondisi Geografis
      </h2>
      <p>
        {details.length
          ? `Kondisi geografis ${namaDesa ?? "desa"} berdasarkan informasi yang dikelola pemerintah desa.`
          : `Informasi kondisi geografis ${namaDesa ?? "desa"} belum dilengkapi oleh pemerintah desa.`}
      </p>
      {details.length ? (
        <dl className={styles.boundaries}>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {mapPhoto ? (
        <div className={styles.geoPhoto}>
          <Image
            src={mapPhoto}
            alt="Dokumentasi area wilayah desa"
            fill
            unoptimized
            sizes="(max-width: 700px) 100vw, 30vw"
          />
        </div>
      ) : (
        <div className={styles.geoPlaceholder}>Foto kondisi geografis belum tersedia</div>
      )}
    </section>
  );
}
