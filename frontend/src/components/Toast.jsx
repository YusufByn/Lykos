// Petite notification de succès affichée en superposition (position fixed).
// Pas de portail React (createPortal) : un positionnement fixed suffit pour
// flotter au-dessus du reste de la page, un portail ajouterait un concept en
// plus pour un bénéfice nul ici (pas de conflit d'overflow/z-index à résoudre).
//
// Toast ne décide jamais seul de rediriger : c'est BookForm.jsx qui garde la
// main sur le délai avant de changer de page (via son propre useEffect), ce
// composant se contente d'afficher le message et de pouvoir se fermer plus
// tôt sur un clic, d'où le useState local pour son propre affichage.

import { useState } from "react";

export default function Toast({ message }) {
  const [closed, setClosed] = useState(false);

  if (closed) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg border border-[#E2E2E2] bg-green-50 px-4 py-3 shadow-lg"
    >
      <p className="text-sm text-[#1B1B1B]">{message}</p>

      <button
        type="button"
        onClick={() => setClosed(true)}
        aria-label="Fermer la notification"
        className="text-[#434655]"
      >
        ×
      </button>
    </div>
  );
}
