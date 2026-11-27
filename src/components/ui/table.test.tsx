// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Cell, EmptyRow, HeaderCell, Row, Table, TableScroll, TBody, THead } from "./table";

afterEach(() => cleanup());

describe("Table", () => {
  it("merender tabel bersama dengan sel angka dan kolom tebal", () => {
    render(
      <TableScroll>
        <Table>
          <THead>
            <Row>
              <HeaderCell>Nama</HeaderCell>
              <HeaderCell numeric>Jumlah</HeaderCell>
            </Row>
          </THead>
          <TBody>
            <Row>
              <Cell strong>Budi</Cell>
              <Cell numeric>3</Cell>
            </Row>
          </TBody>
        </Table>
      </TableScroll>,
    );
    expect(document.querySelector(".ui-table-scroll")).not.toBeNull();
    expect(document.querySelector(".ui-table")).not.toBeNull();
    expect(screen.getByText("Nama").tagName).toBe("TH");
    expect(screen.getByText("3").closest("td")?.getAttribute("data-numeric")).toBe("true");
    expect(screen.getByText("Budi").tagName).toBe("STRONG");
  });

  it("merender baris kosong dengan colSpan penuh", () => {
    render(
      <table>
        <tbody>
          <EmptyRow colSpan={4}>Tidak ada data</EmptyRow>
        </tbody>
      </table>,
    );
    const sel = screen.getByText("Tidak ada data");
    expect(sel.getAttribute("colspan")).toBe("4");
    expect(sel.className).toContain("ui-table-empty");
  });
});
