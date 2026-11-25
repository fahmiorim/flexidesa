-- Menu Layanan Surat → Pengaturan Surat kini menuju halaman nyata
-- (`/persuratan/jenis-surat`) dan diletakkan paling atas seperti OpenSID.
UPDATE `modules`
SET `url` = '/persuratan/jenis-surat', `sort_order` = 1
WHERE `slug` = 'pengaturan-surat'
  AND `url` <> '/persuratan/jenis-surat';
