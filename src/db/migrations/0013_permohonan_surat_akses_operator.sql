-- Operator dan sekretaris dapat memproses Permohonan Surat (periksa, kembalikan,
-- batalkan, tandai siap/sudah diambil) seperti hak `u` di OpenSID.
-- Hak hapus (`h`) tetap khusus administrator, jadi `can_delete` tidak diubah.
UPDATE `role_permissions` rp
JOIN `modules` m ON m.`id` = rp.`module_id`
JOIN `roles` r ON r.`id` = rp.`role_id`
SET rp.`access` = 'write',
    rp.`can_read` = 1,
    rp.`can_create` = 1,
    rp.`can_update` = 1
WHERE m.`slug` = 'permohonan-surat'
  AND r.`slug` IN ('operator', 'sekretaris');
