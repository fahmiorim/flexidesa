// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatCard, StatGrid } from "./stat-card";

afterEach(() => cleanup());

describe("StatGrid/StatCard", () => {
  it("merender grid tiga kolom secara bawaan", () => {
    render(
      <StatGrid>
        <StatCard label="Total" value="10" />
      </StatGrid>,
    );
    const grid = document.querySelector(".ui-stat-grid");
    expect(grid).not.toBeNull();
    expect(grid?.getAttribute("data-columns")).toBeNull();
  });

  it("mendukung grid empat kolom", () => {
    render(
      <StatGrid columns={4}>
        <StatCard label="Total" value="10" />
      </StatGrid>,
    );
    expect(document.querySelector(".ui-stat-grid")?.getAttribute("data-columns")).toBe("4");
  });

  it("merender label, nilai, catatan, ikon, tone, dan varian utama", () => {
    render(
      <StatCard
        icon={<svg />}
        label="Penduduk"
        note="1.389 terdata"
        tone="hijau"
        utama
        value="1.389"
      />,
    );
    expect(screen.getByText("Penduduk").className).toContain("ui-stat-label");
    expect(screen.getByText("1.389").className).toContain("ui-stat-value");
    expect(screen.getByText("1.389 terdata").className).toContain("ui-stat-note");
    const card = document.querySelector(".ui-stat");
    expect(card?.className).toContain("is-utama");
    expect(card?.getAttribute("data-tone")).toBe("hijau");
    expect(document.querySelector(".ui-stat-icon")).not.toBeNull();
  });

  it("membatasi progres ke rentang 0–100", () => {
    render(
      <>
        <StatCard label="A" progress={140} value={1} />
        <StatCard label="B" progress={-20} value={2} />
      </>,
    );
    const bars = document.querySelectorAll<HTMLElement>(".ui-stat-meter span");
    expect(bars[0]?.style.width).toBe("100%");
    expect(bars[1]?.style.width).toBe("0%");
  });
});
