// Protège une route réservée aux administrateurs : redirige vers /login si
// l'utilisateur n'est pas connecté, vers /bibliotheque s'il est connecté mais
// n'a pas le rôle admin. Utilisation dans App.jsx : <AdminRoute><AdminDashboard /></AdminRoute>
//
// Cette protection relève de l'expérience utilisateur, pas de la sécurité :
// elle évite juste d'afficher un écran admin à quelqu'un qui n'y a pas droit.
// La vraie barrière reste le role.middleware côté serveur, qui refuse la
// requête même si l'URL est forcée directement dans le navigateur.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  // pas connecté du tout -> même traitement que PrivateRoute
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // connecté mais rôle différent d'admin -> pas d'accès à l'espace admin
  if (user?.role !== "admin") {
    return <Navigate to="/bibliotheque" replace />;
  }

  return children;
}
