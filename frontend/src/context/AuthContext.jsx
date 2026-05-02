// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ FIX : au démarrage, on synchronise le token sur les deux endroits :
  //    1) api.defaults.headers (pour les appels immédiats avant l'intercepteur)
  //    2) l'intercepteur de api.js gère les appels suivants automatiquement
  useEffect(() => {
    const token = localStorage.getItem('token')
    const saved  = localStorage.getItem('user')
    if (token && saved) {
      try {
        const parsedUser = JSON.parse(saved)
        // Synchroniser le token sur l'instance axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(parsedUser)
      } catch {
        // JSON corrompu → on nettoie
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    // ✅ Synchroniser immédiatement sur l'instance axios
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
