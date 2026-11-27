const DURASI_TUTUP_MS = 140;

/**
 * Tutup dialog dengan animasi keluar singkat.
 *
 * `dialog.close()` bawaan browser tidak dapat dianimasikan lewat CSS, jadi
 * kelas `is-closing` dipasang lebih dulu dan elemen ditutup setelah durasi
 * yang sama dengan animasinya. Reduced motion langsung menutup dialog.
 */
export function tutupDialog(dialog: HTMLDialogElement | null) {
  if (!dialog || !dialog.open) return;
  if (dialog.classList.contains("is-closing")) return;

  const kurangiGerak =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (kurangiGerak) {
    dialog.close();
    return;
  }

  dialog.classList.add("is-closing");
  window.setTimeout(() => {
    dialog.classList.remove("is-closing");
    dialog.close();
  }, DURASI_TUTUP_MS);
}
