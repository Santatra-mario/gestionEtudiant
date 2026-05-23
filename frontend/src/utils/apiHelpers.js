// utils/apiHelpers.js — Helpers centralisés pour l'API

/**
 * Extrait un tableau depuis n'importe quel format de réponse API
 * Gère: { data: [...] }, { success, data: [...] }, [...]
 */
export function extractArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.matieres)) return data.matieres;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.inscriptions)) return data.inscriptions;
  return [];
}

/**
 * Formate un message d'erreur API
 */
export function formatApiError(error) {
  if (!error) return "Une erreur est survenue";
  if (typeof error === "string") return error;
  
  // Erreur HTTP avec réponse du serveur
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) return error.message;
  
  return "Une erreur inattendue s'est produite";
}

/**
 * Vérifie si une erreur est une erreur 401 (authentification)
 */
export function isAuthError(error) {
  return error?.response?.status === 401;
}

/**
 * Récupère l'ID depuis un objet de réponse flexible
 */
export function getId(obj) {
  return obj?.id || obj?.ID || null;
}
