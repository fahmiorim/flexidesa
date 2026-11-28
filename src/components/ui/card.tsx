import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** `stat` untuk kartu statistik (perilaku lama), `panel` untuk card umum. */
  variant?: "stat" | "panel";
  /** Menghapus padding badan (untuk tabel di dalam card). */
  flush?: boolean;
}

/**
 * Card admin bersama. `variant="stat"` mempertahankan perilaku lama
 * (`.stat-card`); `variant="panel"` adalah card umum dengan header/badan/footer.
 */
export function Card({ children, className = "", variant = "stat", ...props }: CardProps) {
  if (variant === "panel") {
    return (
      <section className={`ui-card${className ? ` ${className}` : ""}`} {...props}>
        {children}
      </section>
    );
  }
  return (
    <section className={`stat-card${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </section>
  );
}

/**
 * Grid kartu bersama untuk menyusun beberapa `Card variant="panel"`
 * berdampingan. Halaman tidak menulis grid sendiri.
 */
export function CardGrid({
  children,
  columns = 2,
  className = "",
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div className={`ui-card-grid${className ? ` ${className}` : ""}`} data-columns={columns}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  aksi,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  aksi?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`ui-card-head${className ? ` ${className}` : ""}`}>
      <div className="ui-card-head-text">
        {title ? <h3 className="ui-card-title">{title}</h3> : null}
        {description ? <p className="ui-card-desc">{description}</p> : null}
        {children}
      </div>
      {aksi ? <div className="ui-card-actions">{aksi}</div> : null}
    </header>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`ui-card-body${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <footer className={`ui-card-foot${className ? ` ${className}` : ""}`}>{children}</footer>;
}
