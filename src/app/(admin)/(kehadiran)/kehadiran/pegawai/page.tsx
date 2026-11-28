import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeading } from "@/components/shell/page-heading";
import { Button } from "@/components/ui/button";
import { DialogHapusForm } from "@/components/ui/dialog-hapus";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormField } from "@/components/ui/form-field";
import { Cell, HeaderCell, Row, Table, TableScroll, TBody, THead } from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import {
  daftarDokumenPegawai,
  daftarPegawai,
  daftarRiwayatPegawai,
  opsiPerangkatBelumTerhubung,
} from "@/features/kehadiran/kepegawaian/application/pegawai";
import { hasPermission } from "@/features/pengaturan/rbac/application/authorization";
import { verifySession } from "@/lib/dal";
import { mediaUrl } from "@/lib/media-url";

import styles from "../absensi-kepegawaian.module.css";
import {
  hapusDokumenPegawaiAction,
  hapusRiwayatPegawaiAction,
  tambahRiwayatPegawaiAction,
  ubahRiwayatPegawaiAction,
  unggahDokumenPegawaiAction,
} from "../actions";
import { simpanPegawaiFormAction } from "./form-actions";

export const metadata: Metadata = { title: "Data Pegawai" };

type PegawaiRow = Awaited<ReturnType<typeof daftarPegawai>>[number];
type PerangkatRow = Awaited<ReturnType<typeof opsiPerangkatBelumTerhubung>>[number];

/** Isi form pegawai, dipakai bersama dialog tambah dan dialog ubah agar field-nya identik. */
function formPegawai(pegawai: PegawaiRow | null, perangkat: PerangkatRow[]) {
  return (
    <div className="modul-form-grid">
      {pegawai ? <input name="id" type="hidden" value={pegawai.id} /> : null}
      <FormField defaultValue={pegawai?.nama ?? ""} label="Nama lengkap" name="nama" required />
      {pegawai ? (
        <input name="perangkatId" type="hidden" value={pegawai.perangkatId ?? ""} />
      ) : (
        <FormField
          defaultValue=""
          kind="select"
          label="Hubungkan perangkat desa"
          name="perangkatId"
          options={[
            { value: "", label: "Pegawai/staf baru" },
            ...perangkat.map((x) => ({
              value: String(x.id),
              label: `${x.nama} — ${x.jabatan ?? "Perangkat"}`,
            })),
          ]}
        />
      )}
      <FormField defaultValue={pegawai?.nip ?? ""} label="NIP" name="nip" />
      <FormField
        defaultValue={pegawai?.nik ?? ""}
        inputMode="numeric"
        label="NIK"
        maxLength={16}
        name="nik"
      />
      <FormField defaultValue={pegawai?.jabatan ?? ""} label="Jabatan" name="jabatan" />
      <FormField
        defaultValue={pegawai?.jenisKelamin ?? ""}
        kind="select"
        label="Jenis kelamin"
        name="jenisKelamin"
        options={[
          { value: "", label: "Pilih" },
          { value: "male", label: "Laki-laki" },
          { value: "female", label: "Perempuan" },
        ]}
      />
      <FormField
        defaultValue={pegawai?.tempatLahir ?? ""}
        label="Tempat lahir"
        name="tempatLahir"
      />
      <FormField
        defaultValue={pegawai?.tanggalLahir ?? ""}
        label="Tanggal lahir"
        name="tanggalLahir"
        type="date"
      />
      <FormField defaultValue={pegawai?.telepon ?? ""} label="Telepon" name="telepon" />
      <FormField defaultValue={pegawai?.email ?? ""} label="Email" name="email" type="email" />
      <FormField defaultValue={pegawai?.pendidikan ?? ""} label="Pendidikan" name="pendidikan" />
      <FormField
        defaultValue={pegawai?.statusPegawai ?? "tetap"}
        kind="select"
        label="Status pegawai"
        name="statusPegawai"
        options={[
          { value: "tetap", label: "Tetap" },
          { value: "kontrak", label: "Kontrak" },
          { value: "purna_tugas", label: "Purna tugas" },
        ]}
      />
      {pegawai ? (
        <FormField
          defaultValue={pegawai.status}
          kind="select"
          label="Status kepegawaian"
          name="status"
          options={[
            { value: "aktif", label: "Aktif" },
            { value: "nonaktif", label: "Nonaktif" },
          ]}
        />
      ) : (
        <input name="status" type="hidden" value="aktif" />
      )}
      <FormField
        defaultValue={pegawai?.tanggalMasuk ?? ""}
        label="Tanggal masuk"
        name="tanggalMasuk"
        type="date"
      />
      <FormField
        defaultValue={pegawai?.tanggalKeluar ?? ""}
        label="Tanggal keluar"
        name="tanggalKeluar"
        type="date"
      />
      <FormField
        containerClassName="form-field-full"
        defaultValue={pegawai?.alamat ?? ""}
        kind="textarea"
        label="Alamat"
        name="alamat"
        rows={2}
      />
    </div>
  );
}

export default async function PegawaiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selectedRaw = Array.isArray(params.id) ? params.id[0] : params.id;
  const query = Array.isArray(params.q) ? (params.q[0] ?? "") : (params.q ?? "");
  const statusFilter = Array.isArray(params.status)
    ? (params.status[0] ?? "")
    : (params.status ?? "");
  const jabatanFilter = Array.isArray(params.jabatan)
    ? (params.jabatan[0] ?? "")
    : (params.jabatan ?? "");
  const [pegawai, perangkat, user] = await Promise.all([
    daftarPegawai(),
    opsiPerangkatBelumTerhubung(),
    verifySession(),
  ]);
  const canManage = hasPermission(user.permissions, "data-pegawai", "update");
  const selected = pegawai.find((x) => x.id === Number(selectedRaw)) ?? pegawai[0] ?? null;
  const [riwayat, dokumen] = selected
    ? await Promise.all([daftarRiwayatPegawai(selected.id), daftarDokumenPegawai(selected.id)])
    : [[], []];
  const perangkatCount = pegawai.filter((x) => x.perangkatId !== null).length;
  const stafCount = pegawai.filter((x) => x.perangkatId === null).length;
  const kontrak = pegawai.filter((x) => x.statusPegawai === "kontrak").length;
  const purna = pegawai.filter((x) => x.statusPegawai === "purna_tugas").length;
  const filteredPegawai = pegawai.filter(
    (x) =>
      (!query ||
        [x.nama, x.nik, x.nip, x.jabatan].some((value) =>
          value?.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")),
        )) &&
      (!statusFilter || x.status === statusFilter) &&
      (!jabatanFilter || (x.jabatan ?? "") === jabatanFilter),
  );
  const jabatanOptions = [
    ...new Set(pegawai.map((x) => x.jabatan).filter((value): value is string => Boolean(value))),
  ].sort();
  const selectedPhoto = selected ? mediaUrl(selected.foto, selected.villageId) : null;
  const hitungMasaKerja = (mulai: string | null, selesai: string | null) => {
    if (!mulai) return "—";
    const start = new Date(mulai + "T00:00:00Z");
    const end = selesai ? new Date(selesai + "T00:00:00Z") : new Date();
    const months = Math.max(
      0,
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        end.getUTCMonth() -
        start.getUTCMonth(),
    );
    return `${Math.floor(months / 12)} thn ${months % 12} bln`;
  };
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Data Pegawai</>}
        deskripsi={<>Data pegawai dan riwayat kepegawaian.</>}
      />
      <section className={styles["ak-kpi-grid"]}>
        <article className={styles["ak-kpi"]}>
          <span>Total Pegawai</span>
          <strong>{pegawai.length} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Perangkat Desa</span>
          <strong>{perangkatCount} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Staf Desa</span>
          <strong>{stafCount} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Pegawai Kontrak</span>
          <strong>{kontrak} orang</strong>
        </article>
        <article className={styles["ak-kpi"]}>
          <span>Purna Tugas</span>
          <strong>{purna} orang</strong>
        </article>
      </section>
      <div id="daftar-pegawai" className={styles["ak-grid"]} style={{ marginTop: 16 }}>
        <TableCard
          actions={
            canManage ? (
              <FormDialog
                aksi={simpanPegawaiFormAction}
                deskripsi="Aparatur desa tersinkron otomatis; staf tambahan dapat didaftarkan di sini."
                judul="Tambah pegawai"
                label="+ Tambah Pegawai"
                labelSimpan="Simpan pegawai"
              >
                {formPegawai(null, perangkat)}
              </FormDialog>
            ) : null
          }
          description={`${pegawai.length} pegawai terdaftar.`}
          filter={
            <form className={styles["ak-filter"]} method="get">
              <input type="hidden" name="id" value={selected?.id ?? ""} />
              <label>
                Cari nama, NIK, atau jabatan
                <input type="search" name="q" placeholder="Cari pegawai..." defaultValue={query} />
              </label>
              <label>
                Jabatan
                <select name="jabatan" defaultValue={jabatanFilter}>
                  <option value="">Semua Jabatan</option>
                  {jabatanOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={statusFilter}>
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
              <Button className={styles["ak-button"]} type="submit">
                ⌕ Filter
              </Button>
            </form>
          }
          title="Daftar Data Pegawai"
        >
          <TableScroll className={styles["ak-table-wrap"]}>
            <Table className={styles["ak-table"]}>
              <THead>
                <Row>
                  <HeaderCell>No.</HeaderCell>
                  <HeaderCell>Nama</HeaderCell>
                  <HeaderCell>Jabatan</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Masa Kerja</HeaderCell>
                  <HeaderCell>Detail</HeaderCell>
                </Row>
              </THead>
              <TBody>
                {filteredPegawai.map((x, i) => (
                  <Row key={x.id}>
                    <Cell>{i + 1}</Cell>
                    <Cell>
                      <span className={styles["ak-person"]}>
                        <span>
                          {mediaUrl(x.foto, x.villageId) ? (
                            <Image
                              src={mediaUrl(x.foto, x.villageId)!}
                              alt=""
                              width={32}
                              height={32}
                              unoptimized
                            />
                          ) : (
                            x.nama
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()
                          )}
                        </span>
                        <b>{x.nama}</b>
                      </span>
                      <br />
                      <small>{x.nip ?? "NIP belum diisi"}</small>
                    </Cell>
                    <Cell>{x.jabatan ?? "—"}</Cell>
                    <Cell>
                      <span className={styles["ak-badge"]}>{x.statusPegawai}</span>
                    </Cell>
                    <Cell>{hitungMasaKerja(x.tanggalMasuk, x.tanggalKeluar)}</Cell>
                    <Cell>
                      <Link className={styles["ak-button"]} href={"/kehadiran/pegawai?id=" + x.id}>
                        Lihat
                      </Link>
                    </Cell>
                  </Row>
                ))}
              </TBody>
            </Table>
          </TableScroll>
          {!filteredPegawai.length ? (
            <div className={styles["ak-empty"]}>Tidak ada pegawai yang sesuai filter.</div>
          ) : null}
        </TableCard>
        <section id="detail-pegawai" className={styles["ak-card"]}>
          {selected ? (
            <>
              <div className={styles["ak-profile-head"]}>
                <div className={styles["ak-profile-avatar"]}>
                  {selectedPhoto ? (
                    <Image
                      src={selectedPhoto}
                      alt={"Foto " + selected.nama}
                      fill
                      unoptimized
                      sizes="84px"
                    />
                  ) : (
                    selected.nama
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <h2>{selected.nama}</h2>
                  <p>{selected.jabatan ?? "Jabatan belum ditentukan"}</p>
                  <span
                    className={`${styles["ak-badge"]} ${selected.status === "aktif" ? styles.aktif : styles.nonaktif}`}
                  >
                    {selected.status === "aktif" ? "Aktif" : "Nonaktif"} ·{" "}
                    {selected.statusPegawai.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
              <h3 id="biodata">Informasi Pribadi</h3>
              <dl>
                <div>
                  <dt>NIK</dt>
                  <dd>{selected.nik ?? "—"}</dd>
                </div>
                <div>
                  <dt>NIP</dt>
                  <dd>{selected.nip ?? "—"}</dd>
                </div>
                <div>
                  <dt>Tempat/Tanggal Lahir</dt>
                  <dd>
                    {selected.tempatLahir ?? "—"}, {selected.tanggalLahir ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>Telepon</dt>
                  <dd>{selected.telepon ?? "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{selected.email ?? "—"}</dd>
                </div>
                <div>
                  <dt>Pendidikan</dt>
                  <dd>{selected.pendidikan ?? "—"}</dd>
                </div>
                <div id="masa-kerja">
                  <dt>Masa Kerja</dt>
                  <dd>{hitungMasaKerja(selected.tanggalMasuk, selected.tanggalKeluar)}</dd>
                </div>
              </dl>
              {canManage ? (
                <FormDialog
                  aksi={simpanPegawaiFormAction}
                  deskripsi={`Ubah data kepegawaian ${selected.nama}.`}
                  judul="Ubah data pegawai"
                  key={`pegawai-${selected.id}`}
                  label="Edit Data Pegawai"
                  labelSimpan="Simpan perubahan"
                  varian="secondary"
                >
                  {formPegawai(selected, perangkat)}
                </FormDialog>
              ) : null}
              <h3 id="jabatan">Riwayat Jabatan</h3>
              <div id="riwayat">
                {riwayat.length ? (
                  <ul>
                    {riwayat.map((r) => (
                      <li key={r.id}>
                        {r.jabatan} · {r.mulai} – {r.selesai ?? "Sekarang"}{" "}
                        {canManage ? (
                          <>
                            <details>
                              <summary>Edit</summary>
                              <form action={ubahRiwayatPegawaiAction} className={styles["ak-form"]}>
                                <input type="hidden" name="id" value={r.id} />
                                <input type="hidden" name="pegawaiId" value={selected.id} />
                                <label>
                                  Jabatan
                                  <input name="jabatan" defaultValue={r.jabatan} required />
                                </label>
                                <label>
                                  Unit Kerja
                                  <input name="unitKerja" defaultValue={r.unitKerja ?? ""} />
                                </label>
                                <label>
                                  Nomor SK
                                  <input name="nomorSk" defaultValue={r.nomorSk ?? ""} />
                                </label>
                                <label>
                                  Mulai
                                  <input name="mulai" type="date" defaultValue={r.mulai} required />
                                </label>
                                <label>
                                  Selesai
                                  <input
                                    name="selesai"
                                    type="date"
                                    defaultValue={r.selesai ?? ""}
                                  />
                                </label>
                                <label className={styles.wide}>
                                  Keterangan
                                  <textarea name="keterangan" defaultValue={r.keterangan ?? ""} />
                                </label>
                                <Button className={styles["ak-button"]}>Simpan Riwayat</Button>
                              </form>
                            </details>
                            <DialogHapusForm
                              aksi={hapusRiwayatPegawaiAction}
                              id={r.id}
                              judul={`Hapus riwayat jabatan "${r.jabatan}"?`}
                              keterangan="Riwayat jabatan pegawai akan dihapus permanen."
                              labelAksi="Hapus riwayat"
                            />
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Belum ada riwayat jabatan.</p>
                )}
                {canManage ? (
                  <details>
                    <summary>Tambah Riwayat Jabatan</summary>
                    <form action={tambahRiwayatPegawaiAction} className={styles["ak-form"]}>
                      <input type="hidden" name="pegawaiId" value={selected.id} />
                      <label>
                        Jabatan
                        <input name="jabatan" required />
                      </label>
                      <label>
                        Unit Kerja
                        <input name="unitKerja" />
                      </label>
                      <label>
                        Nomor SK
                        <input name="nomorSk" />
                      </label>
                      <label>
                        Mulai
                        <input name="mulai" type="date" required />
                      </label>
                      <label>
                        Selesai
                        <input name="selesai" type="date" />
                      </label>
                      <label className={styles.wide}>
                        Keterangan
                        <textarea name="keterangan" />
                      </label>
                      <Button className={styles["ak-button"]}>Tambah Riwayat</Button>
                    </form>
                  </details>
                ) : null}
              </div>
              <h3 id="dokumen">Dokumen Pegawai</h3>
              {dokumen.length ? (
                <ul>
                  {dokumen.map((d) => (
                    <li key={d.id}>
                      <a href={"/api/kepegawaian/dokumen/" + d.id}>{d.judul}</a> · {d.kategori}{" "}
                      {canManage ? (
                        <DialogHapusForm
                          aksi={hapusDokumenPegawaiAction}
                          id={d.id}
                          judul={`Hapus dokumen "${d.judul}"?`}
                          keterangan="Dokumen pegawai beserta berkasnya akan dihapus permanen."
                          labelAksi="Hapus dokumen"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Belum ada dokumen.</p>
              )}
              {canManage ? (
                <details>
                  <summary>Unggah Dokumen</summary>
                  <form
                    action={unggahDokumenPegawaiAction}

                    className={styles["ak-form"]}
                  >
                    <input type="hidden" name="pegawaiId" value={selected.id} />
                    <label>
                      Judul Dokumen
                      <input name="judul" required />
                    </label>
                    <label>
                      Kategori
                      <select name="kategori">
                        <option value="sk">SK</option>
                        <option value="kontrak">Kontrak</option>
                        <option value="ijazah">Ijazah</option>
                        <option value="sertifikat">Sertifikat</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </label>
                    <label>
                      Nomor
                      <input name="nomor" />
                    </label>
                    <label>
                      Tanggal
                      <input type="date" name="tanggal" />
                    </label>
                    <label className={styles.wide}>
                      Berkas
                      <input
                        type="file"
                        name="berkas"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        required
                      />
                    </label>
                    <Button className={styles["ak-button"]}>Unggah Dokumen</Button>
                  </form>
                </details>
              ) : null}
            </>
          ) : (
            <div className={styles["ak-empty"]}>Belum ada data pegawai.</div>
          )}
        </section>
      </div>
    </div>
  );
}
