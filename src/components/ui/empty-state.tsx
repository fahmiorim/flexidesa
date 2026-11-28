import type { ReactNode } from "react";

/**
 * Keadaan kosong bersama untuk daftar/kartu tanpa data.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
