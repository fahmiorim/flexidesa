import { redirect } from "next/navigation";

/** URL placeholder lama pada menu tenant tetap diarahkan ke halaman kanonis. */
export default function StatusDesaLegacyPage() {
  redirect("/profil-desa/status-desa");
}
