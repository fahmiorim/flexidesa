"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import type { FiturPaket } from "@/features/multi-desa/domain/paket-langganan";
import type {
  PaketTenantRow,
  PaketVersiDetail,
} from "@/features/multi-desa/infrastructure/paket-langganan-repository";
import { createIdleActionState, type ActionState } from "@/lib/action-state";

import { PlatformCard, PlatformEmpty } from "./platform-ui";

type HasilSimpan = { planId: number; versionId: number };
type HasilVersi = { id: number; version: number };
type HasilRollout = { jumlahTenant: number };
type Aksi<T> = (state: ActionState<T>, formData: FormData) => Promise<ActionState<T>>;
interface PreviewRollout {
  tenantCount: number;
  removedModuleSlugs: string[];
  removedFeatures: Array<{ slug: string; name: string }>;
}

type TenantTerkena = Pick<PaketTenantRow, "villageId" | "name" | "code">;

export function PaketDetailActions({
  planId,
  statusPaket,
  draft,
  published,
  features,
  preview,
  previewError,
  affectedTenants,
  simpanFiturAction,
  buatDrafAction,
  terbitkanAction,
  rolloutAction,
}: {
  planId: number;
  statusPaket: "active" | "archived";
  draft: PaketVersiDetail | null;
  published: PaketVersiDetail | null;
  features: FiturPaket[];
  preview: PreviewRollout | null;
  previewError: boolean;
  affectedTenants: TenantTerkena[];
  simpanFiturAction: Aksi<HasilSimpan>;
  buatDrafAction: Aksi<HasilVersi>;
  terbitkanAction: Aksi<HasilSimpan>;
  rolloutAction: Aksi<HasilRollout>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(draft?.moduleSlugs ?? []));
  const [confirmed, setConfirmed] = useState(false);
  const [saveState, saveFormAction, saving] = useActionState(
    simpanFiturAction,
    createIdleActionState<HasilSimpan>(),
  );
  const [draftState, draftFormAction, creatingDraft] = useActionState(
    buatDrafAction,
    createIdleActionState<HasilVersi>(),
  );
  const [publishState, publishFormAction, publishing] = useActionState(
    terbitkanAction,
    createIdleActionState<HasilSimpan>(),
  );
  const [rolloutState, rolloutFormAction, rollingOut] = useActionState(
    rolloutAction,
    createIdleActionState<HasilRollout>(),
  );

  useEffect(() => {
    if (saveState.status === "success") router.refresh();
  }, [router, saveState]);
  useEffect(() => {
    if (draftState.status === "success") router.refresh();
  }, [router, draftState]);
  useEffect(() => {
    if (publishState.status === "success") router.refresh();
  }, [router, publishState]);
  useEffect(() => {
    if (rolloutState.status === "success") router.refresh();
  }, [router, rolloutState]);

  const availableSlugs = new Set(features.map((feature) => feature.slug));
  const unsupportedSlugs = (draft?.moduleSlugs ?? []).filter((slug) => !availableSlugs.has(slug));
  const selectedSorted = [...selected].sort();
  const initialSorted = [...(draft?.moduleSlugs ?? [])].sort();
  const dirty =
    selectedSorted.length !== initialSorted.length ||
    selectedSorted.some((slug, index) => slug !== initialSorted[index]);
  const canEdit = statusPaket === "active";
  const groups = new Map<string, FiturPaket[]>();
  for (const feature of features) {
    const group = groups.get(feature.parentName) ?? [];
    group.push(feature);
    groups.set(feature.parentName, group);
  }

  function toggleFeature(slug: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  return (
    <>
      <PlatformCard
        description="Setiap draf menyimpan snapshot modul tersendiri. Perubahan draf tidak mengubah versi yang sedang dipakai tenant."
        title="Konfigurasi versi"
      >
        {draft ? (
          <form action={saveFormAction} className="form-stack">
            <input name="planId" type="hidden" value={planId} />
            <input name="versionId" type="hidden" value={draft.id} />
            <div className="ui-toolbar-actions">
              <strong>Draf v{draft.version}</strong>
              <span className="form-help">
                {selected.size} modul dipilih{dirty ? " · perubahan belum disimpan" : ""}
              </span>
            </div>

            {unsupportedSlugs.length > 0 ? (
              <div className="alert alert-error" role="alert">
                Draf ini menyimpan modul yang tidak lagi tersedia di katalog. Penyimpanan
                dinonaktifkan agar pilihan lama tidak terhapus. Modul:{" "}
                {unsupportedSlugs.map((slug) => (
                  <code key={slug}> {slug}</code>
                ))}
              </div>
            ) : null}

            {features.length === 0 ? (
              <PlatformEmpty
                description="Katalog belum memiliki modul aktif dengan halaman admin yang tersedia. Draf tidak dapat disunting sampai ada modul yang didukung."
                title="Belum ada modul yang dapat dipilih"
              />
            ) : (
              <div className="form-stack">
                {[...groups].map(([parentName, groupFeatures]) => (
                  <fieldset
                    className="form-stack"
                    disabled={!canEdit || unsupportedSlugs.length > 0}
                    key={parentName}
                  >
                    <legend className="form-label">{parentName}</legend>
                    {groupFeatures.map((feature) => (
                      <label className="form-field" key={feature.slug}>
                        <span>
                          <input
                            checked={selected.has(feature.slug)}
                            name="moduleSlugs"
                            onChange={(event) => toggleFeature(feature.slug, event.target.checked)}
                            type="checkbox"
                            value={feature.slug}
                          />{" "}
                          {feature.name}
                        </span>
                        <code className="form-help">{feature.slug}</code>
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            )}

            <label className="form-field">
              <span className="form-label">Catatan perubahan</span>
              <textarea className="form-input" maxLength={500} name="changelog" rows={3} />
              <span className="form-help">Opsional, maksimal 500 karakter.</span>
            </label>

            {canEdit ? null : (
              <p className="alert alert-info" role="status">
                Paket diarsipkan. Draf hanya dapat dilihat dan tidak dapat diubah atau diterbitkan.
              </p>
            )}
            {actionFeedback(saveState)}
            <div className="ui-toolbar-actions">
              <button
                className="button button-primary"
                disabled={
                  saving || !canEdit || features.length === 0 || unsupportedSlugs.length > 0
                }
                type="submit"
              >
                {saving ? "Menyimpan…" : "Simpan pilihan modul"}
              </button>
            </div>
          </form>
        ) : (
          <div className="form-stack">
            <PlatformEmpty
              description={
                published
                  ? `Versi v${published.version} tetap aktif untuk tenant yang sudah ditetapkan. Buat draf berikutnya untuk menyiapkan perubahan.`
                  : "Belum ada versi terbit. Buat draf untuk memilih modul sebelum publikasi pertama."
              }
              title="Tidak ada draf aktif"
            />
            {draftState.status === "error" ? (
              <p className="alert alert-error" role="alert">
                {draftState.message}
              </p>
            ) : null}
            {draftState.status === "success" ? (
              <p className="alert alert-info" role="status">
                {draftState.message}
              </p>
            ) : null}
            <form action={draftFormAction}>
              <input name="planId" type="hidden" value={planId} />
              <button
                className="button button-primary"
                disabled={creatingDraft || !canEdit || !published}
                type="submit"
              >
                {creatingDraft ? "Membuat draf…" : "Buat versi berikutnya"}
              </button>
            </form>
            {!published ? (
              <p className="form-help">
                Versi pertama dibuat saat identitas paket dibuat. Terbitkan draf pertama sebelum
                membuat versi berikutnya.
              </p>
            ) : null}
          </div>
        )}
      </PlatformCard>

      <div className="platform-split">
        <PlatformCard
          description="Publikasi menyediakan versi ini untuk tenant baru. Penetapan tenant yang sudah ada tidak berubah."
          title="Publikasikan versi"
        >
          {draft ? (
            <div className="form-stack">
              {publishState.status === "error" ? (
                <p className="alert alert-error" role="alert">
                  {publishState.message}
                </p>
              ) : null}
              {publishState.status === "success" ? (
                <p className="alert alert-info" role="status">
                  {publishState.message}
                </p>
              ) : null}
              <p className="form-help">
                Draf v{draft.version} berisi {draft.moduleSlugs.length} modul tersimpan. Simpan
                pilihan modul terlebih dahulu sebelum publikasi.
              </p>
              <form action={publishFormAction}>
                <input name="planId" type="hidden" value={planId} />
                <input name="versionId" type="hidden" value={draft.id} />
                <button
                  className="button button-primary"
                  disabled={
                    publishing ||
                    !canEdit ||
                    selected.size === 0 ||
                    dirty ||
                    unsupportedSlugs.length > 0
                  }
                  type="submit"
                >
                  {publishing ? "Menerbitkan…" : "Terbitkan untuk tenant baru"}
                </button>
              </form>
            </div>
          ) : (
            <p className="form-help">Tidak ada draf yang dapat diterbitkan.</p>
          )}
        </PlatformCard>

        <PlatformCard
          description="Rollout hanya menjangkau tenant yang saat ini memakai versi lain dari paket ini."
          title="Rollout ke tenant saat ini"
        >
          {!published ? (
            <p className="form-help">Belum ada versi terbit yang dapat di-rollout.</p>
          ) : previewError ? (
            <p className="alert alert-error" role="alert">
              Pratinjau rollout gagal dimuat. Rollout dinonaktifkan sampai cakupan perubahan dapat
              ditampilkan.
            </p>
          ) : preview ? (
            preview.tenantCount === 0 ? (
              <p className="form-help">
                Tidak ada tenant yang memakai versi lain dari paket ini. Tidak ada tenant yang akan
                terkena rollout.
              </p>
            ) : (
              <form action={rolloutFormAction} className="form-stack">
                <input name="planId" type="hidden" value={planId} />
                <input name="versionId" type="hidden" value={published.id} />

                <div className="alert alert-info" role="status">
                  <strong>{preview.tenantCount} tenant</strong> akan dipindahkan ke versi v
                  {published.version}.
                  {affectedTenants.length > 0 ? (
                    <ul>
                      {affectedTenants.map((tenant) => (
                        <li key={tenant.villageId}>
                          {tenant.name ?? `Desa #${tenant.villageId}`}
                          {tenant.code ? ` (${tenant.code})` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div>
                  <strong>Modul yang aksesnya akan dicabut</strong>
                  {preview.removedFeatures.length > 0 ? (
                    <ul>
                      {preview.removedFeatures.map((feature) => (
                        <li key={feature.slug}>
                          {feature.name} <code>({feature.slug})</code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="form-help">
                      Tidak ada modul yang akan dicabut dari akses tenant.
                    </p>
                  )}
                </div>

                <p className="form-help">
                  Data tenant tetap tersimpan. Rollout mengubah akses modul dan penetapan versi
                  saja; data yang sudah ada tidak dihapus.
                </p>
                <label className="form-field">
                  <span>
                    <input
                      checked={confirmed}
                      name="confirmed"
                      onChange={(event) => setConfirmed(event.target.checked)}
                      required
                      type="checkbox"
                      value="on"
                    />{" "}
                    Saya memahami rollout akan mengubah akses {preview.tenantCount} tenant yang
                    tercantum di atas.
                  </span>
                </label>
                {actionFeedback(rolloutState)}
                <button
                  className="button button-secondary"
                  disabled={rollingOut || !confirmed || !canEdit}
                  type="submit"
                >
                  {rollingOut ? "Menerapkan rollout…" : "Konfirmasi rollout"}
                </button>
              </form>
            )
          ) : (
            <p className="form-help">Pratinjau rollout belum tersedia.</p>
          )}
        </PlatformCard>
      </div>
    </>
  );
}

function actionFeedback<T>(state: ActionState<T>) {
  if (state.status === "error") {
    return (
      <p className="alert alert-error" role="alert">
        {state.message}
      </p>
    );
  }
  if (state.status === "success") {
    return (
      <p className="alert alert-info" role="status">
        {state.message}
      </p>
    );
  }
  return null;
}
