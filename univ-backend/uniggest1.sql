-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : sam. 13 juin 2026 à 05:53
-- Version du serveur : 8.4.7
-- Version de PHP : 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `uniggest`
--

-- --------------------------------------------------------

--
-- Structure de la table `etudiants`
--

DROP TABLE IF EXISTS `etudiants`;
CREATE TABLE IF NOT EXISTS `etudiants` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `matricule` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `date_naissance` date NOT NULL,
  `sexe` enum('M','F') COLLATE utf8mb4_general_ci NOT NULL,
  `adresse` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`)
) ENGINE=MyISAM AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `etudiants`
--

INSERT INTO `etudiants` (`id`, `matricule`, `nom`, `prenom`, `date_naissance`, `sexe`, `adresse`, `telephone`, `email`, `photo`, `created_at`, `updated_at`) VALUES
(39, '2000 H-F', 'LAHIMANITRARIVO', 'Mario  Jonsthone', '2012-02-25', 'M', 'Tanambao', '+261336398456', 'jessiniainab@gmail.com', 'photo-1781076215011.png', '2026-06-01 11:49:55', '2026-06-10 09:32:57'),
(40, '2001 H-F', 'Santatra', 'Mario', '2020-07-02', 'M', 'Fianarantsoa', '+261387546513', 'mariosantatra@gmail.com', 'photo-1781078360577.png', '2026-06-10 09:59:20', '2026-06-10 09:59:20');

-- --------------------------------------------------------

--
-- Structure de la table `filieres`
--

DROP TABLE IF EXISTS `filieres`;
CREATE TABLE IF NOT EXISTS `filieres` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `filieres`
--

INSERT INTO `filieres` (`id`, `nom`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(31, 'Faculté de Science', 'FACSCIENCE', '', 1, '2026-05-29 20:39:08', '2026-05-29 20:39:08'),
(30, 'Economie Gestion', 'EGS', '', 1, '2026-05-29 20:38:35', '2026-05-29 20:38:35');

-- --------------------------------------------------------

--
-- Structure de la table `inscriptions`
--

DROP TABLE IF EXISTS `inscriptions`;
CREATE TABLE IF NOT EXISTS `inscriptions` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `etudiant_id` int UNSIGNED NOT NULL,
  `filiere_id` int UNSIGNED NOT NULL,
  `niveau` enum('L1','L2','L3','M1','M2') COLLATE utf8mb4_general_ci NOT NULL,
  `annee_universitaire` varchar(9) COLLATE utf8mb4_general_ci NOT NULL,
  `statut` enum('actif','suspendu','diplome','abandonne','transfere') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'actif',
  `date_inscription` date NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inscription` (`etudiant_id`,`annee_universitaire`,`niveau`),
  KEY `filiere_id` (`filiere_id`)
) ENGINE=MyISAM AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `inscriptions`
--

INSERT INTO `inscriptions` (`id`, `etudiant_id`, `filiere_id`, `niveau`, `annee_universitaire`, `statut`, `date_inscription`, `created_at`, `updated_at`) VALUES
(41, 40, 30, 'L1', '2026-2027', 'actif', '2026-06-10', '2026-06-10 10:24:51', '2026-06-10 10:24:51'),
(42, 40, 30, 'L3', '2026-2027', 'actif', '2026-06-12', '2026-06-12 19:26:07', '2026-06-12 19:26:07'),
(39, 40, 31, 'L2', '2024-2025', 'actif', '2026-06-10', '2026-06-10 09:59:20', '2026-06-10 09:59:20');

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

DROP TABLE IF EXISTS `matieres`;
CREATE TABLE IF NOT EXISTS `matieres` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `filiere_id` int UNSIGNED DEFAULT NULL,
  `niveau` enum('L1','L2','L3','M1','M2') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nom_matiere` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `code_matiere` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `credit` decimal(4,2) NOT NULL DEFAULT '1.00',
  `volume_horaire` int DEFAULT NULL,
  `semestre` enum('S1','S2','S3','S4','S5','S6','S7','S8','S9','S10') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'S1',
  `enseignant_id` int UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `fk_matieres_enseignant` (`enseignant_id`)
) ENGINE=MyISAM AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `filiere_id`, `niveau`, `nom_matiere`, `code_matiere`, `credit`, `volume_horaire`, `semestre`, `enseignant_id`, `created_at`, `updated_at`) VALUES
(42, 30, 'L1', 'Français', 'FRS', 3.00, 40, 'S1', 3, '2026-05-29 20:44:23', '2026-06-12 19:11:49'),
(49, 30, 'L3', 'Entreprenaria', 'ENTA', 6.00, 5, 'S5', 8, '2026-06-12 19:18:35', '2026-06-12 19:18:35'),
(44, 30, 'L3', 'Droit de Travail L3', 'DAT', 2.00, 2, 'S6', 8, '2026-05-29 20:47:16', '2026-06-12 19:11:37'),
(50, 31, 'M2', 'Science', 'SCE', 10.00, 4, 'S10', 3, '2026-06-12 19:20:37', '2026-06-12 19:20:37');

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `inscription_id` int UNSIGNED NOT NULL,
  `matiere_id` int UNSIGNED NOT NULL,
  `note` decimal(5,2) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_note` (`inscription_id`,`matiere_id`),
  KEY `matiere_id` (`matiere_id`)
) ;

--
-- Déchargement des données de la table `notes`
--

INSERT INTO `notes` (`id`, `inscription_id`, `matiere_id`, `note`, `created_at`, `updated_at`) VALUES
(46, 38, 48, 13.50, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(45, 38, 47, 12.00, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(44, 38, 46, 9.50, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(43, 38, 45, 15.00, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(42, 38, 44, 12.00, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(41, 38, 43, 13.00, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(40, 38, 42, 9.00, '2026-05-29 20:56:39', '2026-05-29 20:56:39'),
(39, 38, 41, 10.00, '2026-05-29 20:56:39', '2026-05-29 20:56:39');

-- --------------------------------------------------------

--
-- Structure de la table `presences`
--

DROP TABLE IF EXISTS `presences`;
CREATE TABLE IF NOT EXISTS `presences` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `inscription_id` int UNSIGNED NOT NULL,
  `matiere_id` int UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `statut` enum('present','absent','retard','excuse') COLLATE utf8mb4_general_ci NOT NULL,
  `enregistre_par` int UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_presence` (`inscription_id`,`matiere_id`,`date`),
  KEY `matiere_id` (`matiere_id`),
  KEY `enregistre_par` (`enregistre_par`)
) ENGINE=MyISAM AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `presences`
--

INSERT INTO `presences` (`id`, `inscription_id`, `matiere_id`, `date`, `statut`, `enregistre_par`, `created_at`, `updated_at`) VALUES
(32, 42, 42, '2026-06-11', 'absent', NULL, '2026-06-12 19:27:43', '2026-06-12 19:27:43');

-- --------------------------------------------------------

--
-- Structure de la table `transferts`
--

DROP TABLE IF EXISTS `transferts`;
CREATE TABLE IF NOT EXISTS `transferts` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `matricule_transfert` varchar(30) COLLATE utf8mb4_general_ci NOT NULL,
  `etudiant_id` int UNSIGNED NOT NULL,
  `etablissement_origine` varchar(10) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Code établissement ex: TOL',
  `filiere_origine` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `filiere_destination_id` int UNSIGNED NOT NULL,
  `niveau` enum('L1','L2','L3','M1','M2') COLLATE utf8mb4_general_ci NOT NULL,
  `annee_universitaire` varchar(9) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'ex: 2026-2027',
  `motif` text COLLATE utf8mb4_general_ci,
  `statut` enum('en_attente','accepte','refuse') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'en_attente',
  `motif_refus` text COLLATE utf8mb4_general_ci,
  `motif_annulation` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Motif annulation par admin',
  `traite_par` int UNSIGNED DEFAULT NULL COMMENT 'ID user qui a traité',
  `annule_par` int UNSIGNED DEFAULT NULL COMMENT 'ID admin qui a annulé',
  `date_demande` date NOT NULL,
  `date_traitement` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `etudiant_nom_snapshot` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Nom sauvegardé',
  `etudiant_prenom_snapshot` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Prénom sauvegardé',
  `matricule_etudiant_snapshot` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Matricule sauvegardé',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_matricule_transfert` (`matricule_transfert`),
  KEY `idx_etudiant_id` (`etudiant_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_filiere_dest` (`filiere_destination_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Demandes de transfert inter-établissement';

--
-- Déclencheurs `transferts`
--
DROP TRIGGER IF EXISTS `before_insert_transfert`;
DELIMITER $$
CREATE TRIGGER `before_insert_transfert` BEFORE INSERT ON `transferts` FOR EACH ROW BEGIN
    DECLARE compteur INT;
    SELECT COUNT(*) + 1 INTO compteur FROM transferts;
    SET NEW.matricule_transfert = CONCAT(compteur, '-', NEW.etablissement_origine);
    SET NEW.date_demande = CURDATE();
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `before_update_transfert`;
DELIMITER $$
CREATE TRIGGER `before_update_transfert` BEFORE UPDATE ON `transferts` FOR EACH ROW BEGIN
    IF NEW.statut = 'accepte' AND OLD.statut != 'accepte' THEN
        SET NEW.matricule_transfert = REPLACE(
            OLD.matricule_transfert,
            CONCAT('-', OLD.etablissement_origine),
            CONCAT(' H-', OLD.etablissement_origine)
        );
        SET NEW.date_traitement = NOW();
    END IF;
    -- Quand on annule (retour en_attente), on efface la date de traitement
    IF NEW.statut = 'en_attente' AND OLD.statut != 'en_attente' THEN
        SET NEW.date_traitement = NULL;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('administrateur','secretaire','enseignant') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'secretaire',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Mario', 'koto', 'santatramario12@gmail.com', '$2b$10$IZMNsZH.djihM5hyOlIYW.bAupRp12qI/YTdBNtX9hGaucmVJHP9C', 'administrateur', 1, '2026-04-29 12:02:23', '2026-05-14 20:19:30'),
(11, 'Lala', 'ydov', 'lalaydov@gmail.com', '$2b$10$vnT7Qq2Ajaa.yKW.JCoeMeikC6CLGqR4ltOgBJeC4b.sTlIZjT06.', 'secretaire', 1, '2026-06-09 18:15:30', '2026-06-09 18:15:30'),
(3, 'Sandratra', 'Razanamparany', 'sandratra@gmail.com', '$2b$10$sXuEMwo.Fmjiz/.DCDgaFe1wWVpe1dgCkBIrCD0tlqVCAyYjC05D6', 'enseignant', 1, '2026-04-29 18:38:53', '2026-04-29 18:38:53'),
(6, 'Sitraka', 'Jonsthone', 'sitraka@gmail.com', '$2b$10$8utxq50gbBIV6P1SIHTPC.XFj8Iiq7n67PgXnAzslquxh.PpKNhKu', 'secretaire', 1, '2026-04-30 07:19:21', '2026-05-27 13:11:21'),
(7, 'Sandratra', 'Mario', 'boniajons@gamil.com', '$2b$10$Ar3gnT2Dh0IBqvY/HwJtDeXn5r2qvZXburmdBX3s.q7QWJD97zACW', 'administrateur', 1, '2026-04-30 17:31:36', '2026-06-09 18:37:44'),
(8, 'enseignant', 'role', 'enseignant@gmail.com', '$2b$10$hexEFWQEtK/dVoL4U77j1OH4HuDc57j4nnSMhoxIomsceiKM4kQL2', 'enseignant', 1, '2026-04-30 18:40:16', '2026-04-30 18:40:16'),
(9, 'secretaire', 'sec', 'secretaire@gmail.com', '$2b$10$QfLuvvZcSbhtJ/Svomq7mOGyD/XBRsBnK1Y63l6CPAlv4lz5Pvy12', 'secretaire', 1, '2026-04-30 18:43:52', '2026-06-09 18:28:23');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_bulletins`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_bulletins`;
CREATE TABLE IF NOT EXISTS `vue_bulletins` (
`inscription_id` int unsigned
,`matricule` varchar(30)
,`etudiant` varchar(201)
,`filiere` varchar(150)
,`niveau` enum('L1','L2','L3','M1','M2')
,`annee_universitaire` varchar(9)
,`semestre` enum('S1','S2','S3','S4','S5','S6','S7','S8','S9','S10')
,`moyenne` decimal(37,8)
,`mention` varchar(10)
);

-- --------------------------------------------------------

--
-- Structure de la vue `vue_bulletins`
--
DROP TABLE IF EXISTS `vue_bulletins`;

DROP VIEW IF EXISTS `vue_bulletins`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_bulletins`  AS SELECT `i`.`id` AS `inscription_id`, `e`.`matricule` AS `matricule`, concat(`e`.`nom`,' ',`e`.`prenom`) AS `etudiant`, `f`.`nom` AS `filiere`, `i`.`niveau` AS `niveau`, `i`.`annee_universitaire` AS `annee_universitaire`, `m`.`semestre` AS `semestre`, (sum((`n`.`note` * `m`.`credit`)) / sum(`m`.`credit`)) AS `moyenne`, (case when ((sum((`n`.`note` * `m`.`credit`)) / sum(`m`.`credit`)) >= 10) then 'Admis' when ((sum((`n`.`note` * `m`.`credit`)) / sum(`m`.`credit`)) >= 8) then 'Rattrapage' else 'Ajourné' end) AS `mention` FROM ((((`notes` `n` join `inscriptions` `i` on((`n`.`inscription_id` = `i`.`id`))) join `etudiants` `e` on((`i`.`etudiant_id` = `e`.`id`))) join `filieres` `f` on((`i`.`filiere_id` = `f`.`id`))) join `matieres` `m` on((`n`.`matiere_id` = `m`.`id`))) GROUP BY `i`.`id`, `m`.`semestre` ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
