import { redirect } from "next/navigation";

/** Alias lama modul data suplemen; rute kanonisnya `/penduduk/suplemen`. */
export default function SegeraSuplemenPage() {
  redirect("/penduduk/suplemen");
}
