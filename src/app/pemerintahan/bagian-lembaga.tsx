import Image from "next/image";
import Link from "next/link";

import {
  FotoPerangkat,
  mediaUrl,
  namaLengkap,
  tugasJabatan,
  type LembagaPemerintahan,
  type PerangkatPemerintahan,
} from "./bagian-pemerintahan";
import styles from "./pemerintahan.module.css";

export function PerangkatDesaSection({
  perangkat,
  desaId,
}: {
  perangkat: PerangkatPemerintahan[];
  desaId: number;
}) {
  return (
    <section className={styles.sectionCard} id="perangkat">
      <div className={styles.sectionHeading}>
        <div>
          <h2>
            <span>♧</span> Perangkat Desa
          </h2>
          <p>Daftar perangkat desa beserta jabatan dan tugasnya.</p>
        </div>
        <Link href="/perangkat">
          Lihat Detail Perangkat <b>→</b>
        </Link>
      </div>
      {perangkat.length ? (
        <div className={styles.officialGrid}>
          {perangkat.map((item) => (
            <Link href={`/perangkat/${item.id}`} className={styles.officialCard} key={item.id}>
              <FotoPerangkat item={item} desaId={desaId} className={styles.officialPhoto} />
              <div className={styles.officialBody}>
                <h3>{namaLengkap(item)}</h3>
                <span className={styles.rolePill}>{item.jabatan ?? "Perangkat Desa"}</span>
                <p>{tugasJabatan(item.jabatan)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Data perangkat desa belum dipublikasikan</strong>
          <p>
            Informasi aparatur akan muncul setelah pemerintah desa mempublikasikan data perangkat.
          </p>
        </div>
      )}
    </section>
  );
}

export function BpdSection({
  lembaga,
  desaId,
}: {
  lembaga: LembagaPemerintahan[];
  desaId: number;
}) {
  const bpd = lembaga.filter((item) => item.jenis === "bpd");
  return (
    <section className={styles.sectionCard} id="bpd">
      <div className={styles.sectionHeading}>
        <div>
          <h2>
            <span>♧</span> Badan Permusyawaratan Desa (BPD)
          </h2>
          <p>Lembaga permusyawaratan desa yang menyalurkan aspirasi masyarakat.</p>
        </div>
        <span className={styles.sectionHint}>Informasi BPD</span>
      </div>
      {bpd.length ? (
        bpd.map((item) => (
          <article className={styles.bpdContent} key={item.id}>
            <div>
              {mediaUrl(item.logo, desaId) ? (
                <div className={styles.officialPhoto}>
                  <Image
                    src={mediaUrl(item.logo, desaId)!}
                    alt={item.nama}
                    fill
                    unoptimized
                    sizes="100px"
                  />
                </div>
              ) : null}
              <h3>{item.nama}</h3>
              {item.deskripsi ? <p className={styles.bpdDescription}>{item.deskripsi}</p> : null}
              {item.tugasFungsi ? <p>{item.tugasFungsi}</p> : null}
              {item.dasarHukum ? <small>Dasar hukum: {item.dasarHukum}</small> : null}
              {item.dokumen.length ? (
                <ul>
                  {item.dokumen.map((doc) => (
                    <li key={doc.id}>
                      <a href={`/api/pemerintahan/dokumen/${doc.id}`}>{doc.judul}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p>
                Masa bakti: {item.masaBaktiMulai ?? "—"} – {item.masaBaktiSelesai ?? "—"}
              </p>
            </div>
            {item.anggota.length ? (
              <div className={styles.officialGrid}>
                {item.anggota.map((person) => (
                  <article className={styles.officialCard} key={person.id}>
                    <div className={styles.officialPhoto}>
                      {mediaUrl(person.foto, desaId) ? (
                        <Image
                          src={mediaUrl(person.foto, desaId)!}
                          alt={person.nama}
                          fill
                          unoptimized
                          sizes="100px"
                        />
                      ) : (
                        <span>{person.nama.slice(0, 1)}</span>
                      )}
                    </div>
                    <div className={styles.officialBody}>
                      <h3>{person.nama}</h3>
                      <span className={styles.rolePill}>{person.jabatan ?? "Anggota"}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>Susunan anggota belum dipublikasikan.</p>
            )}
          </article>
        ))
      ) : (
        <div className={styles.emptyState}>
          <strong>Data BPD belum dipublikasikan</strong>
          <p>
            Informasi BPD akan muncul setelah pemerintah desa mengaktifkan publikasi lembaga dan
            anggotanya.
          </p>
        </div>
      )}
    </section>
  );
}

export function LembagaDesaSection({
  lembaga,
  desaId,
}: {
  lembaga: LembagaPemerintahan[];
  desaId: number;
}) {
  const lainnya = lembaga.filter((item) => item.jenis !== "bpd");
  return (
    <section className={styles.sectionCard} id="lembaga">
      <div className={styles.sectionHeading}>
        <div>
          <h2>
            <span>♧</span> Lembaga Desa
          </h2>
          <p>Informasi kelembagaan yang mendukung penyelenggaraan pemerintahan desa.</p>
        </div>
      </div>
      {lainnya.length ? (
        <div className={styles.officialGrid}>
          {lainnya.map((item) => (
            <article className={styles.officialCard} key={item.id}>
              {mediaUrl(item.logo, desaId) ? (
                <div className={styles.officialPhoto}>
                  <Image
                    src={mediaUrl(item.logo, desaId)!}
                    alt={item.nama}
                    fill
                    unoptimized
                    sizes="100px"
                  />
                </div>
              ) : null}
              <div className={styles.officialBody}>
                <h3>{item.nama}</h3>
                <span className={styles.rolePill}>{item.jenis.toUpperCase()}</span>
                {item.deskripsi ? <p>{item.deskripsi}</p> : null}
                {item.tugasFungsi ? <p>{item.tugasFungsi}</p> : null}
                <small>
                  Masa bakti: {item.masaBaktiMulai ?? "—"} – {item.masaBaktiSelesai ?? "—"}
                </small>
                {item.anggota.length ? (
                  <ul>
                    {item.anggota.map((person) => (
                      <li key={person.id}>
                        {person.nama}
                        {person.jabatan ? ` — ${person.jabatan}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item.dokumen.length ? (
                  <ul>
                    {item.dokumen.map((doc) => (
                      <li key={doc.id}>
                        <a href={`/api/pemerintahan/dokumen/${doc.id}`}>{doc.judul}</a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <strong>Belum ada lembaga yang dipublikasikan</strong>
          <p>
            Data lembaga akan tampil setelah status publikasi diaktifkan oleh administrator desa.
          </p>
        </div>
      )}
    </section>
  );
}
