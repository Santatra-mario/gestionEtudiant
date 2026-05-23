# 💡 TIPS & COMMANDES UTILES

## ⚡ Commandes Essentielles

### Backend (univ-backend/)
```bash
# Installation et démarrage
npm install              # Installer dépendances
npm start                # Démarrer serveur (production)
npm run dev              # Démarrer avec nodemon (développement)

# Base de données
mysql -u root < database.sql    # Importer schéma
mysql -u root -p < database.sql # Avec mot de passe

# Logs
tail -f npm-debug.log    # Suivre erreurs en temps réel
```

### Frontend (frontend/)
```bash
# Installation et démarrage
npm install              # Installer dépendances
npm run dev              # Démarrer Vite dev server
npm run build            # Build production
npm run preview          # Prévisualiser build

# Nettoyage
rm -rf node_modules      # Supprimer dépendances
npm cache clean --force  # Nettoyer cache npm
```

---

## 🐛 Débogage & Troubleshooting

### Erreur: "Cannot GET /api/..."
```bash
# Cause: Backend n'est pas démarré
# Solution:
cd univ-backend
npm run dev  # S'assurer que le backend tourne sur port 3000
```

### Erreur: "EADDRINUSE: address already in use :::3000"
```bash
# Cause: Port 3000 déjà utilisé
# Solution (Linux/Mac):
lsof -i :3000           # Voir quel process utilise le port
kill -9 <PID>           # Tuer le process

# Windows:
netstat -ano | findstr :3000    # Voir quel process
taskkill /PID <PID> /F          # Tuer le process
```

### Erreur: "MODULE_NOT_FOUND"
```bash
# Cause: Module non installé
# Solution:
rm -rf node_modules
npm install
npm run dev
```

### Erreur: "Cannot read property 'data' of undefined"
```js
// ❌ MAUVAIS
const list = response.data.data.items  // Risque crash

// ✅ BON
const list = extractArray(response.data)
```

### Erreur: "401 Unauthorized"
```bash
# Cause: Token expiré ou invalide
# Solution: Reconnexion automatique via interceptor
# Vérifier: localStorage.getItem('token')
```

---

## 🔍 Console DevTools Tips

### Inspecter le token
```js
// Chrome Console
localStorage.getItem('token')     // Voir le JWT
localStorage.getItem('user')      // Voir l'utilisateur
localStorage.removeItem('token')  // Effacer le token
```

### Tester l'API directement
```js
// Chrome Console - Test GET
fetch('http://localhost:3000/api/etudiants', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(d => console.log(d))

// Test POST
fetch('http://localhost:3000/api/etudiants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ nom: 'Test', prenom: 'User' })
})
.then(r => r.json())
.then(d => console.log(d))
```

### Network tab
```
1. Ouvrir DevTools (F12)
2. Aller à l'onglet "Network"
3. Faire l'action qui bug
4. Cliquer sur la requête API
5. Vérifier:
   - Status code (200, 401, 500?)
   - Headers Authorization
   - Response (erreur serveur?)
```

---

## 🎨 CSS & Styling Tips

### Couleurs du thème (variables CSS)
```css
/* Accéder dans Dev Tools */
var(--bg)              /* Fond */
var(--surface)         /* Surface principal */
var(--surface2)        /* Surface secondaire */
var(--surface3)        /* Surface tertiaire */
var(--text)            /* Texte principal */
var(--text-muted)      /* Texte pâle */
var(--accent)          /* Couleur principale (doré) */
var(--danger)          /* Danger (rouge) */
var(--success)         /* Succès (vert) */
var(--warning)         /* Warning (orange) */
var(--border)          /* Bordures */
```

### Override rapide en Dev
```js
// Console
document.documentElement.style.setProperty('--accent', '#ff0000')
```

---

## ✅ Checklist Avant Commit

```bash
# 1. Vérifier erreurs
npm run build 2>&1 | grep -i error

# 2. Vérifier console (pas d'erreurs)
# - Ouvrir app
# - F12 > Console
# - Faire les actions
# - Zéro erreur rouge?

# 3. Vérifier design
# - Mode clair/sombre
# - Responsive (F12 > Device toolbar)
# - Aria-labels (F12 > Inspect élément)

# 4. Git
git status
git add .
git commit -m "feat: description courte"
git push
```

---

## 🚀 Performance Tips

### Checker performance
```js
// Chrome Console
performance.mark('start')
// ... action utilisateur ...
performance.mark('end')
performance.measure('action', 'start', 'end')
performance.getEntries().pop()
```

### Optimisations rapides
```jsx
// ❌ Mauvais - requête à chaque keystroke
onChange={e => api.get(`/search?q=${e.target.value}`)}

// ✅ Bon - debounce
const handleSearch = useMemo(
  () => debounce((term) => api.get(`/search?q=${term}`), 300),
  []
)
onChange={e => handleSearch(e.target.value)}
```

---

## 📱 Mobile Testing

### Device emulation
```
DevTools > F12 > Ctrl+Shift+M (ou Cmd+Shift+M)
Choisir device preset (iPhone, iPad, etc)
```

### Tester sur vrai téléphone
```bash
# Voir IP locale
ipconfig getifaddr en0    # Mac
ipconfig | grep IPv4      # Windows

# Accéder depuis téléphone
http://<IP_LOCALE>:5173
```

---

## 🔐 Sécurité Checklist

- [ ] Pas de token en URL: `?token=...` ❌
- [ ] Pas d'infos sensibles dans localStorage (MVP OK, production: HttpOnly)
- [ ] HTTPS en production ✅
- [ ] CSP headers configurés ✅
- [ ] CORS restrictif ✅
- [ ] Rate limiting auth ✅

---

## 📚 Ressources Utiles

| Sujet | Lien |
|-------|------|
| React Docs | https://react.dev |
| Vite | https://vitejs.dev |
| React Router | https://reactrouter.com |
| Lucide Icons | https://lucide.dev |
| MDN Web Docs | https://developer.mozilla.org |
| WCAG Accessibility | https://www.w3.org/WAI/WCAG21/quickref/ |

---

## 🎓 Code Examples

### Composant Page Complète (Template)
```jsx
import { useState, useEffect } from 'react'
import { useNotification } from '../context/NotificationContext'
import { extractArray, formatApiError } from '../utils/apiHelpers'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import api from '../services/api'

export default function ItemsPage() {
  const notify = useNotification()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false })

  // Charger données
  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/items')
      setItems(extractArray(res.data))
    } catch (error) {
      notify.error(formatApiError(error))
    } finally {
      setLoading(false)
    }
  }

  // Supprimer
  const handleDelete = async (id) => {
    setConfirm(p => ({ ...p, loading: true }))
    try {
      await api.delete(`/items/${id}`)
      notify.success('Supprimé!')
      await loadItems()
    } catch (error) {
      notify.error(formatApiError(error))
    } finally {
      setConfirm({ open: false, id: null, loading: false })
    }
  }

  return (
    <>
      {/* Contenu */}
      <div>...</div>

      {/* Modal confirmation */}
      <ConfirmationModal
        open={confirm.open}
        onConfirm={() => handleDelete(confirm.id)}
        onCancel={() => setConfirm({ open: false })}
        loading={confirm.loading}
      />
    </>
  )
}
```

---

## ❓ FAQ

**Q: Où sont les images des étudiants?**  
A: `univ-backend/uploads/photos/`

**Q: Comment ajouter une nouvelle page?**  
A: 
1. Créer `frontend/src/pages/MonPage.jsx`
2. Importer dans `App.jsx`
3. Ajouter route
4. Ajouter nav item dans `Layout.jsx`

**Q: Comment changer les couleurs?**  
A: Modifier `frontend/src/styles/theme.css` ou variables CSS globales

**Q: La base de données est où?**  
A: Variables d'env dans `.env`

**Q: Comment ajouter des permissions?**  
A: Modifier `user.role` dans DB et vérifier dans `NAV` et routes

---

**Dernière mise à jour:** 18 Mai 2026
