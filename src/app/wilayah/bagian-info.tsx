import { formatNumber, type ProfilWilayah } from "./bagian-wilayah";
import styles from "./wilayah.module.css";

export function InformasiWilayah({
  profil,
  jumlahDusun,
  jumlahRw,
  jumlahRt,
  totalPenduduk,
  totalKk,
}: {
  profil: ProfilWilayah | null;
  jumlahDusun: number;
  jumlahRw: number;
  jumlahRt: number;
  totalPenduduk: number;
  totalKk: number;
}) {
  return (
    <section className={styles.infoCard}>
      <h2>
        <span>ⓘ</span> Informasi Wilayah
      </h2>
      <dl>
        <div>
          <dt>⌖ Luas Wilayah</dt>
          <dd>
            {profil?.luasWilayah
              ? `${formatNumber(Number(profil.luasWilayah))} Ha`
              : "Belum tersedia"}
          </dd>
        </div>
        <div>
          <dt>▧ Jumlah Dusun</dt>
          <dd>{jumlahDusun || "—"}</dd>
        </div>
        <div>
          <dt>Jumlah RW</dt>
          <dd>{jumlahRw || "—"}</dd>
        </div>
        <div>
          <dt>Jumlah RT</dt>
          <dd>{jumlahRt || "—"}</dd>
        </div>
        <div>
          <dt>♧ Jumlah Penduduk</dt>
          <dd>{formatNumber(totalPenduduk)} jiwa</dd>
        </div>
        <div>
          <dt>⌂ Jumlah KK</dt>
          <dd>{formatNumber(totalKk)} KK</dd>
        </div>
        <div>
          <dt>⌁ Ketinggian</dt>
          <dd>{profil?.ketinggian ?? "Belum tersedia"}</dd>
        </div>
        <div>
          <dt>♨ Suhu Rata-rata</dt>
          <dd>{profil?.suhuRataRata ?? "Belum tersedia"}</dd>
        </div>
        <div>
          <dt>≋ Curah Hujan</dt>
          <dd>{profil?.curahHujan ?? "Belum tersedia"}</dd>
        </div>
        <div>
          <dt>▱ Topografi</dt>
          <dd>{profil?.topografi ?? "Belum tersedia"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function BatasWilayah({ rows }: { rows: (string | null | undefined)[][] }) {
  return (
    <section className={styles.infoCard} id="batas-administratif">
      <h2>
        <span>⇄</span> Batas Wilayah Administratif
      </h2>
      {rows.length ? (
        <dl className={styles.boundaries}>
          {rows.map(([label, value]) => (
            <div key={label ?? ""}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.emptySmall}>Informasi batas administratif belum dilengkapi.</p>
      )}
    </section>
  );
}
