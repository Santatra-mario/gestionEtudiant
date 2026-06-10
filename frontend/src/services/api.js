// frontend/src/services/api.js
import axios from 'axios'

// ── Base URL backend ──────────────────────────────────────────────────────────
// En dev  : Vite proxy redirige /api → localhost:3000 (vite.config.js)
// En prod : Utilise VITE_API_URL si défini, sinon URL relative
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const UPLOADS_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// ── Helper : construit l'URL complète d'une photo étudiant ───────────────────
// Utilisation : getPhotoUrl(etudiant.photo)
// En dev  → "/uploads/photos/photo-xxx.png"  (proxied par Vite)
// En prod → "http://IP_SERVEUR:3000/uploads/photos/photo-xxx.png"
export function getPhotoUrl(filename) {
  if (!filename) return null
  return `${UPLOADS_URL}/uploads/photos/${filename}`
}

// ✅ Intercepteur requête : envoie le token JWT à chaque appel
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// ✅ Intercepteur réponse : redirige vers /login si token expiré (401)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
