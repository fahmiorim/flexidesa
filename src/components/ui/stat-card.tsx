import type { ReactNode } from "react";

export type StatTone = "ungu" | "biru" | "hijau" | "merah" | "oranye";

/**
 * Grid ringkasan. Dipakai hanya pada halaman yang memang punya metrik —
 * bukan kewajiban untuk semua halaman.
 */
export function StatGrid({
  children,
  columns = 3,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={`ui-stat-grid${className ? ` ${className}` : ""}`}
      data-columns={columns === 3 ? undefined : String(columns)}
    >
      {children}
    </section>
  );
}

/**
 * Kartu KPI bersama. Varian `utama` memakai latar gradient untuk metrik
 * paling penting; metrik lain memakai kartu putih dengan garis aksen.
 */
export function StatCard({
  label,
  value,
  note,
  icon,
  tone = "ungu",
  utama = false,
  progress,
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  utama?: boolean;
  /** Persentase 0–100 untuk bilah progres opsional. */
  progress?: number;
  className?: string;
}) {
  return (
    <article
      className={`ui-stat${utama ? " is-utama" : ""}${className ? ` ${className}` : ""}`}
      data-tone={tone}
    >
      <div className="ui-stat-head">
        {icon ? (
          <span aria-hidden="true" className="ui-stat-icon">
            {icon}
          </span>
        ) : null}
        <span className="ui-stat-label">{label}</span>
      </div>
      <strong className="ui-stat-value">{value}</strong>
      {note ? <small className="ui-stat-note">{note}</small> : null}
      {typeof progress === "number" ? (
        <div className="ui-stat-meter" aria-hidden="true">
          <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      ) : null}
    </article>
  );
}
