// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ButtonLink } from "./button-link";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

afterEach(() => cleanup());

describe("ButtonLink", () => {
  it("memakai gaya tombol yang sama seperti Button", () => {
    render(
      <ButtonLink href="/penduduk" variant="ghost" size="sm">
        Ke Penduduk
      </ButtonLink>,
    );
    const tautan = screen.getByRole("link", { name: "Ke Penduduk" });
    expect(tautan.getAttribute("href")).toBe("/penduduk");
    expect(tautan.className).toContain("button");
    expect(tautan.className).toContain("button-ghost");
    expect(tautan.className).toContain("button-sm");
  });

  it("meneruskannya sebagai tautan biasa secara bawaan", () => {
    render(<ButtonLink href="/unduh">Unduh</ButtonLink>);
    expect(screen.getByRole("link", { name: "Unduh" }).className).toContain("button-primary");
  });
});
