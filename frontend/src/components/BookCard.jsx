// Carte livre utilisée dans les grilles de Ma bibliothèque et de la Wishlist.
// Un composant, un rôle : afficher la couverture et l'identité d'un livre,
// puis renvoyer vers sa fiche détail au clic.

import { useState } from "react";
import { Link } from "react-router-dom";

// initiales du titre utilisées comme repli visuel quand il n'y a pas de
// couverture, ou que l'URL fournie par l'utilisateur ne charge pas (voir
// skill Lykos, section Couvertures)
function getInitials(title) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

export default function BookCard({ book }) {
  // cover_url est saisie librement par l'utilisateur (pas un fichier uploadé) :
  // elle peut être absente, invalide, ou pointer vers un lien mort. On part
  // directement sur le repli si aucune URL n'est fournie, et onError bascule
  // dessus si le chargement de l'image échoue une fois tentée.
  const [imageFailed, setImageFailed] = useState(!book.cover_url);

  const authorName = [book.author_first_name, book.author_last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to={`/livres/${book.id}`} className="block">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-[#E2E2E2] bg-white">
        {imageFailed ? (
          <div className="flex h-full w-full items-center justify-center bg-[#E2E2E2] text-2xl font-semibold text-[#434655]">
            {getInitials(book.title)}
          </div>
        ) : (
          <img
            src={book.cover_url}
            alt={book.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <p className="mt-2 truncate text-sm font-medium text-[#1B1B1B]">{book.title}</p>
      <p className="truncate text-sm text-[#434655]">{authorName}</p>
    </Link>
  );
}
