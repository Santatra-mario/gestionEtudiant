// frontend/src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000,
})

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
      // Nettoyer le stockage local
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Rediriger seulement si on n'est pas déjà sur /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
