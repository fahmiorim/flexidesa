import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { klasifikasiSkor } from "@/features/layanan-warga/analisis/domain/skor";
import {
  getHasilSurveiData,
  getSurveiPageData,
} from "@/features/layanan-warga/pelayanan/application/survei-use-cases";

import { hapusSurveiAction } from "./actions";

export const metadata = { title: "Survei & Kepuasan Masyarakat" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tersimpan?: string; dihapus?: string }>;
}) {
  const [data, params] = await Promise.all([getSurveiPageData(), searchParams]);
  const results = await Promise.all(data.rows.map((row) => getHasilSurveiData(row.id)));
  const active = data.rows.filter((row) => row.aktif === 1).length;
  const respondents = data.rows.reduce((sum, row) => sum + row.totalResponden, 0);
  const questions = data.rows.reduce((sum, row) => sum + row.totalSoal, 0);
  const scored = results.reduce((sum, row) => sum + row.scoredCount, 0);
  const weightedScore = results.reduce((sum, row) => sum + (row.average ?? 0) * row.scoredCount, 0);
  const average = scored ? Math.round((weightedScore / scored) * 10) / 10 : null;
  const distribution = ["Sangat Baik", "Baik", "Cukup", "Kurang"].map((label) => ({
    label,
    total: results.reduce(
      (sum, row) => sum + (row.distribution.find((item) => item.label === label)?.total ?? 0),
      0,
    ),
  }));
  const maxDistribution = Math.max(1, ...distribution.map((item) => item.total));
  const comments = results
    .flatMap((row) => row.comments.map((comment) => ({ ...comment, judul: row.row.judul })))
    .slice(0, 8);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Survei & Kepuasan Masyarakat</>}
        deskripsi={<>Kelola survei kepuasan layanan desa.</>}
      />
      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Indeks Kepuasan (IKM)</span>
          <strong>{average === null ? "—" : average.toFixed(1) + " / 100"}</strong>
          <small>{scored.toLocaleString("id-ID")} responden dengan jawaban terukur</small>
        </article>
        <article className="modul-card">
          <span>Total Responden</span>
          <strong>{respondents.toLocaleString("id-ID")}</strong>
          <small>Akumulasi seluruh survei</small>
        </article>
        <article className="modul-card">
          <span>Survei Aktif</span>
          <strong>{active.toLocaleString("id-ID")}</strong>
          <small>Sedang menerima tanggapan</small>
        </article>
        <article className="modul-card">
          <span>Total Pertanyaan</span>
          <strong>{questions.toLocaleString("id-ID")}</strong>
          <small>Seluruh formulir survei</small>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="modul-card">
          <h2>Komposisi Penilaian Kepuasan</h2>
          <p>Distribusi klasifikasi dari responden yang memiliki skor terukur.</p>
          <div className="survey-results-bars">
            {distribution.map((item) => (
              <div className="survey-result-row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.total.toLocaleString("id-ID")} responden</span>
                </div>
                <div className="survey-result-track">
                  <i style={{ width: (item.total / maxDistribution) * 100 + "%" }} />
                </div>
              </div>
            ))}
          </div>
          {scored === 0 ? <p className="modul-empty">Belum ada penilaian terukur.</p> : null}
        </section>
        <section className="modul-card">
          <h2>Ringkasan Analisis</h2>
          <div className="activity-list">
            <p>
              <strong>Indeks Kepuasan:</strong>{" "}
              {average === null ? "Belum tersedia" : average.toFixed(1) + " / 100"}
            </p>
            <p>
              <strong>Kategori:</strong>{" "}
              {average === null ? "Belum tersedia" : klasifikasiSkor(average)}
            </p>
            <p>
              <strong>Responden terukur:</strong> {scored.toLocaleString("id-ID")}
            </p>
            <p>
              <strong>Survei aktif:</strong> {active.toLocaleString("id-ID")}
            </p>
          </div>
        </section>
      </div>
      {params.tersimpan ? <div className="alert alert-info">Survei berhasil disimpan.</div> : null}
      {params.dihapus ? <div className="alert alert-info">Survei berhasil dihapus.</div> : null}
      <section className="modul-card" id="tren-ikm">
        <div className="page-heading">
          <div>
            <h2>Perbandingan IKM per Periode</h2>
            <p>
              Skor rata-rata tiap survei, diurutkan berdasarkan tanggal mulai atau tanggal dibuat.
            </p>
          </div>
        </div>
        {results.filter((row) => row.average !== null).length ? (
          <div className="survey-results-bars">
            {[...results]
              .filter((row) => row.average !== null)
              .sort((a, b) =>
                (a.row.mulai ?? a.row.createdAt.toISOString().slice(0, 10)).localeCompare(
                  b.row.mulai ?? b.row.createdAt.toISOString().slice(0, 10),
                ),
              )
              .map((row) => (
                <div className="survey-result-row" key={row.row.id}>
                  <div>
                    <strong>{row.row.judul}</strong>
                    <span>
                      {row.row.mulai ?? row.row.createdAt.toLocaleDateString("id-ID")} ·{" "}
                      {row.scoredCount} responden terukur
                    </span>
                  </div>
                  <div className="survey-result-track">
                    <i style={{ width: Math.max(0, Math.min(100, row.average ?? 0)) + "%" }} />
                  </div>
                  <strong>{row.average?.toFixed(1)}</strong>
                </div>
              ))}
          </div>
        ) : (
          <p className="modul-empty">
            Belum ada periode survei dengan skor yang dapat dibandingkan.
          </p>
        )}
      </section>
      <TableCard
        description="Rekap responden dan indeks kepuasan berdasarkan survei."
        title="Hasil Survei per Program"
      >
        <TableScroll className="modul-scroll">
          <Table className="modul-table">
            <THead>
              <Row>
                <HeaderCell>Nama Survei</HeaderCell>
                <HeaderCell>Responden</HeaderCell>
                <HeaderCell>IKM (0–100)</HeaderCell>
                <HeaderCell>Kategori</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {results.map((row) => (
                <Row key={row.row.id}>
                  <Cell>
                    <strong>{row.row.judul}</strong>
                    <br />
                    <small>
                      {row.row.mulai ?? "Tanpa batas"} – {row.row.selesai ?? "Tanpa batas"}
                    </small>
                  </Cell>
                  <Cell>{row.totalResponden.toLocaleString("id-ID")}</Cell>
                  <Cell>{row.average === null ? "—" : row.average.toFixed(1)}</Cell>
                  <Cell>{row.klasifikasi}</Cell>
                  <Cell>
                    <ButtonLink
                      variant="secondary"
                      href={"/pelayanan-publik/survei/" + row.row.id + "/hasil"}
                    >
                      Lihat hasil
                    </ButtonLink>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
        {results.length === 0 ? <p className="modul-empty">Belum ada hasil survei.</p> : null}
      </TableCard>
      <TableCard
        actions={
          data.canCreate ? (
            <ButtonLink variant="primary" href="/pelayanan-publik/survei/baru">
              ＋ Buat Survei Baru
            </ButtonLink>
          ) : null
        }
        description="Atur periode, sasaran, pertanyaan, dan status publikasi survei."
        title="Kelola Survei"
      >
        <TableScroll className="modul-scroll">
          <Table className="modul-table">
            <THead>
              <Row>
                <HeaderCell>Nama Survei</HeaderCell>
                <HeaderCell>Periode</HeaderCell>
                <HeaderCell>Soal</HeaderCell>
                <HeaderCell>Responden</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Aksi</HeaderCell>
              </Row>
            </THead>
            <TBody>
              {data.rows.map((row) => (
                <Row key={row.id}>
                  <Cell>
                    <strong>{row.judul}</strong>
                    <br />
                    <small>{row.sasaran ?? "Semua masyarakat"}</small>
                  </Cell>
                  <Cell>
                    {row.mulai ?? "Tanpa batas"} – {row.selesai ?? "Tanpa batas"}
                  </Cell>
                  <Cell>{row.totalSoal}</Cell>
                  <Cell>{row.totalResponden}</Cell>
                  <Cell>{row.aktif === 1 ? "Aktif" : "Nonaktif"}</Cell>
                  <Cell>
                    <div className="table-actions">
                      <ButtonLink variant="secondary" href={"/pelayanan-publik/survei/" + row.id}>
                        Detail & Pertanyaan
                      </ButtonLink>
                      {data.canUpdate ? (
                        <ButtonLink
                          variant="secondary"
                          href={"/pelayanan-publik/survei/" + row.id + "/edit"}
                        >
                          Ubah
                        </ButtonLink>
                      ) : null}
                      {data.canDelete ? (
                        <DialogHapusForm
                          aksi={hapusSurveiAction}
                          id={row.id}
                          judul={`Hapus survei "${row.judul}"?`}
                          keterangan="Survei, pertanyaan, dan jawaban responden akan dihapus permanen."
                          labelAksi="Hapus survei"
                        />
                      ) : null}
                    </div>
                  </Cell>
                </Row>
              ))}
            </TBody>
          </Table>
        </TableScroll>
        {data.rows.length === 0 ? (
          <p className="modul-empty">
            Belum ada survei. Buat survei pertama untuk mulai mengumpulkan penilaian masyarakat.
          </p>
        ) : null}
        <p className="modul-empty">Menampilkan {data.rows.length} survei.</p>
      </TableCard>
      <section className="modul-card" id="ulasan">
        <h2>Ulasan & Saran Masyarakat</h2>
        {comments.length ? (
          <div className="survey-comments">
            {comments.map((item, index) => (
              <article key={index}>
                <strong>
                  {item.judul} · {item.pertanyaan}
                </strong>
                <p>{item.jawaban}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="modul-empty">Belum ada ulasan atau saran teks.</p>
        )}
      </section>
    </div>
  );
}
