import Image from "next/image";

import { fotoFallbackUrl } from "@/themes/types";

/**
 * Gambar "foto tidak tersedia" milik tema aktif tenant (opsi
 * `foto_tidak_tersedia` pada konfigurasi tema ala OpenSID).
 *
 * Opsi ini berisi path media tenant, bukan biner di JSON; path divalidasi
 * `fotoFallbackUrl` agar tidak dapat menunjuk berkas desa lain atau URL luar.
 * Bila tenant belum mengunggah gambar, komponen mengembalikan `fallback`.
 */
export function FotoTema({
  villageId,
  opsi,
  alt = "Foto tidak tersedia",
  className,
  width = 320,
  height = 200,
  fallback = null,
}: {
  villageId: number;
  opsi: Record<string, unknown>;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  fallback?: React.ReactNode;
}) {
  const src = fotoFallbackUrl(opsi, villageId);
  if (!src) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
      data-foto-tema="tidak-tersedia"
    />
  );
}
