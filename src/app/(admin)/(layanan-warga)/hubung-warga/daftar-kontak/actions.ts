"use server";

import { revalidatePath } from "next/cache";

export async function hapusKontakAction(formData: FormData) {
  revalidatePath("/hubung-warga/daftar-kontak");
}