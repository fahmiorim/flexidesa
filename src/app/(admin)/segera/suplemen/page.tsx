import { redirect } from "next/navigation";

/** Alias lama modul data suplemen; rute kanonisnya `/kependudukan/penduduk/suplemen`. */
export default function SegeraSuplemenPage() {
  redirect("/kependudukan/penduduk/suplemen");
}
