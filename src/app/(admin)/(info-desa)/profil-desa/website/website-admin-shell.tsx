import type { ReactNode } from "react";

import { PageHeading } from "@/components/shell/page-heading";

export function WebsiteAdminShell({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="modul-page website-admin-page">
      <PageHeading
        judul={<>{title}</>}
        deskripsi={<>{description}</>}
        kelas="page-heading website-admin-heading"
        aksi={<>{action ? <div className="website-admin-actions">{action}</div> : null}</>}
      />
      {children}
    </div>
  );
}

export function WebsiteMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article className="website-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

export function WebsiteSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="modul-card website-section">
      <div className="website-section-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
