import type { ReactNode } from "react";

/**
 * Daftar definisi (label → nilai) bersama untuk halaman detail/ringkasan.
 * Halaman tidak menulis `<dl>` beserta gayanya sendiri.
 */
export function DefinitionList({ children }: { children: ReactNode }) {
  return <dl className="ui-def">{children}</dl>;
}

export function DefinitionItem({
  label,
  children,
  extra,
}: {
  label: ReactNode;
  children: ReactNode;
  /** Elemen ketiga opsional, mis. badge status di ujung baris. */
  extra?: ReactNode;
}) {
  return (
    <div className="ui-def-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
      {extra ? <div className="ui-def-extra">{extra}</div> : null}
    </div>
  );
}
