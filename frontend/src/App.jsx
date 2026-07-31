// Racine de l'application côté routage.
// Déclare toutes les routes de l'app ; chaque page réelle sera branchée ici
// au fur et à mesure des fonctionnalités suivantes (F14 à F15).
import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import BookDetail from "./pages/BookDetail";
import BookForm from "./pages/BookForm";
import ForgotPassword from "./pages/ForgotPassword";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Wishlist from "./pages/Wishlist";

// Page temporaire utilisée tant que les vraies pages n'existent pas encore.
// Sert uniquement à valider que le routeur, le contexte et Tailwind
// fonctionnent bien ensemble (critère de validation de F8).
function PlaceholderPage({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
    </div>
  );
}

function App() {
  return (
    // AuthProvider englobe toutes les routes pour que useAuth() soit
    // disponible dans n'importe quelle page de l'application
    <AuthProvider>
      <Routes>
        {/* routes publiques, accessibles sans connexion */}
        <Route path="/" element={<PlaceholderPage title="Accueil (F15)" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* le lien envoyé par mail.service.js met le token en query string
            (?token=...), pas en paramètre de chemin : la page lit le token
            avec useSearchParams, voir ResetPassword.jsx */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* /dashboard n'existe plus depuis le pivot vers le suivi de lecture.
            La redirection est publique et non imbriquée dans PrivateRoute :
            l'URL est réécrite d'abord, PrivateRoute protège ensuite la
            nouvelle route. Sinon un visiteur non connecté serait envoyé vers
            /login et la redirection ne serait jamais appliquée. */}
        <Route path="/dashboard" element={<Navigate to="/bibliotheque" replace />} />

        {/* routes connectées : PrivateRoute vérifie la connexion, Layout
            affiche ensuite la sidebar commune et <Outlet /> injecte la page */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/bibliotheque" element={<Library />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/livres/nouveau" element={<BookForm />} />
          <Route path="/livres/:id" element={<BookDetail />} />
          <Route path="/livres/:id/modifier" element={<BookForm />} />
        </Route>

        {/* route admin : AdminRoute vérifie en plus le rôle avant d'afficher
            le même Layout que les autres écrans connectés */}
        <Route
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<PlaceholderPage title="Administration (F14)" />} />
        </Route>

        {/* route de repli pour toute URL qui ne correspond à rien ci-dessus */}
        <Route path="*" element={<PlaceholderPage title="Page introuvable" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;