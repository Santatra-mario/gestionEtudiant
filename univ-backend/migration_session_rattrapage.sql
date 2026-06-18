-- Migration : Ajout du support session normale / rattrapage dans la table notes
-- Exécuter dans phpMyAdmin (base uniggest, onglet SQL)
--
-- Étape 1 : Ajouter la colonne session
ALTER TABLE notes
  ADD COLUMN `session` ENUM('normale','rattrapage') NOT NULL DEFAULT 'normale'
  AFTER `note`;

-- Étape 2 : Supprimer l'ancienne contrainte UNIQUE (inscription_id, matiere_id)
ALTER TABLE notes DROP INDEX uq_note;

-- Étape 3 : Créer la nouvelle contrainte UNIQUE incluant la session
ALTER TABLE notes ADD UNIQUE KEY `uq_note_session` (`inscription_id`, `matiere_id`, `session`);

-- Les notes existantes auront session = 'normale' par défaut
