-- Script pour supprimer et recréer la table presences
-- Exécutez ce script pour mettre à jour la structure de la table

USE uniggest;

-- Étape 1 : Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS presences;

-- Étape 2 : Recréer la table avec la structure à jour
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

-- Étape 3 : Vérifier que la table est bien créée
SELECT 'Table presences supprimée et recréée avec succès!' as message;

-- Étape 4 : Afficher la structure de la nouvelle table
DESCRIBE presences;
