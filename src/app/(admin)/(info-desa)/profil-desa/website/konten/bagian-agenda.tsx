import { type getWebsiteContentData } from "@/features/info-desa/publik/application/website-admin";

import {
  hapusAgendaWebsiteAction,
  tambahAgendaWebsiteAction,
  ubahAgendaWebsiteAction,
  ubahStatusAgendaWebsiteAction,
} from "../actions";
import { WebsiteSection } from "../website-admin-shell";

type DataKonten = Awaited<ReturnType<typeof getWebsiteContentData>>;

interface Props {
  izin: DataKonten["izin"];
  agenda: DataKonten["agenda"];
  formatTanggal: (value: Date | string | null) => string;
}

/** Bagian agenda kegiatan Website. */
export function BagianAgenda({ izin, agenda, formatTanggal }: Props) {
  return (
    <WebsiteSection title="Agenda Kegiatan">
      <div id="agenda" className="website-table-wrap">
        <table className="website-table website-table-agenda">
          <thead>
            <tr>
              <th>Kegiatan</th>
              <th>Tanggal</th>
              <th>Lokasi</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {agenda.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.judul}</strong>
                  <small>{item.kategori}</small>
                </td>
                <td>
                  {formatTanggal(item.mulai)}
                  {item.selesai && item.selesai !== item.mulai
                    ? ` – ${formatTanggal(item.selesai)}`
                    : ""}
                </td>
                <td>{item.lokasi ?? "—"}</td>
                <td>
                  <span
                    className={item.tayang ? "website-status" : "website-status website-status-off"}
                  >
                    {item.tayang ? "Tayang" : "Disimpan"}
                  </span>
                </td>
                <td>
                  {(izin.agenda.ubah || izin.agenda.hapus) && (
                    <div className="website-row-actions">
                      {izin.agenda.ubah && (
                        <details>
                          <summary className="website-mini-button">Edit</summary>
                          <form action={ubahAgendaWebsiteAction} className="website-inline-form">
                            <input type="hidden" name="id" value={item.id} />
                            <label>
                              Nama kegiatan
                              <input
                                name="judulAgenda"
                                defaultValue={item.judul}
                                required
                                maxLength={200}
                              />
                            </label>
                            <label>
                              Kategori
                              <input name="kategoriAgenda" defaultValue={item.kategori} />
                            </label>
                            <label>
                              Tanggal mulai
                              <input
                                type="date"
                                name="mulaiAgenda"
                                defaultValue={String(item.mulai).slice(0, 10)}
                                required
                              />
                            </label>
                            <label>
                              Tanggal selesai
                              <input
                                type="date"
                                name="selesaiAgenda"
                                defaultValue={item.selesai ? String(item.selesai).slice(0, 10) : ""}
                              />
                            </label>
                            <label>
                              Jam mulai
                              <input
                                type="time"
                                name="jamMulai"
                                defaultValue={item.jamMulai ?? ""}
                              />
                            </label>
                            <label>
                              Jam selesai
                              <input
                                type="time"
                                name="jamSelesai"
                                defaultValue={item.jamSelesai ?? ""}
                              />
                            </label>
                            <label>
                              Lokasi
                              <input name="lokasiAgenda" defaultValue={item.lokasi ?? ""} />
                            </label>
                            <label>
                              Deskripsi
                              <textarea
                                name="deskripsiAgenda"
                                defaultValue={item.deskripsi ?? ""}
                              />
                            </label>
                            <button className="website-mini-button" type="submit">
                              Simpan Perubahan
                            </button>
                          </form>
                        </details>
                      )}
                      {izin.agenda.ubah && (
                        <form action={ubahStatusAgendaWebsiteAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="tayang" value={String(!item.tayang)} />
                          <button className="website-mini-button" type="submit">
                            {item.tayang ? "Sembunyikan" : "Tayangkan"}
                          </button>
                        </form>
                      )}
                      {izin.agenda.hapus && (
                        <form action={hapusAgendaWebsiteAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="website-mini-button is-danger" type="submit">
                            Hapus
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {agenda.length === 0 ? <p className="modul-empty">Belum ada agenda kegiatan.</p> : null}
      </div>
      {izin.agenda.tambah && (
        <form action={tambahAgendaWebsiteAction} className="website-inline-form">
          <strong>＋ Tambah Agenda</strong>
          <div className="website-form-grid">
            <label>
              Nama Kegiatan *<input name="judulAgenda" required maxLength={200} />
            </label>
            <label>
              Kategori
              <input name="kategoriAgenda" maxLength={50} defaultValue="umum" />
            </label>
            <label>
              Tanggal Mulai *<input name="mulaiAgenda" type="date" required />
            </label>
            <label>
              Tanggal Selesai
              <input name="selesaiAgenda" type="date" />
            </label>
            <label>
              Jam Mulai
              <input name="jamMulai" type="time" />
            </label>
            <label>
              Jam Selesai
              <input name="jamSelesai" type="time" />
            </label>
            <label>
              Lokasi
              <input name="lokasiAgenda" maxLength={200} />
            </label>
            <label className="span-two">
              Deskripsi
              <textarea name="deskripsiAgenda" rows={3} />
            </label>
            <label className="website-checkbox">
              <input name="tayangAgenda" type="checkbox" /> Tampilkan di website publik
            </label>
          </div>
          <button className="website-button website-button-primary" type="submit">
            Simpan Agenda
          </button>
        </form>
      )}
    </WebsiteSection>
  );
}
