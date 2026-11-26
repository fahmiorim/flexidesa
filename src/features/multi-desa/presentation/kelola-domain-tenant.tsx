"use client";

import { useActionState } from "react";

import { createIdleActionState } from "@/lib/action-state";

import { DialogFormTenant } from "./dialog-form-tenant";
import type { AksiKonsol, DesaKonsolRow, DomainKonsolRow } from "./kontrak-konsol-tenant";
import { Pesan } from "./pesan-aksi-tenant";

/**
 * Kontrol domain dan alias milik satu tenant.
 *
 * Hanya mengurus pemilihan domain utama, penghapusan alias, dan penambahan
 * domain. Status/akses, kuota, ekspor, dan purge tetap di panel lifecycle.
 */
export function KelolaDomain({
  desa,
  domain,
  aksi,
}: {
  desa: DesaKonsolRow;
  domain: DomainKonsolRow[];
  aksi: AksiKonsol;
}) {
  const [hapusState, hapusAction, hapusPending] = useActionState(
    aksi.hapusDomain,
    createIdleActionState<null>(),
  );
  const [utamaState, utamaAction, utamaPending] = useActionState(
    aksi.jadikanUtama,
    createIdleActionState<null>(),
  );

  const daftar = domain
    .filter((item) => item.villageId === desa.id)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.id - b.id);
  const sudahPurge = desa.statusRetensi === "sudah-purge";

  return (
    <section className="tenant-panel-wide">
      <h4>Domain dan alias</h4>
      <p className="form-help">
        Domain utama dipakai untuk mengenali tenant dari host dan tidak dapat dihapus langsung.
        Untuk menggantinya: tambahkan domain baru, klik <strong>Ganti domain utama</strong> pada
        domain tersebut, lalu hapus domain lama yang sudah menjadi alias. Alias lain hanya mengarah
        ke desa yang sama.
      </p>

      {daftar.length === 0 ? (
        <p className="form-help">Belum ada domain terdaftar untuk desa ini.</p>
      ) : (
        <ul className="tenant-domain-list">
          {daftar.map((item) => (
            <li key={item.id} className="tenant-domain-item">
              <span className="tenant-domain-name">{item.domain}</span>
              {item.isPrimary ? (
                <span className="tenant-domain-actions">
                  <span className="tenant-status is-active">
                    <span aria-hidden="true" />
                    Utama
                  </span>
                  <span className="form-help">Host aktif desa ini</span>
                </span>
              ) : (
                <span className="tenant-domain-actions">
                  <form action={utamaAction}>
                    <input type="hidden" name="villageId" value={desa.id} />
                    <input type="hidden" name="domainId" value={item.id} />
                    <button
                      aria-label={`Ganti domain utama ke ${item.domain}`}
                      className="button button-secondary tenant-expand"
                      type="submit"
                      disabled={utamaPending || sudahPurge}
                    >
                      Ganti domain utama
                    </button>
                  </form>
                  <form action={hapusAction}>
                    <input type="hidden" name="villageId" value={desa.id} />
                    <input type="hidden" name="domainId" value={item.id} />
                    <button
                      className="button button-secondary tenant-expand"
                      type="submit"
                      disabled={hapusPending || sudahPurge}
                    >
                      Hapus
                    </button>
                  </form>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {daftar.length === 1 && !sudahPurge ? (
        <p className="form-help">
          Desa ini baru memiliki satu domain. Tambahkan domain pengganti lebih dulu untuk bisa
          memindahkan status utama tanpa menghapus domain yang sekarang.
        </p>
      ) : null}

      <div className="tenant-panel-actions">
        <DialogFormTenant
          aksi={aksi.tambahDomain}
          deskripsi="Domain baru langsung mengarah ke desa ini. Domain pertama otomatis menjadi utama."
          judul="Tambah domain atau alias"
          labelPending="Menambah..."
          labelPemicu="Tambah domain"
          labelSubmit="Tambah domain"
          nonaktif={sudahPurge}
          stateAwal={createIdleActionState<{ id: number }>()}
        >
          <input type="hidden" name="villageId" value={desa.id} />
          <label className="form-field">
            <span className="form-label">Domain atau alias</span>
            <input
              className="form-input"
              name="domain"
              required
              maxLength={255}
              autoComplete="off"
              placeholder="desa-sukamaju.id"
            />
          </label>
        </DialogFormTenant>
        <span className="form-help">
          {sudahPurge
            ? "Data desa sudah di-purge; domain hanya dapat dibaca."
            : "Gunakan host tanpa protokol, misalnya desa-sukamaju.id."}
        </span>
      </div>
      <Pesan state={hapusState} />
      <Pesan state={utamaState} />
    </section>
  );
}
