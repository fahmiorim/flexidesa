"use client";

import { Button, type ButtonSize, type ButtonVariant } from "./button";

/**
 * Tombol submit yang meminta konfirmasi sebelum form dikirim.
 *
 * Dipakai untuk aksi merusak (mis. hapus data) agar pengguna tidak menghapus
 * hanya karena salah klik. Server tetap memeriksa izin dan aturan domain.
 *
 * `variant` memakai komponen `Button` bersama; tanpa `variant`, `className`
 * tetap diteruskan apa adanya (kompatibilitas lama).
 */
export function ConfirmSubmit({
  message,
  className,
  variant,
  size = "md",
  block = false,
  children,
  form,
}: {
  message: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children: React.ReactNode;
  /** Id form yang dituju; dipakai bila tombol berada di luar form-nya. */
  form?: string;
}) {
  const konfirmasi = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };

  if (variant) {
    return (
      <Button
        variant={variant}
        size={size}
        block={block}
        className={className}
        form={form}
        onClick={konfirmasi}
        type="submit"
      >
        {children}
      </Button>
    );
  }

  return (
    <button className={className} form={form} onClick={konfirmasi} type="submit">
      {children}
    </button>
  );
}
