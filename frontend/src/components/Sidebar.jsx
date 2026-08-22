// La sidebar porte les COLLECTIONS (Ma bibliothèque, Wishlist, Administration),
// jamais les statuts de lecture : les pills à l'intérieur de chaque écran
// filtrent par reading_status, ce composant ne s'en occupe pas (skill Lykos,
// section Navigation). Un livre abandonné reste dans la bibliothèque : c'est
// un état de lecture, pas un rangement différent.

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// NavLink reçoit une fonction pour distinguer le lien actif (collection
// actuellement affichée) des autres, sans avoir à comparer l'URL nous-mêmes
function linkClassName({ isActive }) {
  return isActive
    ? "block rounded-lg bg-[#174ED8] px-3 py-2 text-sm font-medium text-white"
    : "block rounded-lg px-3 py-2 text-sm text-[#434655] hover:bg-[#E2E2E2]";
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex flex-col gap-4 sm:h-full sm:justify-between">
      {/* liens en ligne sur mobile (la sidebar est empilée en haut et ne doit
          pas pousser le contenu trop bas), en colonne a partir de sm: quand
          la sidebar retrouve sa hauteur pleine a gauche */}
      <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-0 sm:space-y-1">
        <NavLink to="/bibliotheque" className={linkClassName}>
          Ma bibliothèque
        </NavLink>

        <NavLink to="/wishlist" className={linkClassName}>
          Wishlist
        </NavLink>

        {/* Administration n'est pas une collection de livres comme les deux
            précédentes : c'est un espace réservé aux administrateurs, d'où le
            filet qui la sépare visuellement, et l'affichage conditionnel sur
            user.role (miroir du role.middleware côté backend) */}
        {user?.role === "admin" && (
          <>
            <hr className="my-2 hidden border-[#E2E2E2] sm:block" />
            <NavLink to="/admin" className={linkClassName}>
              Administration
            </NavLink>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={logout}
        className="rounded-lg px-3 py-2 text-left text-sm text-[#434655] hover:bg-[#E2E2E2]"
      >
        Se déconnecter
      </button>
    </nav>
  );
}
