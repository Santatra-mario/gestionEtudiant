# Instructions pour intégrer le système de thème clair/sombre

## Étapes d'intégration

### 1. Ajouter le ThemeProvider dans App.jsx

Dans votre fichier principal `App.jsx`, enveloppez l'application avec le ThemeProvider :

```jsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Vos routes existantes */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

### 2. Importer le CSS du thème

Dans votre fichier principal `index.jsx` ou `App.jsx` :

```jsx
import './styles/theme.css';
```

### 3. Utiliser le thème dans les autres composants

Pour utiliser le thème dans d'autres pages :

```jsx
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

function AutrePage() {
  const { isLight, isDark } = useTheme();
  
  return (
    <div>
      <PageHeader
        title="Autre Page"
        action={<ThemeToggle />}
      />
      {/* Contenu de la page */}
    </div>
  );
}
```

### 4. Utiliser les variables CSS

Dans vos styles inline ou CSS :

```jsx
// Styles inline
const style = {
  backgroundColor: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
};

// Dans les fichiers CSS
.ma-classe {
  background-color: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
```

## Fonctionnalités

### 🌓 Mode Clair
- **Texte noir** (`#000000`)
- **Fond blanc** (`#ffffff`)
- **Textes en gras** automatiquement
- **Bordures grises** (`#dee2e6`)

### 🌙 Mode Sombre
- **Texte blanc** (`#ffffff`)
- **Fond sombre** (`#1a1a1a`)
- **Textes normaux** (pas en gras)
- **Bordures grises foncées** (`#555555`)

### 🎨 Couleurs disponibles
- `--text` : Couleur principale du texte
- `--text-muted` : Texte secondaire/grisé
- `--bg` : Fond principal
- `--surface` : Fond des cartes
- `--surface2` : Fond secondaire
- `--border` : Bordures
- `--primary` : Couleur primaire (bleu)
- `--success` : Succès (vert)
- `--warning` : Avertissement (jaune)
- `--danger` : Danger (rouge)
- `--info` : Information (bleu clair)

### 💾 Persistance
Le thème est sauvegardé automatiquement dans `localStorage` et restauré au rechargement de la page.

### 🔄 Transitions
Toutes les transitions entre les thèmes sont fluides (0.3s ease).

## Composants disponibles

### ThemeToggle
Bouton pour basculer entre les thèmes :
- Icône ☀️ pour le mode clair
- Icône 🌙 pour le mode sombre
- Animations au survol
- Adaptatif au thème actuel

### useTheme Hook
```jsx
const { 
  currentTheme,    // 'light' | 'dark'
  theme,          // Objet du thème actuel
  toggleTheme,    // Fonction pour basculer
  isLight,        // Boolean
  isDark          // Boolean
} = useTheme();
```

## Personnalisation

Pour modifier les couleurs, éditez le fichier `src/contexts/ThemeContext.jsx` :

```jsx
light: {
  colors: {
    '--text': '#000000',     // Modifier ici
    '--bg': '#ffffff',       // Modifier ici
    // ... autres couleurs
  }
}
```

## Notes importantes

- Le système utilise des variables CSS pour une compatibilité maximale
- Les styles sont appliqués globalement via l'attribut `data-theme`
- Les textes sont automatiquement en gras en mode clair
- Les transitions sont fluides entre les thèmes
- La configuration est sauvegardée localement
