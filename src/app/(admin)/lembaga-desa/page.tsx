import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getLembagaDesaData } from "@/features/pemerintahan/application/use-cases";
import { hapusLembagaAction } from "@/features/pemerintahan/presentation/actions";
import { simpanLembagaFormAction } from "@/features/pemerintahan/presentation/form-actions";
import { FormDialog } from "@/features/pemerintahan/presentation/form-dialog";
import { KelolaKategoriDialog } from "@/features/pemerintahan/presentation/kelola-kategori-dialog";
import { PemilihPenduduk } from "@/features/pemerintahan/presentation/pemilih-penduduk";
import { urlMediaDesa } from "@/features/publik/application/media-url";

export const metadata = { title: "Lembaga Desa & BPD" };

const JENIS = ["bpd", "lpm", "pkk", "karang-taruna", "bumdes", "lainnya"] as const;

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0])
    .join("")
    .toUpperCase();

function idDari(nilai: string | string[] | undefined) {
  const angka = Number(typeof nilai === "string" ? nilai : "");
  return Number.isSafeInteger(angka) && angka > 0 ? angka : null;
}

function tautan(tambahan: Record<string, string | number> = {}) {
  const params = new URLSearchParams();
  for (const [kunci, nilai] of Object.entries(tambahan)) params.set(kunci, String(nilai));
  const query = params.toString();
  return query ? `/lembaga-desa?${query}` : "/lembaga-desa";
}

export default async function LembagaDesaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { rows: semuaRows, penduduk, master, akses } = await getLembagaDesaData();
  const namaKategori = (masterId: number | null) =>
    master.find((item) => item.id === masterId)?.nama ?? "";
  const namaPenduduk = new Map(penduduk.map((orang) => [orang.id, orang]));

  const rows = [...semuaRows].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  const active = semuaRows.filter((x) => x.status === "aktif");

  const lembagaEdit = semuaRows.find((row) => row.id === idDari(params.edit)) ?? null;

  return (
    <div className="modul-page pemerintahan-page pemerintahan-halaman lembaga-desa-page">
      <PageHeading>
        <header className="page-heading">
          <div>
            <h1>Lembaga Desa & BPD</h1>
            <p>Kelola lembaga desa dan BPD.</p>
          </div>
        </header>
      </PageHeading>

      <section aria-label="Daftar lembaga" className="pd-panel" id="daftar-lembaga">
        <div className="pd-panel-kepala">
          <div>
            <h2>Daftar Lembaga &amp; BPD</h2>
            <p>
              {active.length} lembaga aktif · {semuaRows.length - active.length} nonaktif.
            </p>
          </div>
          <div className="wilayah-toolbar">
            <div className="wilayah-toolbar-grup">
              <KelolaKategoriDialog
                bolehHapus={akses.hapus}
                bolehUbah={akses.ubah}
                kategori={master.map((item) => ({
                  ...item,
                  jumlahLembaga: semuaRows.filter((row) => row.masterId === item.id).length,
                }))}
                tombolClassName="wilayah-tool"
              />
              <Link className="wilayah-tool" href="/lembaga-desa/cetak">
                <span aria-hidden="true">⧉</span> Cetak
              </Link>
            </div>
            {akses.ubah ? (
              <FormDialog
                aksi={simpanLembagaFormAction}
                bukaAwal={Boolean(lembagaEdit)}
                deskripsi={
                  lembagaEdit ? "Perbarui data lembaga." : "Setiap lembaga wajib punya kategori."
                }
                judul={lembagaEdit ? `Ubah ${lembagaEdit.nama}` : "Tambah Lembaga"}
                key={lembagaEdit?.id ?? "baru"}
                label="Tambah Lembaga"
                labelSimpan={lembagaEdit ? "Simpan Perubahan" : "Tambah Lembaga"}
                tutupHref={lembagaEdit ? tautan() : undefined}
              >
                {master.length ? null : (
                  <p className="modul-hint">
                    Belum ada kategori lembaga. Tambahkan dulu lewat tombol “Kelola Kategori” pada
                    halaman ini, lalu simpan ulang.
                  </p>
                )}
                {lembagaEdit ? <input name="id" type="hidden" value={lembagaEdit.id} /> : null}

                <fieldset>
                  <legend>Identitas lembaga</legend>
                  <label>
                    Nama Lembaga
                    <input
                      defaultValue={lembagaEdit?.nama ?? ""}
                      maxLength={50}
                      name="nama"
                      placeholder="Badan Permusyawaratan Desa"
                      required
                    />
                  </label>
                  <label>
                    Kode Lembaga
                    <input
                      defaultValue={lembagaEdit?.kode ?? ""}
                      maxLength={16}
                      name="kode"
                      required
                    />
                  </label>
                  <label>
                    Kategori Lembaga
                    <select defaultValue={lembagaEdit?.masterId ?? ""} name="masterId" required>
                      <option value="">Pilih kategori</option>
                      {master.map((kategori) => (
                        <option key={kategori.id} value={kategori.id}>
                          {kategori.nama}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Jenis (tampilan publik)
                    <select defaultValue={lembagaEdit?.jenis ?? "bpd"} name="jenis">
                      {JENIS.map((k) => (
                        <option key={k} value={k}>
                          {k.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Legalitas &amp; masa bakti</legend>
                  <label>
                    Dasar Hukum
                    <input defaultValue={lembagaEdit?.dasarHukum ?? ""} name="dasarHukum" />
                  </label>
                  <label>
                    Nomor SK Pendirian
                    <input
                      defaultValue={lembagaEdit?.noSkPendirian ?? ""}
                      maxLength={255}
                      name="noSkPendirian"
                    />
                  </label>
                  <label>
                    Masa Bakti Mulai
                    <input
                      defaultValue={lembagaEdit?.masaBaktiMulai ?? ""}
                      name="masaBaktiMulai"
                      type="date"
                    />
                  </label>
                  <label>
                    Masa Bakti Selesai
                    <input
                      defaultValue={lembagaEdit?.masaBaktiSelesai ?? ""}
                      name="masaBaktiSelesai"
                      type="date"
                    />
                  </label>
                  <label>
                    Status
                    <select defaultValue={lembagaEdit?.status ?? "aktif"} name="status">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </label>
                </fieldset>

                <fieldset>
                  <legend>Pimpinan &amp; logo</legend>
                  <label>
                    Ketua
                    <PemilihPenduduk
                      defaultLabel={
                        (lembagaEdit?.ketuaResidentId
                          ? namaPenduduk.get(lembagaEdit.ketuaResidentId)?.nama
                          : "") ?? ""
                      }
                      defaultValue={lembagaEdit?.ketuaResidentId ?? null}
                      name="ketuaResidentId"
                    />
                  </label>
                  <label>
                    {lembagaEdit?.logo ? "Ganti Logo" : "Logo"}
                    <input
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      name="logoFile"
                      type="file"
                    />
                  </label>
                  {lembagaEdit?.logo ? (
                    <label className="pemerintahan-check">
                      <input name="hapusLogo" type="checkbox" /> Hapus logo saat ini
                    </label>
                  ) : null}
                </fieldset>

                <fieldset>
                  <legend>Profil publik</legend>
                  <label>
                    Deskripsi (maksimal 300 karakter)
                    <textarea
                      defaultValue={lembagaEdit?.deskripsi ?? ""}
                      maxLength={300}
                      name="deskripsi"
                    />
                  </label>
                  <label>
                    Tugas &amp; Fungsi
                    <textarea defaultValue={lembagaEdit?.tugasFungsi ?? ""} name="tugasFungsi" />
                  </label>
                  <label>
                    Urutan
                    <input defaultValue={lembagaEdit?.urut ?? 0} name="urut" type="number" />
                  </label>
                  <label className="pemerintahan-check">
                    <input
                      defaultChecked={lembagaEdit?.tampilPublik ?? false}
                      name="tampilPublik"
                      type="checkbox"
                    />{" "}
                    Tampilkan di website publik
                  </label>
                </fieldset>
              </FormDialog>
            ) : null}
          </div>
        </div>
        {semuaRows.length ? (
          <div className="modul-table-wrap">
            <table className="modul-table pemerintah-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Lembaga</th>
                  <th>Kategori</th>
                  <th>Ketua</th>
                  <th>Masa Bakti</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const logo = urlMediaDesa(row.logo, row.villageId);
                  const ketua = row.ketuaResidentId
                    ? namaPenduduk.get(row.ketuaResidentId)?.nama
                    : null;
                  return (
                    <tr
                      className={row.status === "aktif" ? undefined : "pemerintah-row-nonaktif"}
                      key={row.id}
                    >
                      <td>{index + 1}</td>
                      <td>
                        <div className="pemerintah-nama">
                          <span aria-hidden className="pd-aparat-avatar">
                            {logo ? (
                              <Image alt="" height={42} src={logo} unoptimized width={42} />
                            ) : (
                              inisial(row.nama)
                            )}
                          </span>
                          <div className="pemerintah-nama-isi">
                            <strong>{row.nama}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="pemerintah-jabatan">
                          {namaKategori(row.masterId) || "—"}
                        </strong>
                        <small className="pemerintah-jenis-jabatan">Kode {row.kode}</small>
                      </td>
                      <td>{ketua ?? "Belum ditetapkan"}</td>
                      <td>
                        {row.masaBaktiMulai ?? "—"} – {row.masaBaktiSelesai ?? "—"}
                      </td>
                      <td>
                        <span
                          className={`pd-chip ${row.status === "aktif" ? "is-aktif" : "is-nonaktif"}`}
                        >
                          {row.status === "aktif" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="pd-aparat-aksi">
                          {akses.ubah ? (
                            <Link className="button button-ghost" href={tautan({ edit: row.id })}>
                              Ubah
                            </Link>
                          ) : null}
                          {akses.hapus ? (
                            <form action={hapusLembagaAction}>
                              <input name="id" type="hidden" value={row.id} />
                              <ConfirmSubmit
                                className="button button-danger-ghost"
                                message={`Hapus lembaga ${row.nama}?`}
                              >
                                Hapus
                              </ConfirmSubmit>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">
            Belum ada lembaga desa. Tambahkan lewat tombol &ldquo;Tambah Lembaga&rdquo; di atas.
          </p>
        )}
      </section>
    </div>
  );
}
