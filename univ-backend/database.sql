-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : sam. 23 mai 2026 à 09:35
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
) ENGINE=MyISAM AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `etudiants`
--

INSERT INTO `etudiants` (`id`, `matricule`, `nom`, `prenom`, `date_naissance`, `sexe`, `adresse`, `telephone`, `email`, `photo`, `created_at`, `updated_at`) VALUES
(33, '2004 H-F', 'KOto', 'Souris', '2016-07-15', 'M', 'Antsirabe', '0387546513', 'koto@gmail.com', NULL, '2026-05-23 10:05:46', '2026-05-23 10:05:46'),
(30, '2002 H-F', 'Jonsthone', 'Mario', '2010-07-14', 'M', 'Antsirabe', '0387546513', 'mario@gmail.com', NULL, '2026-05-22 17:40:13', '2026-05-22 17:40:13'),
(31, '2003 H-F', 'Raz', 'Sandratra', '2017-07-21', 'F', 'Antsirabe', '0331587458', 'hbfbf@gmail.com', NULL, '2026-05-22 17:48:25', '2026-05-22 17:48:25');

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
) ENGINE=MyISAM AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `filieres`
--

INSERT INTO `filieres` (`id`, `nom`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(26, 'Informatique General', 'INFO', 'mianara', 1, '2026-05-22 16:14:35', '2026-05-23 09:59:43');

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
  `statut` enum('actif','suspendu','diplome','abandonne') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'actif',
  `date_inscription` date NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inscription` (`etudiant_id`,`annee_universitaire`,`niveau`),
  KEY `filiere_id` (`filiere_id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `inscriptions`
--

INSERT INTO `inscriptions` (`id`, `etudiant_id`, `filiere_id`, `niveau`, `annee_universitaire`, `statut`, `date_inscription`, `created_at`, `updated_at`) VALUES
(26, 32, 26, 'M1', '2026-2027', 'diplome', '2026-05-22', '2026-05-22 17:55:23', '2026-05-23 10:04:17'),
(25, 30, 26, 'M2', '2026-2027', 'abandonne', '2026-02-19', '2026-05-22 17:40:43', '2026-05-23 10:00:51'),
(24, 29, 26, 'L2', '2026-2027', 'actif', '2026-02-12', '2026-05-22 17:25:56', '2026-05-22 17:25:56'),
(23, 28, 26, 'L3', '2026-2027', 'actif', '2026-01-22', '2026-05-22 17:25:08', '2026-05-22 17:25:08'),
(22, 22, 22, 'L3', '2026-2027', 'suspendu', '2026-02-05', '2026-05-13 15:40:25', '2026-05-14 14:53:21'),
(21, 21, 23, 'L2', '2026-2027', 'actif', '2026-01-13', '2026-05-13 15:11:52', '2026-05-13 15:11:52'),
(27, 31, 26, 'L1', '2026-2027', 'suspendu', '2025-10-03', '2026-05-22 18:00:35', '2026-05-23 10:01:09'),
(28, 33, 26, 'L3', '2026-2027', 'actif', '2026-02-18', '2026-05-23 10:06:23', '2026-05-23 10:06:23');

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

DROP TABLE IF EXISTS `matieres`;
CREATE TABLE IF NOT EXISTS `matieres` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `filiere_id` int UNSIGNED NOT NULL,
  `nom` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `codemat` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `coefficient` decimal(4,2) NOT NULL DEFAULT '1.00',
  `semestre` enum('S1','S2','S3','S4','S5','S6','S7','S8','S9','S10') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'S1',
  `enseignant_id` int UNSIGNED DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `fk_matieres_enseignant` (`enseignant_id`)
) ENGINE=MyISAM AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `filiere_id`, `nom`, `codemat`, `coefficient`, `semestre`, `enseignant_id`, `created_at`, `updated_at`) VALUES
(38, 26, 'Algorithme de base', 'ALGO', 2.00, 'S2', 7, '2026-05-22 17:13:11', '2026-05-23 10:00:03');

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
(36, 26, 38, 6.00, '2026-05-22 17:59:51', '2026-05-22 17:59:51'),
(35, 22, 36, 16.00, '2026-05-13 15:41:01', '2026-05-13 15:41:01'),
(34, 22, 35, 9.00, '2026-05-13 15:41:01', '2026-05-13 16:26:35'),
(33, 21, 37, 5.00, '2026-05-13 15:12:52', '2026-05-16 05:51:20');

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
) ENGINE=MyISAM AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `presences`
--

INSERT INTO `presences` (`id`, `inscription_id`, `matiere_id`, `date`, `statut`, `enregistre_par`, `created_at`, `updated_at`) VALUES
(31, 25, 38, '2026-05-21', 'absent', NULL, '2026-05-23 10:51:15', '2026-05-23 10:51:15'),
(30, 27, 38, '2026-05-22', 'retard', NULL, '2026-05-23 10:38:12', '2026-05-23 10:38:12'),
(29, 28, 38, '2026-05-21', 'retard', NULL, '2026-05-23 10:25:30', '2026-05-23 10:25:30');

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
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `password`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Mario', 'koto', 'santatramario12@gmail.com', '$2b$10$IZMNsZH.djihM5hyOlIYW.bAupRp12qI/YTdBNtX9hGaucmVJHP9C', 'administrateur', 1, '2026-04-29 12:02:23', '2026-05-14 20:19:30'),
(3, 'Sandratra', 'Razanamparany', 'sandratra@gmail.com', '$2b$10$sXuEMwo.Fmjiz/.DCDgaFe1wWVpe1dgCkBIrCD0tlqVCAyYjC05D6', 'enseignant', 1, '2026-04-29 18:38:53', '2026-04-29 18:38:53'),
(6, 'Sitraka', 'Jonsthone', 'sitraka@gmail.com', '$2b$10$k.Fkdg6ZR/1mgBVGf8Nuh..xgr0XxMh39GeXRHHubi7q53pERCpqy', 'secretaire', 1, '2026-04-30 07:19:21', '2026-05-22 15:26:52'),
(7, 'Sandratra', 'Mario', 'boniajons@gamil.com', '$2b$10$Ar3gnT2Dh0IBqvY/HwJtDeXn5r2qvZXburmdBX3s.q7QWJD97zACW', 'enseignant', 1, '2026-04-30 17:31:36', '2026-04-30 17:31:36'),
(8, 'enseignant', 'role', 'enseignant@gmail.com', '$2b$10$hexEFWQEtK/dVoL4U77j1OH4HuDc57j4nnSMhoxIomsceiKM4kQL2', 'enseignant', 1, '2026-04-30 18:40:16', '2026-04-30 18:40:16'),
(9, 'secretaire', 'sec', 'secretaire@gmail.com', '$2b$10$xXiS/w7g3h0f43PpBd8eWOUWI7gY.DIe4LdcbATEYiNgoudiRJ6mq', 'administrateur', 1, '2026-04-30 18:43:52', '2026-05-16 05:34:51');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_bulletins`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_bulletins`;
CREATE TABLE IF NOT EXISTS `vue_bulletins` (
`annee_universitaire` varchar(9)
,`etudiant` varchar(201)
,`filiere` varchar(150)
,`inscription_id` int unsigned
,`matricule` varchar(30)
,`mention` varchar(10)
,`moyenne` decimal(37,8)
,`niveau` enum('L1','L2','L3','M1','M2')
,`semestre` enum('S1','S2','S3','S4','S5','S6','S7','S8','S9','S10')
);

-- --------------------------------------------------------

--
-- Structure de la vue `vue_bulletins`
--
DROP TABLE IF EXISTS `vue_bulletins`;

DROP VIEW IF EXISTS `vue_bulletins`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_bulletins`  AS SELECT `i`.`id` AS `inscription_id`, `e`.`matricule` AS `matricule`, concat(`e`.`nom`,' ',`e`.`prenom`) AS `etudiant`, `f`.`nom` AS `filiere`, `i`.`niveau` AS `niveau`, `i`.`annee_universitaire` AS `annee_universitaire`, `m`.`semestre` AS `semestre`, (sum((`n`.`note` * `m`.`coefficient`)) / sum(`m`.`coefficient`)) AS `moyenne`, (case when ((sum((`n`.`note` * `m`.`coefficient`)) / sum(`m`.`coefficient`)) >= 10) then 'Admis' when ((sum((`n`.`note` * `m`.`coefficient`)) / sum(`m`.`coefficient`)) >= 8) then 'Rattrapage' else 'Ajourné' end) AS `mention` FROM ((((`notes` `n` join `inscriptions` `i` on((`n`.`inscription_id` = `i`.`id`))) join `etudiants` `e` on((`i`.`etudiant_id` = `e`.`id`))) join `filieres` `f` on((`i`.`filiere_id` = `f`.`id`))) join `matieres` `m` on((`n`.`matiere_id` = `m`.`id`))) GROUP BY `i`.`id`, `m`.`semestre` ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
