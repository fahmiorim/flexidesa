"use client";

import { useEffect, useRef } from "react";

interface Perintah {
  label: string;
  judul: string;
  cmd: string;
  nilai?: string;
}

/**
 * Toolbar editor. Tag yang dihasilkan semuanya ada di daftar izin
 * `sanitasiHtml()` (p, h2/h3, strong, em, u, s, blockquote, ul, ol, a, hr),
 * sehingga simpanan pengguna tidak terbuang saat disanitasi.
 */
const TOOLBAR: Perintah[][] = [
  [
    { label: "B", judul: "Tebal", cmd: "bold" },
    { label: "I", judul: "Miring", cmd: "italic" },
    { label: "U", judul: "Garis bawah", cmd: "underline" },
    { label: "S", judul: "Coret", cmd: "strikeThrough" },
  ],
  [
    { label: "¶", judul: "Paragraf", cmd: "formatBlock", nilai: "p" },
    { label: "H2", judul: "Judul besar", cmd: "formatBlock", nilai: "h2" },
    { label: "H3", judul: "Judul kecil", cmd: "formatBlock", nilai: "h3" },
    { label: "❝", judul: "Kutipan", cmd: "formatBlock", nilai: "blockquote" },
  ],
  [
    { label: "• Daftar", judul: "Daftar berbutir", cmd: "insertUnorderedList" },
    { label: "1. Daftar", judul: "Daftar bernomor", cmd: "insertOrderedList" },
  ],
  [
    { label: "🔗 Tautan", judul: "Sisipkan tautan", cmd: "createLink" },
    { label: "Putus tautan", judul: "Lepas tautan", cmd: "unlink" },
    { label: "Garis", judul: "Garis pemisah", cmd: "insertHorizontalRule" },
    { label: "Bersihkan", judul: "Hapus format", cmd: "removeFormat" },
  ],
];

/**
 * Editor isi berita berbasis `contentEditable` tanpa dependensi tambahan.
 *
 * Nilai HTML dikirim lewat input tersembunyi bernama `name` agar tetap
 * terbawa saat form dikirim ke Server Action. Karena `required` tidak berlaku
 * untuk input tersembunyi, Server Action tetap memeriksa isi berita.
 */
export function EditorBerita({
  name,
  defaultValue = "",
  placeholder = "Tulis isi berita...",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const nilaiRef = useRef<HTMLInputElement>(null);

  const sinkron = () => {
    if (nilaiRef.current && areaRef.current) {
      nilaiRef.current.value = areaRef.current.innerHTML;
    }
  };

  // `form.reset()` (dipanggil dialog setelah simpan) tidak mengosongkan
  // contentEditable, jadi isinya dikembalikan manual.
  useEffect(() => {
    const form = areaRef.current?.closest("form");
    if (!form) return;
    const pulihkan = () => {
      if (!areaRef.current) return;
      areaRef.current.innerHTML = defaultValue;
      sinkron();
    };
    form.addEventListener("reset", pulihkan);
    return () => form.removeEventListener("reset", pulihkan);
  }, [defaultValue]);

  const jalankan = (perintah: Perintah) => {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    if (perintah.cmd === "createLink") {
      const alamat = window.prompt("Alamat tautan (https://... atau /halaman/slug)");
      if (!alamat) return;
      if (!/^(https?:\/\/|\/)/i.test(alamat)) {
        window.alert("Tautan harus diawali https://, http://, atau / untuk alamat internal.");
        return;
      }
      document.execCommand("createLink", false, alamat);
    } else {
      document.execCommand(perintah.cmd, false, perintah.nilai);
    }
    sinkron();
  };

  return (
    <div className="berita-editor">
      <div aria-label="Pemformatan isi berita" className="berita-editor-toolbar" role="toolbar">
        {TOOLBAR.map((grup, indeks) => (
          <span className="berita-editor-grup" key={indeks}>
            {grup.map((perintah) => (
              <button
                aria-label={perintah.judul}
                key={perintah.label + perintah.cmd}
                // Seleksi di editor hilang bila tombol mengambil fokus.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => jalankan(perintah)}
                title={perintah.judul}
                type="button"
              >
                {perintah.label}
              </button>
            ))}
          </span>
        ))}
      </div>
      <div
        aria-label="Isi berita"
        className="berita-editor-isi"
        contentEditable
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        onBlur={sinkron}
        onInput={sinkron}
        onPaste={(event) => {
          // Tempel sebagai teks supaya gaya dari aplikasi lain tidak ikut masuk.
          event.preventDefault();
          const teks = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, teks);
          sinkron();
        }}
        ref={areaRef}
        role="textbox"
        suppressContentEditableWarning
      />
      <input name={name} ref={nilaiRef} type="hidden" defaultValue={defaultValue} />
    </div>
  );
}
