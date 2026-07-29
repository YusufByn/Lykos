// Racine de l'application cote routage.
// Declare toutes les routes de l'app ; chaque page reelle sera branchee ici
// au fur et a mesure des fonctionnalites suivantes (F9 a F15).

import { Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

// Page temporaire utilisee tant que les vraies pages n'existent pas encore.
// Sert uniquement a valider que le routeur, le contexte et Tailwind
// fonctionnent bien ensemble (critere de validation de F8).
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
        {/* route publique, deviendra la Landing page (F15) */}
        <Route path="/" element={<PlaceholderPage title="Accueil (F15)" />} />

        {/* route de connexion, deviendra la vraie page Login (F9) */}
        <Route path="/login" element={<PlaceholderPage title="Connexion (F9)" />} />

        {/* route protegee de demonstration, deviendra le Dashboard (F10) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PlaceholderPage title="Dashboard (F10)" />
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
