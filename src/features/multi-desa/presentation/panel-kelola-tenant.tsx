"use client";

import { useActionState, useId } from "react";

import type { HasilEkspor } from "@/features/multi-desa/infrastructure/lifecycle-tenant-repository";
import { createIdleActionState } from "@/lib/action-state";

import { DialogFormTenant } from "./dialog-form-tenant";
import { KelolaDomain } from "./kelola-domain-tenant";
import type { AksiKonsol, DesaKonsolRow, DomainKonsolRow } from "./kontrak-konsol-tenant";
import { Pesan } from "./pesan-aksi-tenant";
import { ResetAksesAdmin } from "./reset-akses-admin-tenant";

export const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
export const angka = new Intl.NumberFormat("id-ID");

/**
 * Panel lifecycle satu tenant: status/akses, domain, kuota, ekspor, dan purge.
 *
 * Setiap form memakai `useActionState` sendiri supaya kegagalan satu aksi tidak
 * mengosongkan form lain.
 */
export function PanelKelola({
  desa,
  domain,
  aksi,
}: {
  desa: DesaKonsolRow;
  domain: DomainKonsolRow[];
  aksi: AksiKonsol;
}) {
  const id = useId();
  const [statusState, statusAction, statusPending] = useActionState(
    aksi.status,
    createIdleActionState<{ active: boolean }>(),
  );
  const [eksporState, eksporAction, eksporPending] = useActionState(
    aksi.ekspor,
    createIdleActionState<HasilEkspor>(),
  );

  const sudahPurge = desa.statusRetensi === "sudah-purge";
  const bolehPurge = desa.statusRetensi === "siap-purge" && desa.adaEksporBerlaku;

  return (
    <div className="tenant-panel">
      <div className="tenant-panel-grid">
        <section>
          <h4>Status dan akses</h4>
          <form action={statusAction} className="tenant-inline-form">
            <input type="hidden" name="villageId" value={desa.id} />
            <input type="hidden" name="active" value={desa.active ? "false" : "true"} />
            <button
              className="button button-secondary"
              type="submit"
              disabled={statusPending || sudahPurge}
            >
              {desa.active ? "Nonaktifkan desa" : "Aktifkan desa"}
            </button>
            <span className="form-help">
              {desa.active
                ? "Menonaktifkan memulai masa tenggang retensi 90 hari."
                : desa.nonaktifSejak
                  ? `Nonaktif sejak ${tanggal.format(new Date(desa.nonaktifSejak))}.`
                  : "Desa sedang nonaktif."}
            </span>
          </form>
          <Pesan state={statusState} />

          <ResetAksesAdmin aksi={aksi.reset} nonaktif={sudahPurge} villageId={desa.id} />
        </section>

        <KelolaDomain desa={desa} domain={domain} aksi={aksi} />

        <section>
          <h4>Kuota media</h4>
          <div className="tenant-panel-actions">
            <DialogFormTenant
              aksi={aksi.kuota}
              deskripsi="Batas penyimpanan media desa. Kosongkan untuk tanpa batas."
              judul="Kuota media"
              labelPending="Menyimpan..."
              labelPemicu="Ubah kuota"
              labelSubmit="Simpan kuota"
              nonaktif={sudahPurge}
              stateAwal={createIdleActionState<{ kuotaMediaMb: number | null }>()}
            >
              <input type="hidden" name="villageId" value={desa.id} />
              <label className="form-field" htmlFor={`${id}-kuota`}>
                <span className="form-label">Kuota (MB)</span>
                <input
                  id={`${id}-kuota`}
                  className="form-input"
                  name="kuotaMediaMb"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={desa.kuotaMediaMb ?? ""}
                  placeholder="Tanpa batas"
                />
              </label>
            </DialogFormTenant>
            <span className="form-help">
              {desa.kuotaMediaMb === null
                ? "Saat ini tanpa batas."
                : `Saat ini ${angka.format(desa.kuotaMediaMb)} MB.`}
            </span>
          </div>
        </section>

        <section>
          <h4>Ekspor data</h4>
          <p className="form-help">
            Ekspor wajib dibuat sebelum purge. Berkas berlaku 30 hari dan disimpan di luar database.
          </p>
          <form action={eksporAction} className="tenant-inline-form">
            <input type="hidden" name="villageId" value={desa.id} />
            <button
              className="button button-secondary"
              type="submit"
              disabled={eksporPending || sudahPurge}
            >
              {eksporPending ? "Mengekspor..." : "Buat ekspor data"}
            </button>
          </form>
          <Pesan state={eksporState} />
          {eksporState.status === "success" ? (
            <p className="form-help">
              Berkas: <code>{eksporState.data.berkas}</code> ·{" "}
              {angka.format(eksporState.data.ukuranByte)} byte · berlaku sampai{" "}
              {tanggal.format(new Date(eksporState.data.kedaluwarsaPada))}
            </p>
          ) : null}
        </section>

        <section>
          <h4>Purge permanen</h4>
          <p className="form-help">
            Menghapus seluruh data desa dan media. Yang tersisa hanya tombstone desa/domain,
            statistik agregat, catatan ekspor, dan audit log. Tindakan ini tidak dapat dibatalkan.
          </p>
          {sudahPurge ? (
            <p className="alert alert-info" role="status">
              Data desa ini sudah di-purge
              {desa.purgedAt ? ` pada ${tanggal.format(new Date(desa.purgedAt))}` : ""}.
            </p>
          ) : bolehPurge ? (
            <DialogFormTenant
              aksi={aksi.purge}
              deskripsi={
                <>
                  Data desa, pengguna, penduduk, dan media akan dihapus permanen. Tindakan ini tidak
                  dapat dibatalkan.
                </>
              }
              judul="Purge data desa"
              kelasPemicu="button tenant-danger"
              kelasSubmit="button tenant-danger"
              labelPending="Mem-purge..."
              labelPemicu="Purge data desa"
              labelSubmit="Purge permanen"
              pesanSukses={(data) => (
                <p className="form-help">
                  {angka.format(data.jumlahBarisDihapus)} baris pada{" "}
                  {angka.format(data.tabelDiproses)} tabel dihapus.
                  {data.mediaDihapus
                    ? " Media desa juga dihapus."
                    : " Tidak ada media yang perlu dihapus."}
                </p>
              )}
              tutupSetelahSukses={false}
              stateAwal={createIdleActionState<{
                jumlahBarisDihapus: number;
                tabelDiproses: number;
                mediaDihapus: boolean;
              }>()}
            >
              <input type="hidden" name="villageId" value={desa.id} />
              <label className="form-field">
                <span className="form-label">Ketik slug desa: {desa.slug ?? "—"}</span>
                <input
                  className="form-input"
                  name="konfirmasi"
                  required
                  autoComplete="off"
                  placeholder={desa.slug ?? ""}
                />
              </label>
            </DialogFormTenant>
          ) : (
            <p className="form-help">
              {!desa.active && !desa.adaEksporBerlaku
                ? "Buat ekspor data yang berlaku lebih dulu."
                : desa.active
                  ? "Nonaktifkan desa dan tunggu masa tenggang 90 hari."
                  : `Purge dapat dijalankan setelah masa tenggang selesai${
                      desa.hariMenujuPurge !== null
                        ? ` (${angka.format(desa.hariMenujuPurge)} hari lagi)`
                        : ""
                    }.`}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
