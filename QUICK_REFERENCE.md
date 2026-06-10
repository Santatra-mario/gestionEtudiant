# ⚡ QUICK REFERENCE CARD

**GestionEtudiant Audit - Cheat Sheet**

---

## 🚀 Démarrage Rapide

```bash
# Terminal 1 - Backend
cd univ-backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev

# Ouvrir navigateur
http://localhost:5173
```

---

## 📋 Notifications (useNotification)

```jsx
const notify = useNotification()

notify.success('Message')      // ✅ Vert
notify.error('Message')        // ❌ Rouge
notify.warning('Message')      // ⚠️ Orange
notify.info('Message')         // ℹ️ Bleu
```

**Import:**
```jsx
import { useNotification } from '../context/NotificationContext'
```

---

## 🔧 API Helpers

```jsx
// Extraction flexible (liste)
const items = extractArray(response.data)

// Erreurs lisibles
catch (error) {
  notify.error(formatApiError(error))
}

// Détection auth errors
if (isAuthError(error)) {
  // Redirige auto via interceptor
}
```

**Import:**
```jsx
import { extractArray, formatApiError, isAuthError } from '../utils/apiHelpers'
```

---

## 🗑️ Modal Confirmation

```jsx
const [open, setOpen] = useState(false)

<ConfirmationModal
  open={open}
  title="Supprimer?"
  message="Irréversible"
  variant="danger"
  dangerZone={true}
  loading={loading}
  onConfirm={() => handleDelete()}
  onCancel={() => setOpen(false)}
/>
```

**Import:**
```jsx
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
```

---

## ♿ Accessibilité (a11y)

```jsx
// Bouton icône
<button aria-label="Supprimer" onClick={...}>
  <Trash2 aria-hidden="true" />
</button>

// Input
<input aria-label="Rechercher" type="text" />

// Sélect
<select aria-label="Filtrer">
  <option>Option</option>
</select>
```

---

## 🎨 Couleurs Thème

```css
var(--bg)              /* Fond */
var(--surface)         /* Principal */
var(--surface2)        /* Secondaire */
var(--text)            /* Texte */
var(--text-muted)      /* Texte pâle */
var(--accent)          /* Accent (doré) */
var(--danger)          /* Danger (rouge) */
var(--success)         /* Succès (vert) */
var(--warning)         /* Alerte (orange) */
var(--border)          /* Bordures */
```

---

## 🐛 Débogage

```js
// Console DevTools (F12)
localStorage.getItem('token')
localStorage.getItem('user')

// Tester API
fetch('http://localhost:3000/api/etudiants', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(d => console.log(d))

// Port utilisé?
lsof -i :3000  (Linux/Mac)
netstat -ano | findstr :3000  (Windows)
```

---

## ✅ Avant de Commit

```
1. npm run build → Pas erreurs?
2. F12 Console → Pas erreurs rouges?
3. Actions → Design OK? Notifs?
4. Keyboard → Tab, Enter, Escape OK?
5. Mobile → Responsive OK?
6. Accessibility → aria-labels OK?
```

---

## 📚 Fichiers Important

| Fichier | Raison |
|---------|--------|
| `context/NotificationContext.jsx` | Notifications |
| `utils/apiHelpers.js` | Helpers API |
| `components/ui/ConfirmationModal.jsx` | Confirmations |
| `services/api.js` | Axios config |
| `context/AuthContext.jsx` | Auth/JWT |
| `context/ThemeContext.jsx` | Thème |

---

## 🔄 Page Template

```jsx
import { useState, useEffect } from 'react'
import { useNotification } from '../context/NotificationContext'
import { extractArray, formatApiError } from '../utils/apiHelpers'
import api from '../services/api'

export default function MyPage() {
  const notify = useNotification()
  const [items, setItems] = useState([])

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const res = await api.get('/endpoint')
      setItems(extractArray(res.data))
    } catch (error) {
      notify.error(formatApiError(error))
    }
  }

  return <div>{/* Render items */}</div>
}
```

---

## 🚨 Erreurs Communes

| Erreur | Cause | Fix |
|--------|-------|-----|
| "Cannot GET /api/..." | Backend off | `npm run dev` |
| EADDRINUSE :3000 | Port occupé | `lsof -i :3000` puis kill |
| 401 Unauthorized | Token expiré | Auto-redirect login |
| Cannot read `.data` | Response vide | Utiliser `extractArray()` |
| Missing `aria-label` | a11y fail | Ajouter `aria-label=""` |

---

## 🎯 Checklist Page New

- [ ] Importer `useNotification`
- [ ] Importer `extractArray`, `formatApiError`
- [ ] Ajouter try/catch avec notify
- [ ] Supprimer console.log
- [ ] Ajouter aria-labels
- [ ] Utiliser ConfirmationModal
- [ ] Tester offline/error

---

## 📱 Responsive Breakpoints

```css
Mobile:   < 640px
Tablet:   640px - 1024px
Desktop:  > 1024px
```

---

## 🔑 Roles & Permissions

```js
// Users possibles
admin        → Toutes pages
gestionnaire → Étudiants, Notes, Présences
formateur    → Notes (consultation), Présences
etudiant     → Consulter notes, présences
```

---

## 🗂️ Structure Dossiers

```
frontend/src/
├── pages/           ← Pages principales
├── components/
│   ├── ui/          ← Composants réutilisables
│   └── layout/      ← Layout principal
├── context/         ← State global (Auth, Theme, Notifications)
├── hooks/           ← Custom hooks
├── services/        ← API Axios
├── utils/           ← Helpers (apiHelpers)
└── styles/          ← CSS global
```

---

## 🔐 Données Sensibles

```js
// ✅ OK (localStorage MVP)
localStorage.getItem('token')

// ⚠️ Production
// Utiliser HttpOnly cookies + secure + sameSite
```

---

## 📊 Data Structures

```js
// Student
{ id, nom, prenom, email, photo }

// User
{ id, email, role, createdAt }

// Note
{ id, etudiant_id, matiere_id, note, date }

// Inscription
{ id, etudiant_id, filiere_id, annee }
```

---

## 🎓 Ressources

```
React: https://react.dev
Tailwind: https://tailwindcss.com
Icons: https://lucide.dev
A11y: https://www.w3.org/WAI/WCAG21/quickref/
MDN: https://developer.mozilla.org
```

---

## 📞 Support Rapide

- **Setup issue?** → `TIPS_COMMANDES.md`
- **Utiliser API?** → `GUIDE_UTILISATION.md`
- **Ajouter feature?** → `CHECKLIST_QUALITÉ.md`
- **Comprendre?** → `AUDIT_COMPLET.md`
- **Vue rapide?** → `README_AUDIT.md`

---

**Imprimable & Affichable 🖨️**  
**Dernière mise à jour:** 18 Mai 2026
