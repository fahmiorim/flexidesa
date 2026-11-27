import type { ReactNode } from "react";

import { Card, CardHeader } from "./card";

/**
 * Shell standar halaman daftar admin.
 *
 * Urutan tetap: judul/deskripsi + aksi di header, filter/pencarian, tabel,
 * lalu footer. Halaman tidak lagi menyusun header dan filter sendiri-sendiri.
 */
export function TableCard({
  title,
  description,
  actions,
  filter,
  children,
  footer,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  filter?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="panel" className={`table-card${className ? ` ${className}` : ""}`}>
      <CardHeader title={title} description={description} aksi={actions} />
      {filter ? <div className="table-card-filter">{filter}</div> : null}
      <div className="table-card-content">{children}</div>
      {footer ? <div className="table-card-footer">{footer}</div> : null}
    </Card>
  );
}
