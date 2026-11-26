import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { getBukuAgendaData } from "@/features/pelayanan-persuratan/surat/application/buku-agenda-use-cases";

import { hapusSuratKeluarAction } from "../buku-agenda-actions";

export const metadata = { title: "Surat Keluar" };
export default async function SuratKeluarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; berhasil?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 100);
  const { rows, canCreate, canUpdate, canDelete } = await getBukuAgendaData("keluar", q);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Surat Keluar</>}
        deskripsi={<>Buku agenda surat yang diterbitkan dan dikirim oleh pemerintah desa.</>}
        aksi={
          <>
            {canCreate ? (
              <Link
                className="button button-primary"
                href="/layanan-surat/persuratan/surat-keluar/baru"
              >
                ＋ Tambah Surat Keluar
              </Link>
            ) : null}
          </>
        }
      />
      {params.berhasil ? (
        <div className="alert alert-info">Perubahan data surat keluar berhasil.</div>
      ) : null}
      <section className="modul-card">
        <form method="get" className="modul-filter-row">
          <input name="q" defaultValue={q} placeholder="Cari nomor surat, penerima, ringkasan…" />
          <button className="button button-secondary">Cari</button>
        </form>
        <div className="modul-scroll">
          <table className="modul-table">
            <thead>
              <tr>
                <th>No. Agenda</th>
                <th>Nomor Surat</th>
                <th>Tanggal</th>
                <th>Penerima</th>
                <th>Klasifikasi</th>
                <th>Ringkasan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.agendaNumber}</td>
                  <td className="modul-mono">{row.letterNumber}</td>
                  <td>{row.letterDate}</td>
                  <td>{row.recipient ?? "—"}</td>
                  <td>{row.classificationName ?? "—"}</td>
                  <td>{row.summary ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canUpdate ? (
                        <Link
                          className="button button-secondary"
                          href={`/layanan-surat/persuratan/surat-keluar/${row.id}/edit`}
                        >
                          Ubah
                        </Link>
                      ) : null}
                      {canDelete ? (
                        <form action={hapusSuratKeluarAction}>
                          <input type="hidden" name="id" value={row.id} />
                          <button className="button button-danger-ghost" type="submit">
                            Hapus
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="modul-empty">Belum ada surat keluar.</p> : null}
      </section>
    </div>
  );
}
