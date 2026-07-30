// Contexte d'authentification global.
// Centralise le token JWT et l'utilisateur connecte, accessibles partout
// dans l'application sans avoir a les faire descendre par props.

import { createContext, useContext, useEffect, useState } from "react";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  // on relit le token dans le localStorage des le premier rendu,
  // comme ca l'utilisateur reste connecte apres un rafraichissement de page
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));

  // même logique pour l'utilisateur : sans ça, isAuthenticated resterait vrai
  // (le token est présent) alors que user vaudrait null après un rafraîchissement,
  // et la sidebar perdrait l'entrée Administration
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);

    // une valeur corrompue dans le localStorage ne doit pas empêcher
    // l'application de démarrer : on retombe sur null dans ce cas
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // le token et l'utilisateur sont traités ici l'un après l'autre, chacun
  // selon sa propre valeur : ce n'est pas une synchronisation entre les deux
  // clés, juste deux écritures indépendantes regroupées dans le même effet
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [token, user]);

  // appelee apres un login ou un register reussi (voir services/api.js)
  function login(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  // appelee pour deconnecter l'utilisateur
  function logout() {
    setToken(null);
    setUser(null);
  }

  const value = {
    token,
    user,
    // isAuthenticated sert dans PrivateRoute pour savoir si on laisse passer
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook pratique pour consommer le contexte sans importer AuthContext partout
// (regle react-refresh desactivee : ce fichier exporte volontairement le
// provider ET le hook associe, ca n'a aucun impact fonctionnel)
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  // si useAuth est appele hors d'un AuthProvider, on previent tout de suite
  // plutot que de laisser une erreur silencieuse plus tard
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }

  return context;
}
