// Wrapper fetch maison pour parler a l'API backend.
// Ajoute automatiquement le token JWT, parse le JSON, et centralise
// la gestion des erreurs pour ne pas la repeter dans chaque page.

import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../constants";

// grace au proxy configure dans vite.config.js, /api est redirige
// vers le backend en developpement
const API_BASE_URL = "/api";

// fonction generique utilisee par get/post/patch/delete ci-dessous
async function request(path, { method = "GET", body, headers = {} } = {}) {

  // on relit le token directement dans le localStorage a chaque appel,
  // comme ca api.js n'a pas besoin de connaitre AuthContext
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      // on ajoute le header Authorization seulement si on a un token
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (ex: DELETE) n'a pas de corps JSON a parser
  if (response.status === 204) {
    return null;
  }

  // un 401 ne signifie pas la même chose selon que la requête était
  // authentifiée ou non. Token présent : c'était une route protégée, le
  // token est expiré ou invalide, la session est morte et on nettoie tout.
  // Token absent : c'est un simple échec de POST /api/auth/login (mauvais
  // identifiants), il faut laisser le message du backend redescendre vers
  // la page de connexion plutôt que de forcer une redirection.
  if (response.status === 401 && token) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = "/login";
    throw new Error("Session expirée, merci de vous reconnecter.");
  }

  // le corps de la réponse n'est pas forcément du JSON valide : une erreur
  // 500 peut renvoyer une page HTML, ou le proxy Vite peut échouer avant
  // même d'atteindre le backend. On protège le parsing avec un message
  // de repli clair plutôt que de laisser planter l'appelant.
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Réponse invalide du serveur, merci de réessayer.");
  }

  // si le backend renvoie une erreur, on la transforme en exception
  // pour que les pages puissent l'attraper avec un simple try/catch
  if (!response.ok) {
    throw new Error(data.message || "Une erreur est survenue.");
  }

  return data;
}

// objet expose aux pages, un raccourci par methode HTTP utilisee dans l'app
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
