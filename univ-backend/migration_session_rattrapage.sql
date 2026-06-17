-- Migration : Ajout du support session normale / rattrapage dans la table notes
-- Exécuter : mysql -u root -p uniggest < migration_session_rattrapage.sql

ALTER TABLE notes
  ADD COLUMN `session` ENUM('normale','rattrapage') NOT NULL DEFAULT 'normale'
  AFTER `note`;

-- Supprimer l'ancienne contrainte UNIQUE et en créer une nouvelle incluant la session
ALTER TABLE notes DROP INDEX uq_note;
ALTER TABLE notes ADD UNIQUE KEY `uq_note_session` (`inscription_id`,`matiere_id`,`session`);
