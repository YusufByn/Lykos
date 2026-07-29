// Wrapper fetch maison pour parler a l'API backend.
// Ajoute automatiquement le token JWT, parse le JSON, et centralise
// la gestion des erreurs pour ne pas la repeter dans chaque page.

// grace au proxy configure dans vite.config.js, /api est redirige
// vers le backend en developpement
const API_BASE_URL = "/api";
const TOKEN_STORAGE_KEY = "lykos_token";

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

  const data = await response.json();

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
