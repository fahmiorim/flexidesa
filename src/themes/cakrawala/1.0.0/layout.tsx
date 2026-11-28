import "./cakrawala-publik.css";

import type { ThemeLayoutProps } from "../../types";
import styles from "./cakrawala-v2.module.css";

/** Cakrawala V2: Village Digital Experience. Seluruh styling tema dimuat dari paket ini. */
export default function CakrawalaLayout(props: ThemeLayoutProps) {
  return (
    <div className={styles.themeRoot} data-tema="cakrawala" data-tema-paket="cakrawala-v2">
      <div className={styles.content}>{props.children}</div>
    </div>
  );
}
