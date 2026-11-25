import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tambah Tenant",
  robots: { index: false, follow: false },
};

/**
 * Pengalih kompatibilitas: wizard tambah domain lama kini digantikan halaman
 * Tambah Tenant (`/super-admin/tenant/tambah`). Rute ini dipertahankan agar
 * tautan lama, bookmark, atau riwayat tetap sampai ke alur tambah yang sama.
 * Halaman tujuan memeriksa `pastikanSuperAdmin` sendiri.
 */
export default function SuperAdminTambahDomainPage() {
  redirect("/super-admin/tenant/tambah");
}
