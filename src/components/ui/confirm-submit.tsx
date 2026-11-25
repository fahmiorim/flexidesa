"use client";

/**
 * Tombol submit yang meminta konfirmasi sebelum form dikirim.
 *
 * Dipakai untuk aksi merusak (mis. hapus data) agar pengguna tidak menghapus
 * hanya karena salah klik. Server tetap memeriksa izin dan aturan domain.
 */
export function ConfirmSubmit({
  message,
  className,
  children,
  form,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  /** Id form yang dituju; dipakai bila tombol berada di luar form-nya. */
  form?: string;
}) {
  return (
    <button
      className={className}
      form={form}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
