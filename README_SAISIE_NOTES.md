# 📚 Système de Saisie des Notes - Documentation Complète

## 🎯 Vue d'ensemble

Ce système de gestion des notes permet aux enseignants, secrétaires et administrateurs de saisir, modifier et consulter les notes des étudiants de manière complète et sécurisée.

## 🔐 Permissions et Rôles

### Rôles autorisés pour la saisie de notes :
- **Administrateur** ✅ - Accès complet
- **Secrétaire** ✅ - Accès complet  
- **Enseignant** ✅ - Saisie et modification uniquement

### Permissions détaillées :
| Action | Administrateur | Secrétaire | Enseignant | Étudiant |
|--------|----------------|------------|------------|----------|
| Lire notes/bulletins | ✅ | ✅ | ✅ | ✅ |
| Saisir note individuelle | ✅ | ✅ | ✅ | ❌ |
| Saisir notes multiples | ✅ | ✅ | ✅ | ❌ |
| Supprimer note | ✅ | ✅ | ❌ | ❌ |
| Gérer filières | ✅ | ✅ | ❌ | ❌ |
| Gérer matières | ✅ | ✅ | ❌ | ❌ |

## 🛠️ Architecture Technique

### Backend (Node.js + Express + MySQL)
```
univ-backend/
├── controllers/
│   ├── noteController.js     # Gestion des notes et bulletins
│   ├── filiereController.js  # Gestion des filières et matières
│   └── authController.js     # Authentification
├── routes/
│   ├── notes.js            # Routes pour les notes
│   ├── filieres.js         # Routes pour les filières
│   └── matieres.js         # Routes pour les matières
├── middleware/
│   └── auth.js            # Vérification JWT et rôles
└── config/
    └── db.js              # Configuration base de données
```

### Frontend (React + Vite)
```
frontend/src/
├── pages/
│   ├── NotesPage.jsx        # Consultation des notes
│   ├── NotesSaisiePage.jsx # Saisie des notes (NOUVEAU)
│   └── FilieresPage.jsx    # Gestion des filières et matières
├── components/
│   ├── ui/                # Composants UI réutilisables
│   └── layout/            # Layout principal
└── services/
    └── api.js             # Service API avec intercepteurs
```

## 📝 Fonctionnalités

### 1. Saisie des Notes (/notes/saisie)
- **Recherche avancée** : Par nom, matricule, filière, niveau
- **Saisie individuelle** : Note par note avec validation temps réel
- **Saisie par lot** : Plusieurs notes en une seule requête
- **Validation automatique** : Notes entre 0 et 20
- **Calcul en temps réel** : Moyennes et mentions automatiques
- **Export PDF** : Bulletins générés automatiquement

### 2. Gestion des Filières (/filieres)
- **CRUD complet** : Créer, modifier, désactiver des filières
- **Gestion des matières** : Ajout de matières par filière
- **Assignation enseignants** : Liaison matière-enseignant
- **Validation** : Codes uniques, coefficients valides

### 3. Consultation des Notes (/notes)
- **Bulletins détaillés** : Par semestre et par matière
- **Moyennes automatiques** : Calculées avec coefficients
- **Mentions** : Admis/Rattrapage/Ajourné
- **Export PDF** : Téléchargement des relevés

## 🔧 API Endpoints

### Notes
```
GET    /api/notes/inscription/:id     # Notes d'une inscription
GET    /api/notes/bulletin/:id        # Bulletin complet
POST   /api/notes                     # Saisie note individuelle
POST   /api/notes/batch               # Saisie multiple
DELETE /api/notes/:id                 # Supprimer note
```

### Filières
```
GET    /api/filieres                   # Liste des filières
POST   /api/filieres                   # Créer filière
PUT    /api/filieres/:id              # Modifier filière
DELETE /api/filieres/:id              # Désactiver filière
```

### Matières
```
GET    /api/filieres/:id/matieres     # Matières d'une filière
POST   /api/filieres/matieres         # Ajouter matière
PUT    /api/filieres/matieres/:id     # Modifier matière
DELETE /api/filieres/matieres/:id     # Supprimer matière
GET    /api/filieres/enseignants/liste # Liste enseignants
```

## 🎨 Interface Utilisateur

### Page de Saisie des Notes
1. **Filtres de recherche** :
   - Recherche textuelle (nom/matricule)
   - Filtre par filière
   - Filtre par niveau (L1-L3, M1-M2)

2. **Sélection de l'inscription** :
   - Liste déroulante avec informations complètes
   - Format : "Nom (Matricule) — Filière Niveau Année"

3. **Saisie des notes** :
   - Tableau par semestre
   - Champs numériques (0-20, pas de 0.5)
   - Calcul automatique des notes pondérées
   - Affichage des moyennes par semestre

4. **Actions** :
   - Enregistrer les modifications
   - Supprimer une note (admin/secrétaire uniquement)
   - Générer PDF du bulletin

### Page de Gestion des Filières
1. **Liste des filières** :
   - Affichage en cartes
   - Nombre de matières par filière
   - Actions : Modifier/Désactiver

2. **Gestion des matières** :
   - Développement par filière
   - Ajout/Modification/Suppression
   - Assignation d'enseignant
   - Validation des coefficients

## 🚀 Installation et Démarrage

### Backend
```bash
cd univ-backend
npm install
npm run dev  # ou npm start pour production
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Base de données
```bash
# Importer le schéma
mysql -u root -p < database.sql
```

## 🔒 Sécurité

### Authentification
- Tokens JWT avec expiration
- Rôles et permissions vérifiés
- Middleware de protection des routes

### Validation
- Notes entre 0 et 20
- Codes uniques pour filières/matieres
- Coefficients valides
- Protection contre les injections SQL

## 📊 Base de Données

### Tables principales
```sql
users          # Utilisateurs et rôles
filieres       # Filières d'études
matieres       # Matières par filière
etudiants      # Informations étudiants
inscriptions   # Inscriptions par année
notes          # Notes par inscription/matière
```

### Contraintes
- Clés étrangères avec CASCADE/RESTRICT
- Uniques sur codes et inscriptions
- CHECK sur notes (0-20)

## 🎯 Cas d'Utilisation

### Enseignant
1. Se connecter avec ses identifiants
2. Accéder à "Saisie Notes" dans le menu
3. Rechercher l'étudiant par nom/matricule
4. Sélectionner l'inscription appropriée
5. Saisir les notes dans les champs prévus
6. Cliquer sur "Enregistrer les notes"
7. Générer le PDF si nécessaire

### Secrétaire
1. Accès aux mêmes fonctionnalités que l'enseignant
2. Peut également gérer les filières et matières
3. Peut supprimer des notes
4. Peut gérer les inscriptions

### Administrateur
1. Accès complet à toutes les fonctionnalités
2. Gestion des filières et matières
3. Gestion des utilisateurs
4. Supervision complète du système

## 🐛 Dépannage

### Problèmes courants
1. **Notes non enregistrées** : Vérifier les permissions et la connexion
2. **Calculs incorrects** : Vérifier les coefficients dans la base
3. **PDF généré vide** : Vérifier qu'il y a des notes enregistrées
4. **Accès refusé** : Vérifier le rôle de l'utilisateur

### Logs
- Backend : Console Node.js pour les erreurs serveur
- Frontend : Console navigateur pour les erreurs client
- Base de données : Logs MySQL pour les requêtes

## 🔄 Mises à Jour Futures

### Améliorations prévues
- Import/Export Excel des notes
- Notifications automatiques aux étudiants
- Historique des modifications
- Statistiques et graphiques
- Mode hors-ligne pour la saisie

---

**Version actuelle** : 1.0.0  
**Dernière mise à jour** : Mai 2025  
**Développeur** : Système UniGest
