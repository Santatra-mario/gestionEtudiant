-- Migration : Ajout du mot de passe pour les étudiants
-- Exécutez cette commande dans phpMyAdmin

ALTER TABLE `etudiants`
  ADD COLUMN `password` VARCHAR(255) NULL AFTER `photo`;
