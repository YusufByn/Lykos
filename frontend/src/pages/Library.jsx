// Écran "Ma bibliothèque" (F10) : les livres possédés (acquired_at renseigné),
// éventuellement filtrés par statut de lecture via les pills. Un livre
// abandonné reste ici : la sidebar choisit la collection, les pills ne
// filtrent que le statut à l'intérieur de cette collection (skill Lykos).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookCard from "../components/BookCard";
import StatusSelector from "../components/StatusSelector";
import { api } from "../services/api";

export default function Library() {
  const [status, setStatus] = useState("all");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // à chaque changement de pill, on relance l'appel API avec le nouveau filtre
  useEffect(() => {
    // "cancelled" protège contre la course entre deux clics rapides sur les
    // pills : si l'utilisateur change de statut avant que la première réponse
    // arrive, cette première réponse (devenue périmée) ne doit pas écraser
    // l'état avec des livres qui ne correspondent plus au filtre affiché
    let cancelled = false;

    async function fetchBooks() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ owned: "true" });

        if (status !== "all") {
          params.set("status", status);
        }

        const data = await api.get(`/books?${params.toString()}`);

        if (!cancelled) {
          setBooks(data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBooks();

    // nettoyage exécuté avant le prochain effet (nouveau statut) ou au
    // démontage du composant : on marque cette requête comme périmée
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1B1B1B]">Ma bibliothèque</h1>

        <Link
          to="/livres/nouveau"
          className="rounded-lg bg-[#174ED8] px-4 py-2 text-sm font-medium text-white"
        >
          Ajouter un livre
        </Link>
      </div>

      <StatusSelector value={status} onChange={setStatus} />

      {loading && <p className="text-sm text-[#434655]">Chargement...</p>}

      {!loading && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && books.length === 0 && (
        <p className="text-sm text-[#434655]">
          {status === "all"
            ? "Aucun livre dans votre bibliothèque pour l'instant."
            : "Aucun livre avec ce statut de lecture."}
        </p>
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
