"use client";

import { useEffect } from "react";

/** Buka dialog cetak sekali setelah halaman siap (dipakai dari dialog TTD). */
export function CetakOtomatis() {
  useEffect(() => {
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
