/**
 * Messages standardisés et professionnels pour l'application
 * Améliore les notifications avec des messages clairs et cohérents
 */

export const Messages = {
  // Étudiants
  STUDENT_CREATED: (name) => `✓ ${name} a été ajouté(e) à la base de données.`,
  STUDENT_UPDATED: (name) => `✓ Les informations de ${name} ont été mises à jour.`,
  STUDENT_DELETED: (name) => `✓ ${name} a été supprimé(e) de la base de données.`,
  STUDENT_ERROR: "Une erreur s'est produite lors de la gestion de l'étudiant.",

  // Inscriptions
  INSCRIPTION_CREATED: (info) => info ? `✓ Inscription créée avec succès (réf. ${info}).` : "✓ Inscription créée avec succès.",
  INSCRIPTION_UPDATED: (name) => name ? `✓ Inscription de ${name} mise à jour avec succès.` : "✓ Inscription mise à jour avec succès.",
  INSCRIPTION_DELETED: (name) => name ? `✓ Inscription de ${name} supprimée avec succès.` : "✓ Inscription supprimée avec succès.",
  INSCRIPTION_ERROR: "Une erreur s'est produite lors de la gestion de l'inscription.",

  // Filières
  FILIERE_CREATED: (name) => `✓ La filière ${name} a été créée.`,
  FILIERE_UPDATED: (name) => `✓ La filière ${name} a été mise à jour.`,
  FILIERE_DELETED: (name) => `✓ La filière ${name} a été supprimée.`,
  FILIERE_ERROR: "Une erreur s'est produite lors de la gestion de la filière.",

  // Matières
  MATIERE_CREATED: (name) => `✓ La matière ${name} a été ajoutée.`,
  MATIERE_UPDATED: (name) => `✓ La matière ${name} a été mise à jour.`,
  MATIERE_DELETED: (name) => `✓ La matière ${name} a été supprimée.`,
  MATIERE_ERROR: "Une erreur s'est produite lors de la gestion de la matière.",

  // Notes
  NOTES_SAVED: (count) => `✓ ${count} note${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''} avec succès.`,
  NOTE_DELETED: "✓ La note a été supprimée.",
  NOTES_ERROR: "Une erreur s'est produite lors de l'enregistrement des notes.",

  // Utilisateurs
  USER_CREATED: (name) => `✓ L'utilisateur ${name} a été créé.`,
  USER_UPDATED: (name) => `✓ Les informations de ${name} ont été mises à jour.`,
  USER_DELETED: (name) => `✓ L'utilisateur ${name} a été supprimé.`,
  USER_PASSWORD_CHANGED: "✓ Le mot de passe a été modifié avec succès.",
  USER_ERROR: "Une erreur s'est produite lors de la gestion de l'utilisateur.",

  // Présentations
  PRESENCE_SAVED: "✓ Les données de présence ont été enregistrées.",
  PRESENCE_ERROR: "Une erreur s'est produite lors de l'enregistrement de la présence.",

  // Général
  VALIDATION_ERROR: (field) => `${field} est requis.`,
  LOADING_ERROR: "Impossible de charger les données.",
  OPERATION_ERROR: "Une erreur s'est produite. Veuillez réessayer.",
  OPERATION_SUCCESS: "✓ Opération réalisée avec succès.",
};

/**
 * Helper pour formatter les messages d'erreur du serveur
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.message) {
    return error.message;
  }
  return Messages.OPERATION_ERROR;
};

/**
 * Helper pour créer des messages dynamiques
 */
export const createMessage = (template, ...args) => {
  if (typeof template === 'function') {
    return template(...args);
  }
  return template;
};
