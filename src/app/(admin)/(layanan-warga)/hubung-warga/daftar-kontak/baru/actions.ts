"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  createKontakUseCase,
  village,
} from "@/features/layanan-warga/kontak/application/use-cases";
import {
  KONTAK_RESOURCE,
  kontakSchema,
} from "@/features/layanan-warga/kontak/domain/kontak";
import {
  errorState,
  type ActionState,
  zodToFieldErrors,
} from "@/lib/action-state";

/** Schema form tanpa field yang dikendalikan server (id, villageId). */
const formSchema = z.object(kontakSchema.shape).omit({
  id: true,
  villageId: true,
});

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function simpanKontakAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { villageId } = await village(KONTAK_RESOURCE, "create");

  const parsed = formSchema.safeParse({
    nama: field(formData, "nama"),
    residentId: field(formData, "residentId") ? Number(field(formData, "residentId")) : null,
    hubungWarga: field(formData, "hubungWarga") || "Telegram",
    telepon: field(formData, "telepon"),
    email: field(formData, "email"),
    telegram: field(formData, "telegram"),
    keterangan: field(formData, "keterangan"),
  });

  if (!parsed.success) {
    return errorState("Data yang dikirim tidak valid.", zodToFieldErrors(parsed.error));
  }

  const data = parsed.data;

  // Validasi kondisional: kanal yang dipilih wajib punya alamat.
  if (data.hubungWarga === "SMS" && !data.telepon) {
    return errorState("Data tidak valid.", {
      telepon: ["Telepon diperlukan jika SMS dipilih sebagai cara hubung."],
    });
  }
  if (data.hubungWarga === "Email" && !data.email) {
    return errorState("Data tidak valid.", {
      email: ["Email diperlukan jika Email dipilih sebagai cara hubung."],
    });
  }
  if (data.hubungWarga === "Telegram" && !data.telegram) {
    return errorState("Data tidak valid.", {
      telegram: ["ID Telegram diperlukan jika Telegram dipilih sebagai cara hubung."],
    });
  }

  try {
    await createKontakUseCase(villageId, { ...data, villageId });
    revalidatePath("/hubung-warga/daftar-kontak");
    redirect("/hubung-warga/daftar-kontak?created=1");
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Kontak tidak dapat disimpan.");
  }
}