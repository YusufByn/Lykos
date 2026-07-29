// Contexte d'authentification global.
// Centralise le token JWT et l'utilisateur connecte, accessibles partout
// dans l'application sans avoir a les faire descendre par props.

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// cle utilisee pour garder le token dans le localStorage entre deux visites
const TOKEN_STORAGE_KEY = "lykos_token";

export function AuthProvider({ children }) {

  // on relit le token dans le localStorage des le premier rendu,
  // comme ca l'utilisateur reste connecte apres un rafraichissement de page
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);

  // a chaque fois que le token change, on le sauvegarde ou on le supprime
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

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
