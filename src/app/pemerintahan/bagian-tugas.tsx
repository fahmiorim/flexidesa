import { fungsiUtama } from "./bagian-pemerintahan";
import styles from "./pemerintahan.module.css";

export function TugasFungsiSection() {
  return (
    <section className={styles.sectionCard} id="tugas">
      <div className={styles.sectionHeading}>
        <div>
          <h2>
            <span>▤</span> Tugas &amp; Fungsi Pemerintahan Desa
          </h2>
          <p>Gambaran fungsi utama unsur pemerintahan desa.</p>
        </div>
      </div>
      <div className={styles.functionGrid}>
        {fungsiUtama.map((item) => (
          <article className={styles.functionCard} key={item.title}>
            <span className={item.iconClass}>{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
