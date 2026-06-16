# 🎓 UniGest — Backend API (Node.js + MySQL + JWT)

## Structure du projet

```
univ-backend/
├── server.js                   # Point d'entrée
├── package.json
├── .env.example                # Variables d'environnement (copier en .env)
├── database.sql                # Schéma + données initiales
├── config/
│   └── db.js                   # Pool de connexions MySQL
├── middleware/
│   └── auth.js                 # Vérification JWT + rôles
├── controllers/
│   ├── authController.js       # Connexion / Inscription users
│   ├── etudiantController.js   # CRUD étudiants
│   ├── inscriptionController.js
│   ├── noteController.js       # Notes + Bulletin
│   ├── filiereController.js    # Filières + Matières
│   └── dashboardController.js  # Statistiques
├── routes/
│   ├── auth.js
│   ├── etudiants.js
│   ├── inscriptions.js
│   ├── notes.js
│   ├── filieres.js
│   └── dashboard.js
└── uploads/
    └── photos/                 # Photos étudiants
```

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Remplissez DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET

# 3. Créer la base de données
mysql -u root -p < database.sql

# 4. Lancer le serveur
npm run dev        # développement (nodemon)
npm start          # production
```

---

## Endpoints API

### 🔐 Authentification

| Méthode | Endpoint          | Accès   | Description                  |
|---------|-------------------|---------|------------------------------|
| POST    | /api/auth/login   | Public  | Connexion → retourne JWT     |
| POST    | /api/auth/register| Admin   | Créer un utilisateur         |
| GET     | /api/auth/me      | Connecté| Profil utilisateur connecté  |

**Exemple login :**
```json
POST /api/auth/login
{ "email": "admin@univ.mg", "password": "Admin1234" }

Réponse :
{ "success": true, "token": "eyJ...", "user": { "id":1, "role":"administrateur" } }
```

---

### 👨‍🎓 Étudiants — /api/etudiants

| Méthode | Endpoint          | Rôles autorisés           |
|---------|-------------------|---------------------------|
| GET     | /                 | Tous                      |
| GET     | /:id              | Tous                      |
| POST    | /                 | Administrateur, Secrétaire|
| PUT     | /:id              | Administrateur, Secrétaire|
| DELETE  | /:id              | Administrateur seulement  |

**Paramètres GET / (filtres) :**
- `?search=rakoto` — recherche nom/prénom/matricule
- `?filiere=INFO` — filtre par code filière
- `?niveau=L2` — filtre par niveau
- `?annee=2025-2026`
- `?page=1&limit=20` — pagination

**Exemple POST (multipart/form-data) :**
```
nom=Rakoto, prenom=Jean, date_naissance=2002-05-14,
sexe=M, filiere_id=1, photo=[fichier image]
```

---

### 📋 Inscriptions — /api/inscriptions

| Méthode | Endpoint                        | Description               |
|---------|---------------------------------|---------------------------|
| GET     | /                               | Liste toutes les inscriptions |
| GET     | /historique/:etudiantId         | Historique d'un étudiant  |
| POST    | /                               | Inscrire un étudiant      |
| PATCH   | /:id/statut                     | Changer le statut         |
| DELETE  | /:id                            | Supprimer                 |

**Exemple POST :**
```json
{
  "etudiant_id": 1,
  "filiere_id": 1,
  "niveau": "L2",
  "annee_universitaire": "2025-2026",
  "date_inscription": "2025-09-01"
}
```

**Exemple PATCH statut :**
```json
{ "statut": "suspendu" }
// Valeurs : actif | suspendu | diplome | abandonne
```

---

### 📝 Notes — /api/notes

| Méthode | Endpoint                          | Description               |
|---------|-----------------------------------|---------------------------|
| GET     | /inscription/:inscriptionId       | Notes d'une inscription   |
| GET     | /bulletin/:inscriptionId          | Bulletin complet + moyenne|
| POST    | /                                 | Ajouter/modifier une note |
| POST    | /batch                            | Saisie multiple           |
| DELETE  | /:id                              | Supprimer une note        |

**Exemple POST note unique :**
```json
{ "inscription_id": 1, "matiere_id": 3, "note": 14.5 }
```

**Exemple POST batch :**
```json
{
  "inscription_id": 1,
  "notes": [
    { "matiere_id": 1, "note": 14 },
    { "matiere_id": 2, "note": 12 },
    { "matiere_id": 3, "note": 10 }
  ]
}
```

**Exemple réponse bulletin :**
```json
{
  "inscription": { "etudiant_nom": "Rakoto Jean", "filiere_nom": "Informatique", "niveau": "L2" },
  "bulletin": {
    "S1": {
      "notes": [...],
      "moyenne": 12.33,
      "mention": "Admis"
    }
  }
}
```

---

### 🏫 Filières & Matières — /api/filieres

| Méthode | Endpoint                  | Description               |
|---------|---------------------------|---------------------------|
| GET     | /                         | Toutes les filières       |
| POST    | /                         | Créer une filière         |
| PUT     | /:id                      | Modifier                  |
| DELETE  | /:id                      | Désactiver (soft delete)  |
| GET     | /:filiereId/matieres      | Matières d'une filière    |
| POST    | /matieres                 | Ajouter une matière       |
| PUT     | /matieres/:id             | Modifier une matière      |
| DELETE  | /matieres/:id             | Supprimer une matière     |

---

### 📊 Dashboard — /api/dashboard

| Méthode | Endpoint     | Description                        |
|---------|--------------|------------------------------------|
| GET     | /stats       | Toutes les statistiques du tableau de bord |

**Réponse :**
```json
{
  "total_etudiants": 1248,
  "total_filieres": 6,
  "inscriptions_en_attente": 14,
  "taux_reussite": 78,
  "par_filiere": [{ "filiere": "Informatique", "nb_etudiants": 312 }],
  "par_niveau": [{ "niveau": "L1", "nb": 420 }],
  "derniers_inscrits": [...]
}
```

---

## Rôles et permissions

| Fonctionnalité         | Administrateur | Secrétaire | Enseignant |
|------------------------|:--------------:|:----------:|:----------:|
| Voir étudiants         | ✅ | ✅ | ✅ |
| Créer/modifier étudiant| ✅ | ✅ | ❌ |
| Supprimer étudiant     | ✅ | ❌ | ❌ |
| Gérer inscriptions     | ✅ | ✅ | ❌ |
| Saisir notes           | ✅ | ❌ | ✅ |
| Gérer filières         | ✅ | ❌ | ❌ |
| Créer utilisateurs     | ✅ | ❌ | ❌ |

---

## En-tête Authorization (toutes les routes protégées)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

MAX_FILE_SIZE=5242880

# Cloudinary
CLOUDINARY_CLOUD_NAME=dig3ss1au
CLOUDINARY_API_KEY=374735458647145
CLOUDINARY_API_SECRET=sROyZ5ILy9YYP5JBMwvM_-FmKQk

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=sandratrarazanamparany@gmail.com
EMAIL_PASS=osihwwlbrapcxglm
EMAIL_FROM=UniGest <sandratrarazanamparany@gmail.com>
STUDENT_LOGIN_URL=http://localhost:5173/etudiant/login
