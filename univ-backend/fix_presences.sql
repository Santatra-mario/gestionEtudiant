-- Script complet pour corriger les problèmes de présences
-- 1. Crée la table presences avec la bonne structure
-- 2. Crée les vues nécessaires pour les requêtes

USE uniggest;

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS presences;

-- Créer la table presences avec la structure correcte
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

-- Créer une vue pour simplifier les requêtes
CREATE VIEW v_presences_details AS
SELECT 
    p.id,
    p.inscription_id,
    p.matiere_id,
    p.date,
    p.statut,
    p.enregistre_par,
    p.created_at,
    p.updated_at,
    e.nom as etudiant_nom,
    e.matricule,
    f.nom as filiere_nom,
    i.niveau,
    m.nom as matiere_nom,
    m.code as matiere_code
FROM presences p
JOIN inscriptions i ON p.inscription_id = i.id
JOIN etudiants e ON i.etudiant_id = e.id
JOIN filieres f ON i.filiere_id = f.id
JOIN matieres m ON p.matiere_id = m.id;

SELECT 'Table presences et vue v_presences_details créées avec succès!' as message;
