import Image from "next/image";
import Link from "next/link";

import type { ThemeWidgetProps, ThemeWidgets } from "./types";

/** Widget bersama untuk footer bertema. Tema boleh meng-override per paket. */

export function JamWidget({ villageName }: ThemeWidgetProps) {
  const sekarang = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return (
    <span data-widget="jam">
      Jam {sekarang} WIB · {villageName ?? "Desa"}
    </span>
  );
}

export function StatistikWidget() {
  return (
    <span data-widget="statistik">
      <Link href="/statistik">Statistik desa</Link>
    </span>
  );
}

export function FotoFallbackWidget({ fotoUrl }: ThemeWidgetProps & { fotoUrl: string | null }) {
  if (!fotoUrl) return <span data-widget="foto-fallback" />;
  return (
    <Image
      src={fotoUrl}
      alt="Foto tidak tersedia"
      width={64}
      height={64}
      unoptimized
      data-widget="foto-fallback"
    />
  );
}

export const WIDGET_BERSAMA: ThemeWidgets = {
  jam: JamWidget,
  statistik: StatistikWidget,
  fotoFallback: FotoFallbackWidget,
};
