# 📖 GUIDE D'UTILISATION - Nouveaux Systèmes

## 1️⃣ Notifications Globales (`useNotification`)

### Importation
```jsx
import { useNotification } from '../context/NotificationContext'
```

### Utilisation
```jsx
function MyComponent() {
  const notify = useNotification()

  const handleSuccess = () => {
    notify.success('Opération réussie! ✅', 3000)
  }

  const handleError = () => {
    notify.error('Une erreur s\'est produite ❌', 5000)
  }

  const handleWarning = () => {
    notify.warning('Attention, action importante ⚠️', 4000)
  }

  const handleInfo = () => {
    notify.info('Information: ceci est un test ℹ️')
  }

  return (
    <div>
      <button onClick={handleSuccess}>Succès</button>
      <button onClick={handleError}>Erreur</button>
      <button onClick={handleWarning}>Attention</button>
      <button onClick={handleInfo}>Info</button>
    </div>
  )
}
```

### Types de Notifications
- **success:** Durée par défaut 4000ms (vert)
- **error:** Durée par défaut 5000ms (rouge)
- **warning:** Durée par défaut 4000ms (orange)
- **info:** Durée par défaut 4000ms (bleu)

---

## 2️⃣ API Helpers (`apiHelpers`)

### Importation
```jsx
import { extractArray, formatApiError, isAuthError } from '../utils/apiHelpers'
```

### `extractArray(data)` — Extraction flexible de tableaux
```jsx
// L'API retourne des formats différents:
// { success: true, data: [...] }
// { data: [...] }
// { matieres: [...] }
// [...]

// extractArray gère tous les cas!
const data = await api.get('/endpoint')
const list = extractArray(data.data) // ✅ Toujours un tableau
```

### `formatApiError(error)` — Messages d'erreur lisibles
```jsx
try {
  await api.post('/endpoint', formData)
} catch (error) {
  const message = formatApiError(error)
  notify.error(message) // ✅ Message clair pour l'utilisateur
}
```

### `isAuthError(error)` — Détection erreurs auth
```jsx
try {
  await api.get('/protected')
} catch (error) {
  if (isAuthError(error)) {
    // Redirection vers login automatique (via interceptor)
  }
}
```

---

## 3️⃣ Modal de Confirmation (`ConfirmationModal`)

### Importation
```jsx
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
```

### Utilisation Simple
```jsx
function MyPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await api.delete(`/items/${id}`)
      notify.success('Supprimé avec succès!')
      setConfirmOpen(false)
      // Recharger la liste...
    } catch (error) {
      notify.error(formatApiError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setConfirmOpen(true)}>
        🗑️ Supprimer
      </button>

      <ConfirmationModal
        open={confirmOpen}
        title="Supprimer l'élément"
        message="Cette action est irréversible. Êtes-vous sûr?"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        loading={loading}
        dangerZone={true} // Affiche un avertissement supplémentaire
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
```

### Props
```jsx
<ConfirmationModal
  open={boolean}                    // Visible ou non
  title="Titre"                     // Titre de la modal
  message="Message d'explication"   // Corps du message
  confirmText="Bouton"              // Texte du bouton confirmer
  cancelText="Bouton"               // Texte du bouton annuler
  variant="danger" | "warning" | "info"  // Style de l'alerte
  loading={boolean}                 // État de chargement
  dangerZone={boolean}              // Affiche "⚠️ Irréversible"
  onConfirm={() => {}}              // Callback confirmation
  onCancel={() => {}}               // Callback annulation
/>
```

---

## 4️⃣ Exemple Complet: Page CRUD

```jsx
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import { extractArray, formatApiError } from '../utils/apiHelpers'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { PageHeader, Card, Btn, Spinner, Table, Tr, Td } from '../components/ui'

export default function ItemsPage() {
  const notify = useNotification()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmState, setConfirmState] = useState({
    open: false,
    itemId: null,
    loading: false,
  })

  // Charger les données
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
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Supprimer un item
  const handleDelete = async (id) => {
    setConfirmState(prev => ({ ...prev, loading: true }))
    try {
      await api.delete(`/items/${id}`)
      notify.success('Item supprimé! ✅')
      await loadItems()
    } catch (error) {
      notify.error(formatApiError(error))
    } finally {
      setConfirmState({ open: false, itemId: null, loading: false })
    }
  }

  if (loading) return <Spinner text="Chargement..." />

  return (
    <>
      <PageHeader
        title="Gestion des Items"
        subtitle="Créer, modifier, supprimer des items"
        action={
          <Btn onClick={() => {}} variant="primary">
            ➕ Ajouter un item
          </Btn>
        }
      />

      <Card>
        <Table headers={['Nom', 'Statut', 'Actions']}>
          {items.map(item => (
            <Tr key={item.id}>
              <Td>{item.nom}</Td>
              <Td>
                <Badge color={item.statut === 'actif' ? 'success' : 'muted'}>
                  {item.statut}
                </Badge>
              </Td>
              <Td>
                <Btn small variant="ghost" onClick={() => {}}>
                  ✏️ Éditer
                </Btn>
                <Btn
                  small
                  variant="ghost"
                  onClick={() =>
                    setConfirmState({
                      open: true,
                      itemId: item.id,
                      loading: false,
                    })
                  }
                >
                  🗑️ Supprimer
                </Btn>
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>

      {/* Modal de confirmation réutilisable */}
      <ConfirmationModal
        open={confirmState.open}
        title="Supprimer l'item"
        message={`Êtes-vous sûr de vouloir supprimer cet item? Cette action est irréversible.`}
        variant="danger"
        loading={confirmState.loading}
        dangerZone={true}
        onConfirm={() => handleDelete(confirmState.itemId)}
        onCancel={() =>
          setConfirmState({ open: false, itemId: null, loading: false })
        }
      />
    </>
  )
}
```

---

## 5️⃣ Checklist Implémentation

Appliquez à chaque page pour cohérence:

- [ ] Importer `useNotification`
- [ ] Importer `{ extractArray, formatApiError }`
- [ ] Importer `ConfirmationModal`
- [ ] Remplacer modales manuelles par `ConfirmationModal`
- [ ] Ajouter `notify.success()` après POST/PUT/DELETE
- [ ] Ajouter `notify.error(formatApiError(error))` dans catch
- [ ] Utiliser `extractArray()` pour parsing API
- [ ] Tester aria-labels avec lecteur d'écran

---

## 🎯 Checklist Accessibilité

Chaque composant doit avoir:

- [ ] `aria-label` sur boutons sans texte
- [ ] `aria-hidden="true"` sur icônes décoratives
- [ ] Focus management dans modales
- [ ] Contraste suffisant (WCAG AA)
- [ ] Support clavier (Tab, Enter, Escape)
- [ ] Labels associés aux inputs

**Exemple:**
```jsx
<button aria-label="Supprimer l'élément" onClick={handleDelete}>
  🗑️
</button>

// Mauvais ❌
<Trash2 size={18} />

// Bon ✅
<Trash2 size={18} aria-hidden="true" />
```

---

## 🚀 Performance Tips

1. **Debounce les recherches:**
```jsx
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useCallback(
  debounce((term) => api.get(`/search?q=${term}`), 300),
  []
)
```

2. **Lazy load les listes longues:**
```jsx
import { useCallback } from 'react'
// Utiliser react-window pour 1000+ items
```

3. **Cache les requêtes:**
```jsx
const cache = useRef({})
const getCached = async (url) => {
  if (cache.current[url]) return cache.current[url]
  const data = await api.get(url)
  cache.current[url] = data
  return data
}
```

---

**Questions?** Consultez les pages existantes qui implémentent déjà ces patterns: `NotesPage.jsx`, `FilieresPage.jsx`, `EtudiantsPage.jsx`
