// Écran "Wishlist" (F10) : les livres voulus mais pas encore possédés
// (wishlisted_at renseigné, acquired_at vide). Collection distincte de la
// bibliothèque (skill Lykos, section Navigation) : pas de pills de statut ici,
// la wishlist n'est pas un sous-ensemble filtré par reading_status.
//
// Ce fichier ne factorise pas sa mécanique de chargement avec Library.jsx :
// chacun reste autonome et lisible seul, même si une partie du code se
// ressemble d'un écran à l'autre.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookCard from "../components/BookCard";
import { api } from "../services/api";

export default function Wishlist() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError("");

      try {
        const data = await api.get("/books?wishlisted=true");
        setBooks(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-[#1B1B1B]">Wishlist</h1>

        <Link
          to="/livres/nouveau"
          className="rounded-lg bg-[#174ED8] px-4 py-2 text-sm font-medium text-white"
        >
          Ajouter un livre
        </Link>
      </div>

      {loading && <p className="text-sm text-[#434655]">Chargement...</p>}

      {!loading && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && books.length === 0 && (
        <p className="text-sm text-[#434655]">Votre wishlist est vide pour l'instant.</p>
      )}

      {!loading && !error && books.length > 0 && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
