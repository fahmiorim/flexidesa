"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { buttonClassName, type ButtonSize, type ButtonVariant } from "./button";

interface ButtonLinkProps
  extends Omit<LinkProps, "href">, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "color"> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children: ReactNode;
}

/**
 * Tautan bergaya tombol (mis. “Unduh”, “Kembali”). Gaya identik dengan
 * `Button` karena memakai kelas yang sama.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClassName({ variant, size, block, className })} {...props}>
      {children}
    </Link>
  );
}
