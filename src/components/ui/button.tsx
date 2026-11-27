import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Menampilkan spinner dan menonaktifkan tombol. */
  loading?: boolean;
  children: ReactNode;
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  className = "",
}: Pick<ButtonProps, "variant" | "size" | "block" | "loading" | "className"> = {}) {
  return [
    "button",
    `button-${variant}`,
    size === "md" ? "" : `button-${size}`,
    block ? "button-block" : "",
    loading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Tombol admin bersama. Satu-satunya jalur tombol di halaman admin —
 * warna berasal dari kelas `.button-*` di `globals.css`, jadi mengubah
 * token warna mengubah semua tombol sekaligus.
 */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, block, loading, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
