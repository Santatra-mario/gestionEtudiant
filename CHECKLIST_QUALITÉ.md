# ✅ CHECKLIST - Standards Qualité & Ergonomie

Appliquez cette checklist à chaque page pour assurer la cohérence de l'application.

## 📋 Checklist Avant Soumission

### Imports Requis
- [ ] `import { useNotification } from '../context/NotificationContext'`
- [ ] `import { extractArray, formatApiError } from '../utils/apiHelpers'`
- [ ] `import { ConfirmationModal } from '../components/ui/ConfirmationModal'` (si suppression)
- [ ] `import api from '../services/api'`

### Gestion d'État
- [ ] État de chargement avec `loading` flag
- [ ] État erreur avec message lisible
- [ ] État modal confirmation (si action danger)
- [ ] État filtre/recherche (si applicable)

### Chargement des Données
```jsx
// ✅ REQUIS
useEffect(() => {
  loadData()
}, [])

const loadData = async () => {
  setLoading(true)
  try {
    const res = await api.get('/endpoint')
    const data = extractArray(res.data) // ← Utiliser helper
    setData(data)
  } catch (error) {
    notify.error(formatApiError(error)) // ← Utiliser helper
  } finally {
    setLoading(false)
  }
}
```

### Feedback Utilisateur
- [ ] Spinner/Skeleton pendant chargement
- [ ] Toast success après POST/PUT/DELETE
- [ ] Toast error avec message clair en cas d'erreur
- [ ] Feedback visuel sur actions (bouton disabled, état loading)

### Suppression/Actions Dangereuses
```jsx
// ✅ REQUIS
const handleDelete = async (id) => {
  setConfirm({ open: true, id, loading: false })
}

// Dans le render:
<ConfirmationModal
  open={confirm.open}
  title="Supprimer l'élément"
  message="Cette action est irréversible..."
  variant="danger"
  dangerZone={true}
  loading={confirm.loading}
  onConfirm={async () => {
    setConfirm(p => ({ ...p, loading: true }))
    try {
      await api.delete(`/endpoint/${confirm.id}`)
      notify.success('Supprimé!')
      await loadData()
    } catch (e) {
      notify.error(formatApiError(e))
    } finally {
      setConfirm({ open: false })
    }
  }}
  onCancel={() => setConfirm({ open: false })}
/>
```

### Formulaires
- [ ] Validation des champs requis
- [ ] Messages d'erreur sous chaque champ
- [ ] Bouton submit désactivé si form invalide
- [ ] État loading sur bouton pendant POST/PUT

### Accessibility (A11y)
- [ ] `aria-label` sur tous les boutons sans texte
- [ ] `aria-hidden="true"` sur icônes décoratives
- [ ] Focus management dans modales
- [ ] Support clavier (Tab, Enter, Escape)
- [ ] Contraste texte/fond suffisant

### Performance
- [ ] Pas de requête à chaque keystroke (debounce)
- [ ] Pas de dépendances infinies dans useEffect
- [ ] Pas de re-renders inutiles
- [ ] Lazy loading pour listes >100 items

### Erreurs Courantes à Éviter
```jsx
// ❌ MAUVAIS
const data = res.data.data.data // Risque undefined

// ✅ BON
const data = extractArray(res.data)

// ❌ MAUVAIS
throw new Error(error.response.data.message)

// ✅ BON
notify.error(formatApiError(error))

// ❌ MAUVAIS
<button onClick={() => api.delete(id)}>Supprimer</button>

// ✅ BON
<ConfirmationModal onConfirm={handleDelete} />

// ❌ MAUVAIS
<Icon /> {/* Pas d'aria-hidden */}

// ✅ BON
<Icon aria-hidden="true" />
```

---

## 🎯 Checklist par Page

### Pages CRUD Standards (Étudiants, Filieres, Matieres, etc.)

- [ ] **En-tête:** PageHeader avec titre + bouton créer
- [ ] **Table:** Avec colonnes pertinentes
- [ ] **Actions par ligne:** Éditer, Supprimer
- [ ] **Modales:** Formulaires d'ajout/édition
- [ ] **Confirmations:** Avant suppression
- [ ] **Recherche:** Si >50 items
- [ ] **Filtres:** Si multiple catégories
- [ ] **Pagination:** Si >100 items
- [ ] **États vides:** EmptyState avec description
- [ ] **Erreurs:** Messages clairs
- [ ] **Loading:** Spinners appropriés

### Pages Détails (Étudiant, Inscription, etc.)

- [ ] **Breadcrumb/Back button:** Navigation claire
- [ ] **Infos affichées:** Formatées correctement
- [ ] **Édition inline:** Ou formulaire modal
- [ ] **Actions:** Modifier, Supprimer, Exporter
- [ ] **Related items:** Listes d'éléments liés
- [ ] **Historique:** Si applicable
- [ ] **Audit trail:** Créé par, modifié le

### Pages Listes/Rapports (Notes, Présences, etc.)

- [ ] **Filtres avancés:** Par filière, niveau, etc.
- [ ] **Tri:** Colonnes triables
- [ ] **Export:** CSV/PDF/Excel
- [ ] **Statistiques:** Résumés haut de page
- [ ] **Graphiques:** Si données numériques
- [ ] **Impression:** Style print CSS

---

## 🧪 Checklist de Test

### Fonctionnalités
- [ ] Créer un élément
- [ ] Modifier un élément
- [ ] Supprimer un élément (avec confirmation)
- [ ] Rechercher/Filtrer
- [ ] Exporter (si applicable)
- [ ] Charger données en grande quantité

### Erreurs
- [ ] API indisponible → Message clair
- [ ] Erreur serveur 500 → Message clair
- [ ] Erreur validation → Messages champs
- [ ] Token expiré → Redirection login
- [ ] Pas de permission → Message accès refusé

### Ergonomie
- [ ] Temps de réponse < 2s
- [ ] Pas de "Erreur" vague ou générique
- [ ] Feedback utilisateur visible
- [ ] Pas de spinner infini
- [ ] Données rafraîchies après action

### Mobile/Responsive
- [ ] Table scrollable horizontalement
- [ ] Modales adaptées
- [ ] Boutons tactiles (min 44px)
- [ ] Pas de scroll horizontal involontaire

### Accessibilité
- [ ] Lecteur d'écran fonctionne
- [ ] Navigation au clavier complète
- [ ] Contraste 4.5:1 pour texte
- [ ] Focus visible
- [ ] Pas de pièges clavier

---

## 📊 Statistiques de Qualité

```
Checklist complète = 100%
Par page: 80-90% minimum requis

Qualité:
- 80% = Acceptable
- 85% = Bon
- 90% = Excellent
- 95%+ = Exceptionnel
```

---

## 🚀 Avant Deployment

```bash
# 1. Vérifier erreurs
npm run build

# 2. Linter
npm run lint

# 3. Tests (à implémenter)
npm test

# 4. Performance
# Chrome DevTools > Lighthouse

# 5. Accessibilité
# Chrome DevTools > Accessibility audit
```

---

**À utiliser pour:**
- Code review
- QA testing
- Onboarding développeurs
- Standards projet
