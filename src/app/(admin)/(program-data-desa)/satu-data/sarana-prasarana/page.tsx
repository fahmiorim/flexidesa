import type { Metadata } from "next";

import { PageHeading } from "@/components/shell/page-heading";
import { resolveVillageId } from "@/features/info-desa/desa/application/resolve-village";
import { aksesSaranaAdmin } from "@/features/info-desa/publik/application/konten-admin";
import { daftarSaranaPrasarana } from "@/features/info-desa/publik/application/konten-publik";
import { RESOURCES } from "@/features/pengaturan/rbac/domain/resources";
import { requirePermission } from "@/lib/dal";

import { hapusSarana, simpanSarana } from "./actions";

export const metadata: Metadata = { title: "Sarana & Prasarana" };
const categories = [
  ["pendidikan", "Pendidikan"],
  ["kesehatan", "Kesehatan"],
  ["ibadah", "Ibadah"],
  ["utilitas", "Utilitas"],
  ["transportasi", "Transportasi"],
  ["olahraga", "Olahraga"],
  ["sosial", "Sosial"],
  ["lainnya", "Lainnya"],
] as const;

export default async function SaranaPrasaranaAdminPage() {
  const user = await requirePermission(RESOURCES.saranaPrasarana, "read");
  const villageId = await resolveVillageId(user);
  const [rows, akses] = await Promise.all([
    daftarSaranaPrasarana(villageId, true),
    aksesSaranaAdmin(),
  ]);
  return (
    <div className="modul-page">
      <PageHeading
        judul={<>Sarana &amp; Prasarana</>}
        deskripsi={<>Kelola fasilitas umum desa untuk halaman profil publik.</>}
      />
      {akses.bolehTambah ? (
        <section className="modul-card">
          <h2>Tambah sarana/prasarana baru</h2>
          <form action={simpanSarana} className="sarana-admin-form">
            <label>
              Kategori
              <select name="kategori" required defaultValue="lainnya">
                {categories.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nama sarana/prasarana
              <input name="nama" required maxLength={200} placeholder="Contoh: Balai Desa" />
            </label>
            <label>
              Lokasi
              <input name="lokasi" maxLength={200} placeholder="Contoh: Dusun Krajan" />
            </label>
            <label>
              Keterangan
              <textarea name="keterangan" rows={3} maxLength={5000} />
            </label>
            <div className="potensi-checks">
              <label>
                <input type="checkbox" name="aktif" /> Publikasikan di website
              </label>
            </div>
            <button type="submit">Simpan Sarana/Prasarana</button>
          </form>
        </section>
      ) : null}
      <section className="modul-card">
        <h2>Daftar sarana/prasarana ({rows.length})</h2>
        {rows.length ? (
          <div className="modul-scroll">
            <table className="modul-table">
              <thead>
                <tr>
                  <th>Sarana/Prasarana</th>
                  <th>Kategori</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.nama}</strong>
                      <br />
                      <small>{row.keterangan ?? ""}</small>
                    </td>
                    <td>{categories.find(([id]) => id === row.kategori)?.[1] ?? row.kategori}</td>
                    <td>{row.lokasi ?? "—"}</td>
                    <td>{row.aktif ? "Dipublikasikan" : "Draft"}</td>
                    <td>
                      {akses.bolehUbah || akses.bolehHapus ? (
                        <details>
                          <summary>Edit</summary>
                          {akses.bolehUbah ? (
                            <form action={simpanSarana} className="sarana-admin-form">
                              <input type="hidden" name="id" value={row.id} />
                              <label>
                                Kategori
                                <select name="kategori" defaultValue={row.kategori}>
                                  {categories.map(([id, label]) => (
                                    <option key={id} value={id}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Nama sarana/prasarana
                                <input name="nama" defaultValue={row.nama} required />
                              </label>
                              <label>
                                Lokasi
                                <input name="lokasi" defaultValue={row.lokasi ?? ""} />
                              </label>
                              <label>
                                Keterangan
                                <textarea name="keterangan" defaultValue={row.keterangan ?? ""} />
                              </label>
                              <div className="potensi-checks">
                                <label>
                                  <input type="checkbox" name="aktif" defaultChecked={row.aktif} />{" "}
                                  Publikasikan
                                </label>
                              </div>
                              <button type="submit">Simpan Perubahan</button>
                            </form>
                          ) : null}
                          {akses.bolehHapus ? (
                            <form action={hapusSarana}>
                              <input type="hidden" name="id" value={row.id} />
                              <button type="submit">Hapus Sarana/Prasarana</button>
                            </form>
                          ) : null}
                        </details>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="modul-empty">
            Belum ada data sarana/prasarana. Tambahkan data menggunakan formulir di atas.
          </p>
        )}
      </section>
      <style>{`.sarana-admin-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sarana-admin-form label{display:grid;gap:5px;font-size:13px;font-weight:700}.sarana-admin-form input,.sarana-admin-form select,.sarana-admin-form textarea{width:100%;padding:9px;border:1px solid #d7dfed;border-radius:8px;font:inherit}.sarana-admin-form button,.modul-card details button{justify-self:start;padding:9px 15px;border:0;border-radius:8px;background:#6423e8;color:white;font-weight:800}.sarana-admin-form>button{grid-column:1/-1}@media(max-width:700px){.sarana-admin-form{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
