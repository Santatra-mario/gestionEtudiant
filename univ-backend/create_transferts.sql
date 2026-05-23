CREATE TABLE IF NOT EXISTS transferts (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricule_transfert     VARCHAR(30) NOT NULL UNIQUE,
    etudiant_id             INT UNSIGNED NOT NULL,
    etablissement_origine   VARCHAR(10) NOT NULL,
    filiere_origine         VARCHAR(150) NOT NULL,
    filiere_destination_id  INT UNSIGNED NOT NULL,
    niveau                  ENUM('L1','L2','L3','M1','M2') NOT NULL,
    annee_universitaire     VARCHAR(9) NOT NULL,
    motif                   TEXT,
    statut                  ENUM('en_attente','accepte','refuse') NOT NULL DEFAULT 'en_attente',
    motif_refus             TEXT NULL,
    traite_par              INT UNSIGNED NULL,
    date_demande            DATE NOT NULL,
    date_traitement         DATE NULL,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELIMITER $$
CREATE TRIGGER before_insert_transfert
BEFORE INSERT ON transferts
FOR EACH ROW
BEGIN
    DECLARE compteur INT;
    SELECT COUNT(*) + 1 INTO compteur FROM transferts;
    SET NEW.matricule_transfert = CONCAT(compteur, '-', NEW.etablissement_origine);
    SET NEW.date_demande = CURDATE();
END$$

CREATE TRIGGER before_update_transfert
BEFORE UPDATE ON transferts
FOR EACH ROW
BEGIN
    IF NEW.statut = 'accepte' AND OLD.statut != 'accepte' THEN
        SET NEW.matricule_transfert = REPLACE(OLD.matricule_transfert,
            CONCAT('-', OLD.etablissement_origine),
            CONCAT(' H-', OLD.etablissement_origine));
        SET NEW.date_traitement = CURDATE();
    END IF;
END$$
DELIMITER ;
