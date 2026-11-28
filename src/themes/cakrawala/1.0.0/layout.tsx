import type { ThemeLayoutProps } from "../../types";
import styles from "./cakrawala-v2.module.css";

/** Cakrawala V2: village digital experience, seluruh visual terisolasi dalam paket tema. */
export default function CakrawalaLayout(props: ThemeLayoutProps) {
  return (
    <div className={styles.themeRoot} data-tema-paket="cakrawala-v2">
      <div className={styles.content}>{props.children}</div>
    </div>
  );
}
