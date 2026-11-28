import type { ReactNode } from "react";

/**
 * Grafik ringkas bersama untuk konsol.
 *
 * Semua gaya berasal dari kelas `.ui-chart-*`; halaman tidak menulis SVG atau
 * warna sendiri. Data selalu berasal dari pemanggil (tanpa deret contoh).
 */

interface TitikGaris {
  kunci: string;
  label: string;
  total: number;
  judul: string;
}

/** Grafik garis kumulatif dengan ringkasan teks untuk pembaca layar. */
export function TrendChart({ points }: { points: readonly TitikGaris[] }) {
  const lebar = 320;
  const tinggi = 128;
  const pad = 10;
  const maksimum = Math.max(...points.map((titik) => titik.total), 1);
  const langkah = points.length > 1 ? (lebar - pad * 2) / (points.length - 1) : 0;
  const posisiX = (index: number) => pad + index * langkah;
  const posisiY = (nilai: number) => tinggi - pad - (nilai / maksimum) * (tinggi - pad * 2);
  const garis = points.map((titik, index) => `${posisiX(index)},${posisiY(titik.total)}`).join(" ");
  const area =
    points.length > 0
      ? `M ${posisiX(0)} ${tinggi - pad} L ${garis.replaceAll(" ", " L ")} L ${posisiX(
          points.length - 1,
        )} ${tinggi - pad} Z`
      : "";
  const terakhir = points[points.length - 1];

  return (
    <figure className="ui-chart">
      <svg
        aria-hidden="true"
        className="ui-chart-plot"
        preserveAspectRatio="none"
        viewBox={`0 0 ${lebar} ${tinggi}`}
      >
        <defs>
          <linearGradient id="ui-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((rasio) => (
          <line
            key={rasio}
            stroke="#e9e4f7"
            strokeDasharray="3 5"
            x1={pad}
            x2={lebar - pad}
            y1={pad + (tinggi - pad * 2) * rasio}
            y2={pad + (tinggi - pad * 2) * rasio}
          />
        ))}
        <path d={area} fill="url(#ui-chart-fill)" stroke="none" />
        <polyline
          fill="none"
          points={garis}
          stroke="#7c3aed"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((titik, index) => (
          <circle
            cx={posisiX(index)}
            cy={posisiY(titik.total)}
            fill="#fff"
            key={titik.kunci}
            r={3}
            stroke="#7c3aed"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div aria-hidden="true" className="ui-chart-axis">
        {points.map((titik) => (
          <span key={titik.kunci}>{titik.label}</span>
        ))}
      </div>
      <figcaption className="sr-only">
        Pertumbuhan kumulatif enam bulan terakhir, berakhir{" "}
        {terakhir ? `${terakhir.total} pada ${terakhir.judul}` : "tanpa data"}.
      </figcaption>
    </figure>
  );
}

interface ItemDistribusi {
  label: string;
  value: number;
  persentase: number;
}

const WARNA_DISTRIBUSI = [
  "#7c3aed",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
] as const;

function warnaDistribusi(label: string, index: number): string {
  return label === "Belum bertema"
    ? "#cbd5e1"
    : (WARNA_DISTRIBUSI[index % WARNA_DISTRIBUSI.length] ?? "#7c3aed");
}

function segmenDonat(items: readonly ItemDistribusi[], total: number): string[] {
  let kumulatif = 0;
  return items.map((item, index) => {
    const mulai = (kumulatif / total) * 100;
    kumulatif += item.value;
    const selesai = (kumulatif / total) * 100;
    return `${warnaDistribusi(item.label, index)} ${mulai}% ${selesai}%`;
  });
}

/** Donat distribusi dengan legenda persentase. */
export function DonutChart({
  items,
  total,
  centerLabel,
  centerValue,
  kosong,
}: {
  items: readonly ItemDistribusi[];
  total: number;
  centerLabel: string;
  centerValue: ReactNode;
  /** Ditampilkan bila tidak ada data; pemanggil menyediakan `EmptyState`. */
  kosong: ReactNode;
}) {
  if (items.length === 0 || total <= 0) return <>{kosong}</>;

  return (
    <div className="ui-chart-donut-layout">
      <div
        aria-label={`Sebaran dari ${total} data dalam ${items.length} kelompok`}
        className="ui-chart-donut"
        role="img"
        style={{ background: `conic-gradient(${segmenDonat(items, total).join(", ")})` }}
      >
        <div className="ui-chart-donut-center">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="ui-chart-legend">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <span
              aria-hidden="true"
              className="ui-chart-dot"
              style={{ background: warnaDistribusi(item.label, index) }}
            />
            <span className="ui-chart-legend-label">{item.label}</span>
            <span className="ui-chart-legend-value">
              {item.persentase}% · {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Daftar bilah horizontal untuk distribusi per kategori. */
export function BarList({
  items,
  labelKosong,
  satuan = "desa",
}: {
  items: readonly ItemDistribusi[];
  labelKosong: string;
  satuan?: string;
}) {
  if (items.length === 0) return <p className="ui-chart-catatan">{labelKosong}</p>;

  return (
    <ul className="ui-chart-bars">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <div className="ui-chart-bar-meta">
            <span>{item.label}</span>
            <strong>
              {item.value} {satuan} <small>({item.persentase}%)</small>
            </strong>
          </div>
          <span aria-hidden="true" className="ui-chart-bar-track">
            <span
              className="ui-chart-bar-fill"
              style={{
                width: `${item.persentase}%`,
                background: WARNA_DISTRIBUSI[index % WARNA_DISTRIBUSI.length],
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
