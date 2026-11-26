import Image from "next/image";

import type { proyeksikanKelompokRings } from "@/features/pertanahan-gis/gis/domain/peta-cetak";

import type { AreaShape } from "./bagian-wilayah";
import styles from "./wilayah.module.css";

type ProyeksiPeta = ReturnType<typeof proyeksikanKelompokRings>;

export function PetaWilayah({
  namaDesa,
  shapes,
  projected,
  mapPhoto,
}: {
  namaDesa: string | null;
  shapes: AreaShape[];
  projected: ProyeksiPeta;
  mapPhoto: string | null | undefined;
}) {
  return (
    <section className={styles.mapCard}>
      <h2>
        <span>◫</span> Peta Wilayah {namaDesa ?? "Desa"}
      </h2>
      <p className={styles.subtitle}>
        Peta batas wilayah dan pembagian dusun yang telah dipublikasikan.
      </p>
      <div className={styles.mapFrame} id="peta-wilayah">
        {mapPhoto ? (
          <Image
            className={styles.mapBackdrop}
            src={mapPhoto}
            alt="Citra wilayah desa"
            fill
            unoptimized
            sizes="(max-width: 900px) 100vw, 60vw"
          />
        ) : null}
        {shapes.length ? (
          <svg
            className={styles.mapSvg}
            viewBox="0 0 1000 650"
            role="img"
            aria-label={`Peta GIS batas wilayah ${namaDesa ?? "desa"}`}
          >
            <defs>
              <pattern id="terrain" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="#dce8d0" />
                <path
                  d="M0 12L30 0 58 18 100 8M-8 62L25 45 51 60 88 43 110 55M8 100L33 78 65 92 100 70"
                  fill="none"
                  stroke="#a8bd93"
                  strokeWidth="3"
                  opacity=".65"
                />
              </pattern>
            </defs>
            {!mapPhoto ? <rect width="1000" height="650" fill="url(#terrain)" /> : null}
            {shapes.map((shape, i) =>
              (projected[i] ?? []).map((ring, j) => (
                <polygon
                  key={`${shape.id}-${j}`}
                  points={ring
                    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
                    .join(" ")}
                  fill={shape.color}
                  fillOpacity=".78"
                  stroke="#fff"
                  strokeWidth="9"
                  strokeLinejoin="round"
                />
              )),
            )}
            <path
              d="M500 285c-20-27-48-14-48 10 0 29 48 67 48 67s48-38 48-67c0-24-28-37-48-10z"
              fill="#ed174c"
              stroke="#fff"
              strokeWidth="8"
            />
            <circle cx="500" cy="295" r="13" fill="#fff" />
          </svg>
        ) : (
          <div className={styles.mapEmpty}>
            <span>⌖</span>
            <strong>Peta wilayah belum tersedia</strong>
            <p>
              Tambahkan dan publikasikan polygon serta area GIS agar peta batas desa dapat
              ditampilkan.
            </p>
          </div>
        )}
        <div className={styles.north}>
          N<br />↑
        </div>
        <div className={styles.mapNote}>{shapes.length} area GIS terpublikasi</div>
      </div>
      <div className={styles.mapActions}>
        <a className={styles.mapActionActive} href="#peta-wilayah">
          ▧ Peta Wilayah
        </a>
        <a href="#peta-wilayah">▧ Satelit</a>
        <a href="#batas-administratif">▱ Batas Administratif</a>
        <span className={styles.mapActionDisabled}>⇩ Unduh Peta (PDF)</span>
      </div>
      <div className={styles.mapLegend}>
        {shapes.length ? (
          shapes.map((shape) => (
            <span key={shape.id}>
              <i style={{ background: shape.color }} />
              <span className={styles.legendCopy}>
                {shape.name}
                {shape.description ? <small>{shape.description}</small> : null}
              </span>
            </span>
          ))
        ) : (
          <span>Belum ada batas area yang dipublikasikan</span>
        )}
      </div>
    </section>
  );
}
