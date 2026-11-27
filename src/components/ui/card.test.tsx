// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Card, CardBody, CardFooter, CardHeader } from "./card";

afterEach(() => cleanup());

describe("Card", () => {
  it("mempertahankan varian stat sebagai bawaan (kompatibilitas lama)", () => {
    render(<Card>Jumlah Penduduk</Card>);
    expect(document.querySelector(".stat-card")).not.toBeNull();
    expect(document.querySelector(".ui-card")).toBeNull();
  });

  it("merender card panel beserta header, badan, dan footer", () => {
    render(
      <Card variant="panel">
        <CardHeader title="Daftar Penduduk" description="Total 1.389" aksi={<i>Aksi</i>} />
        <CardBody>Isi</CardBody>
        <CardFooter>Catatan</CardFooter>
      </Card>,
    );
    expect(document.querySelector(".ui-card")).not.toBeNull();
    expect(screen.getByText("Daftar Penduduk").className).toContain("ui-card-title");
    expect(screen.getByText("Total 1.389").className).toContain("ui-card-desc");
    expect(screen.getByText("Isi").className).toContain("ui-card-body");
    expect(screen.getByText("Catatan").className).toContain("ui-card-foot");
  });

  it("tidak mewajibkan header/footer", () => {
    render(
      <Card variant="panel">
        <CardBody>Saja</CardBody>
      </Card>,
    );
    expect(screen.getByText("Saja")).toBeTruthy();
    expect(document.querySelector(".ui-card-head")).toBeNull();
  });
});
