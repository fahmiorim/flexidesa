import type { ReactNode } from "react";

import { FotoPerangkat, namaLengkap, type PerangkatPemerintahan } from "./bagian-pemerintahan";
import styles from "./pemerintahan.module.css";

export function StrukturOrganisasi({
  perangkat,
  kepalaDesa,
  desaId,
}: {
  perangkat: PerangkatPemerintahan[];
  kepalaDesa: PerangkatPemerintahan | undefined;
  desaId: number;
}) {
  const anakPerangkat = (atasanId: number) =>
    perangkat
      .filter((item) => item.atasanId === atasanId)
      .sort((a, b) => a.urut - b.urut || a.nama.localeCompare(b.nama, "id"));
  const akarStruktur = perangkat
    .filter(
      (item) =>
        item.id === kepalaDesa?.id ||
        !item.atasanId ||
        !perangkat.some((parent) => parent.id === item.atasanId),
    )
    .sort((a, b) => (a.id === kepalaDesa?.id ? -1 : b.id === kepalaDesa?.id ? 1 : a.urut - b.urut));
  const renderNode = (
    item: PerangkatPemerintahan,
    depth = 0,
    visited = new Set<number>(),
  ): ReactNode => {
    if (visited.has(item.id)) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(item.id);
    const children = anakPerangkat(item.id).filter((child) => !nextVisited.has(child.id));
    return (
      <article className={styles.orgChild} key={item.id} data-depth={depth}>
        <span className={styles.orgIcon}>♙</span>
        <strong>{item.jabatan ?? "Perangkat Desa"}</strong>
        <span>{namaLengkap(item)}</span>
        {children.length ? (
          <div className={styles.orgNestedChildren}>
            {children.map((child) => renderNode(child, depth + 1, nextVisited))}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <section className={styles.orgPanel} id="struktur">
      <div className={styles.sectionHeading}>
        <h2>
          <span>♧</span> Struktur Organisasi Pemerintahan Desa
        </h2>
        <span className={styles.sectionHint}>Data aparatur aktif</span>
      </div>
      {perangkat.length ? (
        <div className={styles.orgCanvas}>
          {kepalaDesa ? (
            <div className={styles.orgRoot}>
              <FotoPerangkat item={kepalaDesa} desaId={desaId} className={styles.orgPhoto} />
              <div>
                <strong>{namaLengkap(kepalaDesa)}</strong>
                <span>{kepalaDesa.jabatan}</span>
              </div>
            </div>
          ) : (
            <div className={styles.orgEmpty}>
              Kepala Desa belum tercatat sebagai perangkat aktif.
            </div>
          )}
          {akarStruktur.some((item) => item.id !== kepalaDesa?.id) ? (
            <div className={styles.orgLine} aria-hidden="true" />
          ) : null}
          <div className={styles.orgChildren}>
            {(kepalaDesa ? anakPerangkat(kepalaDesa.id) : akarStruktur).map((item) =>
              renderNode(item),
            )}
          </div>
          {kepalaDesa
            ? akarStruktur
                .filter((item) => item.id !== kepalaDesa.id)
                .map((item) => renderNode(item))
            : null}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Struktur organisasi belum tersedia</strong>
          <p>
            Data perangkat desa yang telah dipublikasikan akan ditampilkan dalam bagan organisasi.
          </p>
        </div>
      )}
    </section>
  );
}
