// frontend/src/services/api.js
import axios from "axios";

// ── Base URL backend ──────────────────────────────────────────────────────────
// Utilise les variables d'environnement du fichier .env
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Pour les fichiers uploadés (photos)
const UPLOADS_URL = API_BASE;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes pour les connexions réseau
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Helper : construit l'URL complète d'une photo étudiant ───────────────────
export function getPhotoUrl(filename) {
  if (!filename) return null;
  // Si c'est déjà une URL complète (Cloudinary), on la retourne directement
  if (filename.startsWith("http")) return filename;
  // Sinon ancien format local
  const baseUrl = UPLOADS_URL.endsWith("/")
    ? UPLOADS_URL.slice(0, -1)
    : UPLOADS_URL;
  return `${baseUrl}/uploads/photos/${filename}`;
}

// ✅ Intercepteur requête : envoie le token JWT à chaque appel
api.interceptors.request.use(
  (config) => {
    // Choisir le bon token selon le type de requête
    const isStudentRoute = config.url?.includes("/student/");
    const token = isStudentRoute
      ? localStorage.getItem("student_token")
      : localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Intercepteur réponse : redirige vers /login si token expiré (401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Gestion des erreurs réseau
    if (err.code === "ERR_NETWORK") {
      console.error("❌ Erreur réseau - Backend inaccessible");
      console.error(`URL tentée : ${API_URL}`);
      console.error("Vérifiez que :");
      console.error(`1. Le backend tourne sur ${API_BASE}`);
      console.error("2. Le serveur écoute sur 0.0.0.0");
      console.error("3. Le pare-feu autorise le port 3000");
    }

    if (err.response?.status === 401) {
      const isStudent = !!localStorage.getItem("student_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("student_token");
      localStorage.removeItem("student_user");
      if (isStudent && window.location.pathname !== "/etudiant/login") {
        window.location.href = "/etudiant/login";
      } else if (!isStudent && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

// Fonction de test de connexion (optionnelle)
export async function testConnection() {
  try {
    const response = await api.get("/health");
    console.log("✅ Backend connecté :", response.data);
    return true;
  } catch (error) {
    console.error("❌ Backend inaccessible :", error.message);
    return false;
  }
}

export default api;
