-- Migration : Renommer et ajouter des colonnes dans la table matieres
-- Base de données : uniggest
--
-- 1. codemat  → code_matiere
-- 2. nom      → nom_matiere
-- 3. coefficient → credit
-- 4. Ajouter niveau ENUM('L1','L2','L3','M1','M2') NULL AFTER filiere_id
-- 5. Ajouter volume_horaire INT NULL AFTER credit
-- 6. Rendre filiere_id NULLABLE
-- 7. Supprimer et recréer vue_bulletins avec m.credit

ALTER TABLE `matieres`
  CHANGE COLUMN `codemat`     `code_matiere`  VARCHAR(20)  NOT NULL,
  CHANGE COLUMN `nom`         `nom_matiere`   VARCHAR(150) NOT NULL,
  CHANGE COLUMN `coefficient` `credit`        DECIMAL(4,2) NOT NULL DEFAULT '1.00',
  ADD COLUMN `niveau`         ENUM('L1','L2','L3','M1','M2') NULL AFTER `filiere_id`,
  ADD COLUMN `volume_horaire` INT            NULL          AFTER `credit`,
  MODIFY COLUMN `filiere_id`  INT UNSIGNED   NULL;

-- Ajouter 'transfere' à l'ENUM statut de la table inscriptions
ALTER TABLE `inscriptions`
  MODIFY COLUMN `statut` ENUM('actif','suspendu','diplome','abandonne','transfere') NOT NULL DEFAULT 'actif';

-- Supprimer et recréer la vue vue_bulletins avec le nouveau nom credit
DROP VIEW IF EXISTS `vue_bulletins`;

CREATE VIEW `vue_bulletins` AS
SELECT
  `i`.`id`               AS `inscription_id`,
  `e`.`matricule`        AS `matricule`,
  CONCAT(`e`.`nom`,' ',`e`.`prenom`) AS `etudiant`,
  `f`.`nom`              AS `filiere`,
  `i`.`niveau`           AS `niveau`,
  `i`.`annee_universitaire` AS `annee_universitaire`,
  `m`.`semestre`         AS `semestre`,
  (SUM((`n`.`note` * `m`.`credit`)) / SUM(`m`.`credit`)) AS `moyenne`,
  (CASE
    WHEN (SUM((`n`.`note` * `m`.`credit`)) / SUM(`m`.`credit`)) >= 10 THEN 'Admis'
    WHEN (SUM((`n`.`note` * `m`.`credit`)) / SUM(`m`.`credit`)) >= 8  THEN 'Rattrapage'
    ELSE 'Ajourné'
  END) AS `mention`
FROM ((((`notes` `n`
  JOIN `inscriptions` `i` ON ((`n`.`inscription_id` = `i`.`id`)))
  JOIN `etudiants` `e` ON ((`i`.`etudiant_id` = `e`.`id`)))
  JOIN `filieres` `f` ON ((`i`.`filiere_id` = `f`.`id`)))
  JOIN `matieres` `m` ON ((`n`.`matiere_id` = `m`.`id`)))
GROUP BY `i`.`id`, `m`.`semestre`;
