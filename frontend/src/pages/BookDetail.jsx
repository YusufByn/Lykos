// Page de detail d'un livre (F12).
// C'est cet ecran, et non BookCard, qui porte l'affichage complet : couverture,
// identite, saga, details editoriaux, resume, et le bloc de suivi personnel
// (statut, note, commentaire, les 4 dates). BookCard reste volontairement
// minimal (couverture, titre, auteur) et renvoie ici au clic.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { READING_STATUS_LABELS } from "../constants";
import { api } from "../services/api";

// initiales du titre utilisees comme repli visuel quand il n'y a pas de
// couverture, ou que l'URL fournie par l'utilisateur ne charge pas (voir
// skill Lykos, section Couvertures). Logique identique a BookCard.jsx, mais
// dupliquee ici plutot que factorisee : les deux ecrans restent autonomes,
// c'est le meme choix deja fait entre Library.jsx et Wishlist.jsx.
function getInitials(title) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// convertit "YYYY-MM-DD" (format renvoye par le backend) en "JJ/MM/AAAA" par
// simple manipulation de chaine, jamais via new Date() : new Date("2026-03-15")
// est interprete comme minuit UTC, puis reaffiche dans le fuseau local du
// navigateur, ce qui peut faire perdre un jour selon ce fuseau. C'est
// exactement le decalage deja rencontre cote backend avec mysql2 (voir skill
// Lykos sur dateStrings) et deja evite dans getTodayLocalDate() de BookForm.jsx.
function formatDate(isoDate) {
  return isoDate.split("-").reverse().join("/");
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  // trois issues possibles du chargement, en plus du cas "toujours en cours" :
  // null (charge avec succes ou pas encore tente), "error" (erreur serveur),
  // "notFound" (livre inexistant ou appartenant a un autre utilisateur : le
  // backend renvoie volontairement la meme reponse dans les deux cas, pour ne
  // jamais reveler l'existence du livre a quelqu'un qui n'a pas le droit de le voir)
  const [loadStatus, setLoadStatus] = useState(null);

  const [imageFailed, setImageFailed] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // charge le livre a chaque changement d'id. React Router peut reutiliser la
  // meme instance de ce composant en passant d'un /livres/:id a un autre (deux
  // urls qui matchent la meme route), sans demonter/remonter le composant :
  // l'effet doit donc bien dependre de id pour recharger, et reinitialiser au
  // passage l'etat propre au livre precedent (image, erreur de suppression)
  useEffect(() => {
    let cancelled = false;

    async function fetchBook() {
      setLoading(true);
      setLoadStatus(null);

      try {
        const data = await api.get(`/books/${id}`);

        if (cancelled) {
          return;
        }

        setBook(data);
        setImageFailed(false);
        setDeleteError("");
      } catch (fetchError) {
        if (cancelled) {
          return;
        }

        if (fetchError.message === "Livre introuvable.") {
          setLoadStatus("notFound");
        } else {
          setLoadStatus("error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBook();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    // suppression irreversible : confirmation obligatoire avant l'appel API.
    // window.confirm reste la solution la plus simple ici, pas de modal
    // maison a construire pour une seule confirmation sur tout l'ecran
    const confirmed = window.confirm(
      "Es-tu sûr de vouloir supprimer ce livre ? Cette action est irréversible.",
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setDeleting(true);

    try {
      await api.delete(`/books/${id}`);

      // meme regle que la redirection post-enregistrement dans BookForm.jsx :
      // possede (acquired_at rempli) -> bibliotheque, sinon -> wishlist
      if (book.acquired_at) {
        navigate("/bibliotheque", { replace: true });
      } else {
        navigate("/wishlist", { replace: true });
      }
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-[#434655]">Chargement...</p>
      </div>
    );
  }

  if (loadStatus === "notFound") {
    return (
      <div className="p-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Livre introuvable.
        </p>
        <Link to="/bibliotheque" className="mt-4 inline-block text-sm font-medium text-[#174ED8]">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div className="p-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Impossible de charger ce livre pour le moment.
        </p>
        <Link to="/bibliotheque" className="mt-4 inline-block text-sm font-medium text-[#174ED8]">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  // repli d'image : soit aucune URL n'a jamais ete fournie, soit le
  // chargement a echoue (lien mort, hotlinking bloque...), voir onError plus bas
  const showCoverFallback = imageFailed || !book.cover_url;

  const authorName = [book.author_first_name, book.author_last_name]
    .filter(Boolean)
    .join(" ");

  // le libelle de saga/tome combine deux champs independants (voir skill
  // Lykos) : les trois cas possibles sont ecrits explicitement plutot qu'en
  // un seul ternaire imbrique, pour rester lisible d'un coup d'oeil
  let seriesLabel = null;

  if (book.series_title && book.volume_number != null) {
    seriesLabel = `Tome ${book.volume_number} de ${book.series_title}`;
  } else if (book.series_title) {
    seriesLabel = book.series_title;
  } else if (book.volume_number != null) {
    seriesLabel = `Tome ${book.volume_number}`;
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="w-48 shrink-0">
          <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-[#E2E2E2] bg-white">
            {showCoverFallback ? (
              <div className="flex h-full w-full items-center justify-center bg-[#E2E2E2] text-3xl font-semibold text-[#434655]">
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
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#1B1B1B]">{book.title}</h1>
          <p className="mt-1 text-[#434655]">{authorName}</p>

          {seriesLabel && <p className="mt-1 text-sm text-[#434655]">{seriesLabel}</p>}

          <div className="mt-4 space-y-1 text-sm text-[#434655]">
            {book.publication_year != null && <p>Année de publication : {book.publication_year}</p>}
            {book.publisher && <p>Éditeur : {book.publisher}</p>}
            {book.page_count != null && <p>Nombre de pages : {book.page_count}</p>}
            {book.isbn && <p>ISBN : {book.isbn}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={`/livres/${id}/modifier`}
              className="rounded-lg bg-[#174ED8] px-4 py-2 text-sm font-medium text-white"
            >
              Modifier
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-[#E2E2E2] px-4 py-2 text-sm text-red-600 disabled:opacity-60"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>

          {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
        </div>
      </div>

      {book.summary && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#1B1B1B]">Résumé</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-[#434655]">{book.summary}</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[#1B1B1B]">Suivi de lecture</h2>

        <p className="mt-2 text-sm text-[#434655]">
          Statut : {READING_STATUS_LABELS[book.reading_status]}
        </p>

        {book.rating != null && (
          <p className="mt-1 text-sm text-[#434655]">Note : {book.rating} / 5</p>
        )}

        {book.comment && (
          <div className="mt-3">
            <p className="text-sm font-medium text-[#1B1B1B]">Commentaire</p>
            <p className="mt-1 whitespace-pre-line text-sm text-[#434655]">{book.comment}</p>
          </div>
        )}

        <div className="mt-3 space-y-1 text-sm text-[#434655]">
          {book.wishlisted_at && <p>Ajouté à la wishlist le : {formatDate(book.wishlisted_at)}</p>}
          {book.acquired_at && <p>Acquis le : {formatDate(book.acquired_at)}</p>}
          {book.started_reading_at && (
            <p>Lecture commencée le : {formatDate(book.started_reading_at)}</p>
          )}
          {book.finished_reading_at && (
            <p>Lecture terminée le : {formatDate(book.finished_reading_at)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
