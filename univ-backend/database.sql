-- ============================================================
--  UNIGGEST - Schéma de base de données
--  Gestion des étudiants universitaires
--  MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS uniggest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uniggest;

-- ------------------------------------------------------------
-- TABLE : users (authentification)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    prenom      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('administrateur', 'secretaire', 'enseignant') NOT NULL DEFAULT 'secretaire',
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLE : filieres
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS filieres (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(20) NOT NULL UNIQUE,
    nom         VARCHAR(150) NOT NULL,
    description TEXT,
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLE : matieres
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matieres (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filiere_id     INT UNSIGNED NOT NULL,
    enseignant_id  INT UNSIGNED NULL,
    codemat           VARCHAR(20) NOT NULL UNIQUE,
    nom            VARCHAR(150) NOT NULL,
    coefficient    DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    semestre       ENUM('S1','S2') NOT NULL DEFAULT 'S1',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (filiere_id)    REFERENCES filieres(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES users(id)    ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- TABLE : etudiants
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS etudiants (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    matricule       VARCHAR(30) NOT NULL UNIQUE,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    date_naissance  DATE NOT NULL,
    sexe            ENUM('M','F') NOT NULL,
    adresse         VARCHAR(255),
    telephone       VARCHAR(20),
    email           VARCHAR(150),
    photo           VARCHAR(255),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLE : inscriptions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inscriptions (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    etudiant_id         INT UNSIGNED NOT NULL,
    filiere_id          INT UNSIGNED NOT NULL,
    niveau              ENUM('L1','L2','L3','M1','M2') NOT NULL,
    annee_universitaire VARCHAR(9) NOT NULL,   -- ex: 2025-2026
    statut              ENUM('actif','suspendu','diplome','abandonne') NOT NULL DEFAULT 'actif',
    date_inscription    DATE NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE,
    FOREIGN KEY (filiere_id)  REFERENCES filieres(id)  ON DELETE RESTRICT,
    UNIQUE KEY uq_inscription (etudiant_id, annee_universitaire, niveau)
);

-- ------------------------------------------------------------
-- TABLE : notes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inscription_id  INT UNSIGNED NOT NULL,
    matiere_id      INT UNSIGNED NOT NULL,
    note            DECIMAL(5,2) NOT NULL CHECK (note >= 0 AND note <= 20),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id)     REFERENCES matieres(id)     ON DELETE RESTRICT,
    UNIQUE KEY uq_note (inscription_id, matiere_id)
);

-- ------------------------------------------------------------
-- VUE : bulletins (calcul automatique moyenne + mention)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vue_bulletins AS
SELECT
    i.id                                        AS inscription_id,
    e.matricule,
    CONCAT(e.nom, ' ', e.prenom)                AS etudiant,
    f.nom                                       AS filiere,
    i.niveau,
    i.annee_universitaire,
    m.semestre,
    SUM(n.note * m.coefficient) / SUM(m.coefficient)  AS moyenne,
    CASE
        WHEN SUM(n.note * m.coefficient) / SUM(m.coefficient) >= 10 THEN 'Admis'
        WHEN SUM(n.note * m.coefficient) / SUM(m.coefficient) >= 8  THEN 'Rattrapage'
        ELSE 'Ajourné'
    END                                         AS mention
FROM notes n
JOIN inscriptions i  ON n.inscription_id = i.id
JOIN etudiants   e  ON i.etudiant_id     = e.id
JOIN filieres    f  ON i.filiere_id      = f.id
JOIN matieres    m  ON n.matiere_id      = m.id
GROUP BY i.id, m.semestre;

-- ============================================================
-- DONNÉES DE DÉMARRAGE
-- ============================================================

-- Utilisateur admin par défaut  (password: Admin1234)
-- Hash bcrypt généré avec 10 rounds
INSERT INTO users (nom, prenom, email, password, role) VALUES
('Admin', 'Système', 'admin@univ.mg',
 '$2b$10$TAVelWAmoTn7Tk0LoAglsOXx4/paSeCq37vPOnghgce.pL21imYU.', 'administrateur');

-- Filières
INSERT INTO filieres (code, nom, description) VALUES
('INFO', 'Informatique',  'Licence et Master en sciences informatiques'),
('MED',  'Médecine',      'Formation médicale générale'),
('DROIT','Droit',         'Droit civil, pénal et des affaires'),
('ECO',  'Économie',      'Économie et gestion'),
('LET',  'Lettres',       'Lettres modernes et linguistique'),
('SCI',  'Sciences',      'Sciences physiques et naturelles');

-- Matières Informatique S1
INSERT INTO matieres (filiere_id, code, nom, coefficient, semestre) VALUES
(1,'INFO-ALG','Algorithmique',        3,'S1'),
(1,'INFO-RES','Réseaux',              2,'S1'),
(1,'INFO-MAT','Mathématiques',        3,'S1'),
(1,'INFO-ANG','Anglais',              1,'S1'),
(1,'INFO-BDD','Base de données',      3,'S1'),
(1,'INFO-POO','Programmation OO',     3,'S2'),
(1,'INFO-SYS','Systèmes d\'exploitation',2,'S2'),
(1,'INFO-WEB','Développement Web',    2,'S2');

-- Matières Médecine
INSERT INTO matieres (filiere_id, code, nom, coefficient, semestre) VALUES
(2,'MED-ANA','Anatomie',    4,'S1'),
(2,'MED-BIO','Biochimie',   3,'S1'),
(2,'MED-PHY','Physiologie', 3,'S2'),
(2,'MED-PHA','Pharmacologie',3,'S2');

-- Matières Droit
INSERT INTO matieres (filiere_id, code, nom, coefficient, semestre) VALUES
(3,'DRT-CIV','Droit civil',     3,'S1'),
(3,'DRT-PEN','Droit pénal',     3,'S1'),
(3,'DRT-PRO','Procédure civile',2,'S2'),
(3,'DRT-AFF','Droit des affaires',3,'S2');

-- ------------------------------------------------------------
-- TABLE : presences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presences (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inscription_id  INT UNSIGNED NOT NULL,
    matiere_id      INT UNSIGNED NOT NULL,
    date            DATE NOT NULL,
    statut          ENUM('present','absent','retard','excuse') NOT NULL,
    enregistre_par  INT UNSIGNED NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id)     REFERENCES matieres(id)     ON DELETE RESTRICT,
    FOREIGN KEY (enregistre_par)  REFERENCES users(id)        ON DELETE SET NULL,
    UNIQUE KEY uq_presence (inscription_id, matiere_id, date)
);
