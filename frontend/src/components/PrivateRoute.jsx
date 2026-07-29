// Protege une route : redirige vers /login si l'utilisateur n'est pas connecte.
// Utilisation dans App.jsx : <PrivateRoute><Dashboard /></PrivateRoute>

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();

  // pas de token valide -> on renvoie l'utilisateur vers la page de connexion
  // "replace" evite de garder la page protegee dans l'historique du navigateur
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
