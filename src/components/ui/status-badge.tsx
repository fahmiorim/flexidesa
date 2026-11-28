import type { ReactNode } from "react";

type StatusBadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

/**
 * Lencana status bersama.
 *
 * Satu-satunya jalur badge/status di halaman admin. Tone mengikuti makna,
 * bukan warna bebas: sukses/aktif, peringatan, bahaya, info, netral.
 */
export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusBadgeTone;
  children: ReactNode;
}) {
  return (
    <span className={`ui-badge is-${tone}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  );
}
