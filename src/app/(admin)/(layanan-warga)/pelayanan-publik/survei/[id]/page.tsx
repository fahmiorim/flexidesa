import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/shell/page-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { TableCard } from "@/components/ui/table-card";
import { getSurveiDetailData } from "@/features/layanan-warga/pelayanan/application/survei-use-cases";

import { hapusSoalSurveiAction } from "../actions";
import { simpanSoalSurveiFormAction } from "./form-actions";

function pilihanText(value: string | null, skor: string | null) {
  if (!value) return "";
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return "";
    let scoreMap: Record<string, number> = {};
    try {
      const scoreParsed: unknown = skor ? JSON.parse(skor) : {};
      if (scoreParsed && typeof scoreParsed === "object" && !Array.isArray(scoreParsed))
        scoreMap = scoreParsed as Record<string, number>;
    } catch {
      /* skor belum dikonfigurasi */
    }
    return parsed
      .map((item) => String(item) + "|" + (scoreMap[String(item)] ?? ""))
      .join(String.fromCharCode(10));
  } catch {
    return "";
  }
}
export const metadata: Metadata = { title: "Detail Survei" };

type SoalRow = Awaited<ReturnType<typeof getSurveiDetailData>>["questions"][number];

function formSoal(soal: SoalRow | null, surveyId: number) {
  return (
    <div className="modul-form-grid">
      <input name="surveyId" type="hidden" value={surveyId} />
      {soal ? <input name="questionId" type="hidden" value={soal.id} /> : null}
      <FormField
        containerClassName="form-field-full"
        defaultValue={soal?.pertanyaan ?? ""}
        kind="textarea"
        label="Pertanyaan"
        maxLength={2000}
        minLength={3}
        name="pertanyaan"
        required
        rows={3}
      />
      <FormField
        defaultValue={soal?.tipe ?? "text"}
        kind="select"
        label="Tipe jawaban"
        name="tipe"
        options={[
          { value: "text", label: "Teks" },
          { value: "number", label: "Angka" },
          { value: "choice", label: "Pilihan ganda" },
        ]}
      />
      <FormField
        defaultValue={String(soal?.bobot ?? 1)}
        label="Bobot (1–100)"
        max={100}
        min={1}
        name="bobot"
        type="number"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={soal ? pilihanText(soal.pilihan, soal.skorPilihan) : ""}
        helpText="Satu opsi per baris, format Label|Skor (contoh: Puas|5)."
        kind="textarea"
        label="Opsi pilihan dan skor"
        name="pilihan"
        rows={4}
      />
    </div>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ soal?: string }>;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const [data, query] = await Promise.all([getSurveiDetailData(id), searchParams]);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>{data.row.judul}</>}
        deskripsi={
          <>{data.row.deskripsi ?? "Kelola pertanyaan dan pantau partisipasi responden."}</>
        }
        aksi={
          <>
            <div className="page-heading-actions">
              <ButtonLink variant="secondary" href="/pelayanan-publik/survei">
                Kembali
              </ButtonLink>
              {data.canUpdate ? (
                <ButtonLink variant="secondary" href={"/pelayanan-publik/survei/" + id + "/edit"}>
                  Ubah Survei
                </ButtonLink>
              ) : null}
              <ButtonLink variant="primary" href={"/pelayanan-publik/survei/" + id + "/hasil"}>
                Lihat Hasil & IKM
              </ButtonLink>
            </div>
          </>
        }
      />
      {query.soal === "tersimpan" ? (
        <div className="alert alert-info">Pertanyaan berhasil disimpan.</div>
      ) : null}
      {query.soal === "dihapus" ? (
        <div className="alert alert-info">Pertanyaan berhasil dihapus.</div>
      ) : null}
      <div className="dashboard-stats">
        <article className="modul-card">
          <span>Status</span>
          <strong>{data.row.aktif === 1 ? "Aktif" : "Nonaktif"}</strong>
          <small>Publikasi survei</small>
        </article>
        <article className="modul-card">
          <span>Responden</span>
          <strong>{data.totalResponden}</strong>
          <small>Jawaban masuk</small>
        </article>
        <article className="modul-card">
          <span>Pertanyaan</span>
          <strong>{data.questions.length}</strong>
          <small>Item dalam formulir</small>
        </article>
        <article className="modul-card">
          <span>Periode</span>
          <strong style={{ fontSize: 16 }}>
            {data.row.mulai ?? "Bebas"} – {data.row.selesai ?? "Bebas"}
          </strong>
          <small>{data.row.sasaran ?? "Semua masyarakat"}</small>
        </article>
      </div>
      <TableCard
        actions={
          data.canUpdate ? (
            <FormDialog
              aksi={simpanSoalSurveiFormAction}
              deskripsi="Pertanyaan baru muncul di urutan terakhir formulir survei."
              judul="Tambah pertanyaan"
              label="+ Tambah Pertanyaan"
              labelSimpan="Simpan pertanyaan"
            >
              {formSoal(null, id)}
            </FormDialog>
          ) : null
        }
        description={
          data.questions.length
            ? `${data.questions.length} pertanyaan · ${data.totalResponden} responden`
            : "Belum ada pertanyaan untuk survei ini."
        }
        title="Daftar Pertanyaan"
      >
        {data.questions.length ? (
          data.questions.map((q) => (
            <article className="survey-question" key={q.id}>
              <div>
                <strong>
                  {q.urutan ?? 0}. {q.pertanyaan}
                </strong>
                <p>
                  {q.tipe === "choice"
                    ? "Pilihan: " +
                      pilihanText(q.pilihan, q.skorPilihan)
                        .split(String.fromCharCode(10))
                        .join(" · ")
                    : q.tipe === "number"
                      ? "Jawaban angka"
                      : "Jawaban teks"}{" "}
                  · Bobot {q.bobot}
                </p>
              </div>
              {data.canUpdate ? (
                <FormDialog
                  aksi={simpanSoalSurveiFormAction}
                  deskripsi={`Ubah pertanyaan nomor ${q.urutan ?? 0}.`}
                  judul="Ubah pertanyaan"
                  label="Ubah"
                  labelSimpan="Simpan perubahan"
                  varian="secondary"
                >
                  {formSoal(q, id)}
                </FormDialog>
              ) : null}
              {data.canDelete ? (
                <DialogHapusForm
                  aksi={hapusSoalSurveiAction}
                  hidden={{ surveyId: id, questionId: q.id }}
                  judul={`Hapus pertanyaan "${q.pertanyaan}"?`}
                  keterangan="Pertanyaan dan jawaban responden yang terkait akan dihapus permanen."
                  labelAksi="Hapus pertanyaan"
                />
              ) : null}
            </article>
          ))
        ) : (
          <p className="modul-empty">Belum ada pertanyaan untuk survei ini.</p>
        )}
      </TableCard>
    </div>
  );
}
