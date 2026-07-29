// Controller de la bibliotheque (table book).
// Il orchestre la consultation, l'ajout, la modification et la suppression
// des livres de l'utilisateur connecte. Pas de SQL ici : tout passe par les
// repositories book, author et series.
//
// Regle de securite : sur chaque route, req.user.id (extrait du JWT par
// auth.middleware.js) est transmis aux repositories pour finir dans le WHERE
// de la requete SQL. On ne va jamais chercher un livre "en general" puis
// comparer son user_id en JS apres coup.

import { createBookSchema, READING_STATUSES, updateBookSchema } from "@lykos/shared";
import { createAuthor, findAuthorByName } from "../repositories/author.repository.js";
import {
  createBook,
  deleteBook,
  findBookById,
  findBooksByUser,
  updateBook,
} from "../repositories/book.repository.js";
import { createSeries, findSeriesByTitle } from "../repositories/series.repository.js";

// cherche l'auteur en base par prenom + nom, le cree s'il n'existe pas encore,
// et renvoie son id. C'est la "creation implicite" demandee par la roadmap :
// le front envoie juste du texte, jamais un author_id.
async function resolveAuthorId(firstName, lastName) {

  // firstName peut etre undefined (champ optionnel) : on le normalise en null
  // pour que la comparaison en base (IS NULL) fonctionne correctement
  const normalizedFirstName = firstName ?? null;

  let author = await findAuthorByName(normalizedFirstName, lastName);

  // aucun auteur trouve avec ce prenom+nom (recherche insensible a la casse) : on le cree
  if (!author) {
    author = await createAuthor({ first_name: normalizedFirstName, last_name: lastName });
  }

  return author.id;
}

// meme logique que resolveAuthorId, mais pour la saga. Contrairement a l'auteur,
// la saga est vraiment facultative : si seriesTitle est vide, on renvoie null
// et le livre reste un "one-shot" (pas de saga).
async function resolveSeriesId(seriesTitle) {

  // pas de titre de saga fourni -> pas de saga, series_id reste NULL
  if (!seriesTitle) {
    return null;
  }

  let series = await findSeriesByTitle(seriesTitle);

  if (!series) {
    series = await createSeries({ title: seriesTitle });
  }

  return series.id;
}

// liste les livres de l'utilisateur connecte, avec filtres optionnels en query string
export async function getLibrary(req, res) {

  // les filtres arrivent toujours en texte dans une query string (ex. ?status=reading)
  const { status, owned, wishlisted, series } = req.query;

  // si un statut est fourni, on verifie que c'est bien une des 4 valeurs connues
  // avant de la transmettre a la requete SQL, plutot que de renvoyer une liste
  // vide sans explication pour une faute de frappe
  if (status && !READING_STATUSES.includes(status)) {
    return res.status(400).json({
      message: "Le statut de lecture est invalide.",
    });
  }

  try {
    const books = await findBooksByUser(req.user.id, {
      status,
      // owned/wishlisted arrivent en chaine ("true"/"false") dans la query,
      // on les transforme en vrai booleen pour le repository
      owned: owned === "true",
      wishlisted: wishlisted === "true",
      series,
    });

    return res.status(200).json(books);
  } catch (error) {
    console.error("Erreur lors de la récupération de la bibliothèque :", error.message);

    return res.status(500).json({
      message: "Erreur lors de la récupération de la bibliothèque.",
    });
  }
}

// recupere le detail d'un livre precis
export async function getBookDetails(req, res) {

  const { id } = req.params;

  try {
    // findBookById filtre deja sur user_id dans son WHERE (voir book.repository.js)
    const book = await findBookById(id, req.user.id);

    // livre inexistant OU appartenant a un autre utilisateur : meme reponse 404
    // dans les deux cas, pour ne jamais reveler l'existence du livre a quelqu'un
    // qui n'a pas le droit de le voir
    if (!book) {
      return res.status(404).json({
        message: "Livre introuvable.",
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error("Erreur lors de la récupération du livre :", error.message);

    return res.status(500).json({
      message: "Erreur lors de la récupération du livre.",
    });
  }
}

// ajoute un livre a la bibliotheque de l'utilisateur connecte
export async function addBook(req, res) {

  const validation = createBookSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors[0].message,
    });
  }

  const data = validation.data;

  try {
    // creation implicite de l'auteur et de la saga (voir fonctions plus haut)
    const authorId = await resolveAuthorId(data.author_first_name, data.author_last_name);
    const seriesId = await resolveSeriesId(data.series_title);

    // tous les champs non fournis sont normalises en null : pool.execute()
    // n'accepte pas "undefined" comme valeur de parametre
    const book = await createBook({
      user_id: req.user.id,
      author_id: authorId,
      series_id: seriesId,
      title: data.title,
      publication_year: data.publication_year ?? null,
      publisher: data.publisher ?? null,
      page_count: data.page_count ?? null,
      isbn: data.isbn ?? null,
      cover_url: data.cover_url ?? null,
      summary: data.summary ?? null,
      volume_number: data.volume_number ?? null,
      reading_status: data.reading_status,
      rating: data.rating ?? null,
      comment: data.comment ?? null,
      wishlisted_at: data.wishlisted_at ?? null,
      acquired_at: data.acquired_at ?? null,
      started_reading_at: data.started_reading_at ?? null,
      finished_reading_at: data.finished_reading_at ?? null,
    });

    return res.status(201).json(book);
  } catch (error) {
    console.error("Erreur lors de l'ajout du livre :", error.message);

    return res.status(500).json({
      message: "Erreur lors de l'ajout du livre.",
    });
  }
}

// modifie un livre existant (PATCH partiel)
export async function updateBookDetails(req, res) {

  const { id } = req.params;

  const validation = updateBookSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: validation.error.errors[0].message,
    });
  }

  const data = validation.data;

  try {
    // on verifie d'abord que le livre existe ET appartient a l'utilisateur
    // connecte, exactement comme pour getBookDetails (404 dans les deux cas)
    const existingBook = await findBookById(id, req.user.id);

    if (!existingBook) {
      return res.status(404).json({
        message: "Livre introuvable.",
      });
    }

    // on ne construit que les colonnes reellement envoyees dans le body,
    // pour ne modifier que ce que l'utilisateur a explicitement change
    const fields = {};

    if (data.title !== undefined) fields.title = data.title;
    if (data.publication_year !== undefined) fields.publication_year = data.publication_year;
    if (data.publisher !== undefined) fields.publisher = data.publisher;
    if (data.page_count !== undefined) fields.page_count = data.page_count;
    if (data.isbn !== undefined) fields.isbn = data.isbn;
    if (data.cover_url !== undefined) fields.cover_url = data.cover_url;
    if (data.summary !== undefined) fields.summary = data.summary;
    if (data.volume_number !== undefined) fields.volume_number = data.volume_number;
    if (data.reading_status !== undefined) fields.reading_status = data.reading_status;
    if (data.rating !== undefined) fields.rating = data.rating;
    if (data.comment !== undefined) fields.comment = data.comment;
    if (data.wishlisted_at !== undefined) fields.wishlisted_at = data.wishlisted_at;
    if (data.acquired_at !== undefined) fields.acquired_at = data.acquired_at;
    if (data.started_reading_at !== undefined) fields.started_reading_at = data.started_reading_at;
    if (data.finished_reading_at !== undefined) fields.finished_reading_at = data.finished_reading_at;

    // si un nom d'auteur est envoye dans le PATCH, on reapplique la meme
    // creation implicite qu'a l'ajout (recherche insensible a la casse, sinon creation)
    if (data.author_last_name !== undefined) {
      fields.author_id = await resolveAuthorId(data.author_first_name, data.author_last_name);
    }

    // series_title present dans le body : soit on rattache a une saga (existante
    // ou creee a la volee), soit on retire le livre de sa saga si le titre est vide
    if (data.series_title !== undefined) {
      fields.series_id = await resolveSeriesId(data.series_title);
    }

    const updatedBook = await updateBook(id, req.user.id, fields);

    return res.status(200).json(updatedBook);
  } catch (error) {
    console.error("Erreur lors de la modification du livre :", error.message);

    return res.status(500).json({
      message: "Erreur lors de la modification du livre.",
    });
  }
}

// supprime un livre de la bibliotheque de l'utilisateur connecte
export async function removeBook(req, res) {

  const { id } = req.params;

  try {
    // deleteBook filtre deja sur user_id : impossible de supprimer le livre
    // de quelqu'un d'autre, meme en connaissant son id
    const wasDeleted = await deleteBook(id, req.user.id);

    if (!wasDeleted) {
      return res.status(404).json({
        message: "Livre introuvable.",
      });
    }

    // 204 : suppression reussie, pas de contenu a renvoyer
    return res.status(204).send();
  } catch (error) {
    console.error("Erreur lors de la suppression du livre :", error.message);

    return res.status(500).json({
      message: "Erreur lors de la suppression du livre.",
    });
  }
}
