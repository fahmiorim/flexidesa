import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/**
 * Tabel admin bersama. Satu-satunya jalur `<table>` di halaman admin —
 * padding, header, dan hover diwarisi halaman dari kelas `.ui-table`
 * di `globals.css`, bukan ditulis ulang per halaman.
 */

export function TableScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`ui-table-scroll${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function Table({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <table className={`ui-table${className ? ` ${className}` : ""}`}>{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TFoot({ children }: { children: ReactNode }) {
  return <tfoot>{children}</tfoot>;
}

export function Row({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return (
    <tr className={className || undefined} {...props}>
      {children}
    </tr>
  );
}

export function HeaderCell({
  children,
  numeric = false,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th data-numeric={numeric || undefined} {...props}>
      {children}
    </th>
  );
}

export function Cell({
  children,
  numeric = false,
  strong = false,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean; strong?: boolean }) {
  return (
    <td data-numeric={numeric || undefined} {...props}>
      {strong ? <strong>{children}</strong> : children}
    </td>
  );
}

/** Baris kosong dengan pesan, dipakai saat data kosong. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="ui-table-empty">
        {children}
      </td>
    </tr>
  );
}
