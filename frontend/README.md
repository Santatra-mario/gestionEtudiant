# UniGest – Frontend

Interface React pour la gestion universitaire UniGest.

## Stack

- **React 18** + **React Router 6**
- **Tailwind CSS v4** + **PostCSS**
- **Axios** pour les appels API
- **Recharts** pour les graphiques
- **React Hook Form** pour les formulaires

## Installation

```bash
npm install
npm run dev
```

## Configuration

Le frontend utilise un proxy Vite vers `http://localhost:3000` (backend).
Assurez-vous que le backend `univ-backend` tourne avant de lancer le frontend.

## Structure

```
src/
├── context/       AuthContext (JWT, user)
├── services/      api.js (axios instance)
├── components/
│   ├── layout/    Layout, Sidebar
│   └── ui/        Composants réutilisables (Card, Btn, Table, Modal…)
└── pages/
    ├── LoginPage
    ├── DashboardPage    (stats + graphiques)
    ├── EtudiantsPage    (CRUD étudiants)
    ├── EtudiantDetailPage (fiche + historique)
    ├── InscriptionsPage  (CRUD inscriptions)
    ├── NotesPage         (saisie et bulletin)
    ├── FilieresPage      (filières + matières)
    └── UtilisateursPage  (créer comptes)
```

## Rôles

| Rôle           | Accès                                      |
|----------------|--------------------------------------------|
| administrateur | Tout (CRUD + filières + utilisateurs)      |
| secretaire     | Étudiants + inscriptions (sans suppression)|
| enseignant     | Consultation + saisie de notes             |
