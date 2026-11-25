"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import type {
  PaketTenantRow,
  PilihanPaketTenantBaru,
} from "@/features/multi-desa/infrastructure/paket-langganan-repository";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { PlatformEmpty } from "./platform-ui";

interface HasilPenetapan {
  jumlahTenant: number;
}

type AksiPenetapan = (
  state: ActionState<HasilPenetapan>,
  formData: FormData,
) => Promise<ActionState<HasilPenetapan>>;

const angka = new Intl.NumberFormat("id-ID");

export function PaketPenetapanForm({
  tenants,
  packages,
  aksi,
}: {
  tenants: PaketTenantRow[];
  packages: PilihanPaketTenantBaru[];
  aksi: AksiPenetapan;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    aksi,
    createIdleActionState<HasilPenetapan>(),
  );
  const [selectedTenants, setSelectedTenants] = useState<Set<number>>(() => new Set());
  const [planVersionId, setPlanVersionId] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (state.status !== "success") return;
    setSelectedTenants(new Set());
    setConfirmed(false);
    router.refresh();
  }, [router, state]);

  function toggleTenant(id: number, checked: boolean) {
    setSelectedTenants((current) => {
      if (checked && current.size >= 500) return current;
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  if (tenants.length === 0) {
    return (
      <PlatformEmpty
        description="Belum ada tenant yang dapat menerima penetapan paket."
        title="Belum ada tenant"
      />
    );
  }

  if (packages.length === 0) {
    return (
      <PlatformEmpty
        description="Terbitkan versi paket aktif terlebih dahulu. Paket yang masih berupa draf tidak dapat ditetapkan ke tenant."
        title="Belum ada versi paket yang dapat dipilih"
      />
    );
  }

  const selectedPackage = packages.find((item) => String(item.versionId) === planVersionId);

  return (
    <form action={formAction} className="form-stack">
      <div className="platform-form-grid">
        <label className="form-field">
          <span className="form-label">Paket dan versi terbit</span>
          <select
            className="form-input"
            disabled={pending}
            name="planVersionId"
            onChange={(event) => setPlanVersionId(event.target.value)}
            required
            value={planVersionId}
          >
            <option value="">Pilih paket terbit</option>
            {packages.map((item) => (
              <option key={item.versionId} value={item.versionId}>
                {item.planName} ({item.planSlug}) · v{item.version}
              </option>
            ))}
          </select>
          <span className="form-help">
            Pilihan hanya menampilkan versi terbaru yang telah diterbitkan.
          </span>
        </label>
        <div className="form-field">
          <span className="form-label">Cakupan saat ini</span>
          <p className="form-help">
            {selectedTenants.size === 0
              ? "Pilih tenant yang akan menerima paket."
              : `${angka.format(selectedTenants.size)} tenant dipilih.`}
          </p>
        </div>
      </div>

      {state.status === "error" ? (
        <p className="alert alert-error" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="alert alert-info" role="status">
          {state.message}
        </p>
      ) : null}

      <div className="tenant-table-scroll">
        <table className="tenant-table tenant-table-list">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Pilih tenant</span>
              </th>
              <th scope="col">Tenant</th>
              <th scope="col">Status tenant</th>
              <th scope="col">Penetapan sekarang</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const label = tenant.name ?? `Desa #${tenant.villageId}`;
              const isSelected = selectedTenants.has(tenant.villageId);
              return (
                <tr key={tenant.villageId}>
                  <td>
                    <input
                      aria-label={`Pilih ${label}`}
                      checked={isSelected}
                      disabled={pending || (!isSelected && selectedTenants.size >= 500)}
                      name="villageIds"
                      onChange={(event) => toggleTenant(tenant.villageId, event.target.checked)}
                      type="checkbox"
                      value={tenant.villageId}
                    />
                  </td>
                  <td>
                    <strong>{label}</strong>
                    {tenant.code ? <div className="tenant-secondary">{tenant.code}</div> : null}
                  </td>
                  <td>
                    <span
                      className={
                        tenant.active ? "tenant-status is-active" : "tenant-status is-inactive"
                      }
                    >
                      <span aria-hidden="true" />
                      {tenant.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    {tenant.planVersionId ? (
                      <span>
                        {tenant.planName ?? tenant.planSlug ?? "Paket"}
                        {tenant.planVersion ? ` · v${tenant.planVersion}` : ""}
                      </span>
                    ) : (
                      <span className="tenant-secondary">Belum ditetapkan</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="form-stack">
        <p className="form-help">
          {selectedPackage
            ? `Paket ${selectedPackage.planName} v${selectedPackage.version} akan ditetapkan kepada ${angka.format(selectedTenants.size)} tenant yang dipilih. Tenant di luar pilihan tidak berubah.`
            : "Pilih versi paket dan tenant untuk melihat cakupan penetapan."}
        </p>
        <p className="form-help">
          Penetapan dapat mengubah modul yang dapat diakses tenant. Data tenant tetap tersimpan dan
          tidak dihapus.
        </p>
        <label className="form-field">
          <span>
            <input
              checked={confirmed}
              disabled={pending || selectedTenants.size === 0 || !selectedPackage}
              name="confirmed"
              onChange={(event) => setConfirmed(event.target.checked)}
              required
              type="checkbox"
              value="on"
            />{" "}
            Saya memahami hanya {angka.format(selectedTenants.size)} tenant yang dipilih akan
            menerima
            {selectedPackage
              ? ` ${selectedPackage.planName} v${selectedPackage.version}`
              : " paket ini"}
            .
          </span>
        </label>

        <div className="platform-row-actions">
          <span className="form-help" aria-live="polite">
            {angka.format(selectedTenants.size)} dari {angka.format(tenants.length)} tenant dipilih
            {selectedTenants.size === 500 ? " · batas maksimum 500 tenant per penetapan" : ""}
          </span>
          <button
            className="button button-primary"
            disabled={pending || selectedTenants.size === 0 || !selectedPackage || !confirmed}
            type="submit"
          >
            {pending ? "Menerapkan penetapan…" : "Konfirmasi penetapan"}
          </button>
        </div>
      </div>
    </form>
  );
}
