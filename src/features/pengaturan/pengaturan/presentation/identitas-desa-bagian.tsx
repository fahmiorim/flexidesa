import styles from "./pengaturan-desa.module.css";

export function TabIntro({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.tabIntro}>
      <span className={styles.tabStep}>{step}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
