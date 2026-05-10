-- Création manuelle de la table presences
-- Copiez-collez ce code dans votre client MySQL (MySQL Workbench, phpMyAdmin, etc.)

USE uniggest;

DROP TABLE IF EXISTS presences;

CREATE TABLE presences (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inscription_id INT UNSIGNED NOT NULL,
    matiere_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    statut ENUM('present','absent','retard','excuse') NOT NULL,
    enregistre_par INT UNSIGNED NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE RESTRICT,
    FOREIGN KEY (enregistre_par) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_presence (inscription_id, matiere_id, date)
);

SELECT 'Table presences créée avec succès!' AS message;
