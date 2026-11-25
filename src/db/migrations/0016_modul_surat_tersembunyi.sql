-- Modul `surat` adalah modul izin, bukan submenu: halaman /persuratan/surat
-- dibuka lewat Cetak Surat/Dashboard Surat. Rapikan baris yang sempat dibuat
-- sebagai menu biasa agar tidak muncul di sidebar.
UPDATE `modules`
SET `url` = NULL,
    `is_hidden` = 1,
    `parent_id` = 0,
    `sort_order` = 27
WHERE `slug` = 'surat';
