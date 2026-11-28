"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";

import { tinjauRegistrasiWargaAction } from "./actions";

interface Row {
  id: number;
  nik: string;
  nama: string;
  noHp: string | null;
  status: string;
  catatan: string | null;
  createdAt: Date;
}

export function RegistrasiWargaConsole({ rows }: { rows: Row[] }) {
  const [hasil, setHasil] = useState<
    Record<number, { message: string; pin?: string; username?: string }>
  >({});
  const [pending, setPending] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function proses(id: number, keputusan: "setujui" | "tolak") {
    setPending(id);
    startTransition(async () => {
      try {
        const result = await tinjauRegistrasiWargaAction({ id, keputusan });
        setHasil((current) => ({
          ...current,
          [id]: {
            message: result.message,
            pin: result.credential?.pin,
            username: result.credential?.username,
          },
        }));
      } catch {
        setHasil((current) => ({
          ...current,
          [id]: { message: "Koneksi bermasalah. Muat ulang halaman sebelum mencoba kembali." },
        }));
      } finally {
        setPending(null);
      }
    });
  }

  return (
    <div className="platform-card" style={{ padding: 24 }}>
      <TableScroll frame>
        <Table>
          <THead>
            <Row>
              <HeaderCell>Waktu</HeaderCell>
              <HeaderCell>Nama &amp; NIK</HeaderCell>
              <HeaderCell>Kontak</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Catatan</HeaderCell>
              <HeaderCell>Aksi</HeaderCell>
            </Row>
          </THead>
          <TBody>
            {rows.map((row) => {
              const result = hasil[row.id];
              return (
                <Row key={row.id}>
                  <Cell>
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(row.createdAt))}
                  </Cell>
                  <Cell>
                    <strong>{row.nama}</strong>
                    <br />
                    <small>••••••••{row.nik.slice(-4)}</small>
                  </Cell>
                  <Cell>{row.noHp || "—"}</Cell>
                  <Cell>
                    <span className="status-badge">{row.status}</span>
                  </Cell>
                  <Cell>{row.catatan || "—"}</Cell>
                  <Cell>
                    {row.status === "menunggu" ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button
                          variant="primary"
                          type="button"
                          disabled={isPending}
                          onClick={() => proses(row.id, "setujui")}
                        >
                          {pending === row.id ? "Memproses..." : "Setujui"}
                        </Button>
                        <Button
                          variant="secondary"
                          type="button"
                          disabled={isPending}
                          onClick={() => proses(row.id, "tolak")}
                        >
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      "Selesai"
                    )}
                    {result ? (
                      <div role="status" style={{ marginTop: 8, minWidth: 180 }}>
                        <p>{result.message}</p>
                        {result.pin ? (
                          <p>
                            <strong>Username:</strong> {result.username}
                            <br />
                            <strong>PIN awal:</strong> <code>{result.pin}</code>
                            <br />
                            <small>
                              PIN hanya ditampilkan pada sesi ini. Catat dan serahkan secara aman
                              kepada warga.
                            </small>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </Cell>
                </Row>
              );
            })}
            {rows.length === 0 ? (
              <Row>
                <Cell colSpan={6}>Belum ada pengajuan pendaftaran warga.</Cell>
              </Row>
            ) : null}
          </TBody>
        </Table>
      </TableScroll>
    </div>
  );
}
