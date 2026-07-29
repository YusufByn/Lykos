// Repository de la table book.
// Regroupe toutes les requetes SQL liees aux livres de la bibliotheque.
// Les controllers appellent ces fonctions au lieu d'ecrire du SQL directement.
//
// Regle de securite : le user_id va TOUJOURS dans le WHERE de la requete SQL,
// jamais verifie apres coup en JavaScript. Comme ca, un utilisateur ne peut
// techniquement pas recuperer, modifier ou supprimer le livre d'un autre :
// la requete ne renvoie tout simplement rien si le livre ne lui appartient pas.

import { pool } from "../config/db.js";

// colonnes renvoyees par toutes les requetes de lecture (liste + detail).
// LEFT JOIN (pas INNER JOIN) sur author et book_series : un livre garde son
// author_id obligatoire, mais si jamais series_id est NULL (livre sans saga),
// un INNER JOIN l'aurait fait disparaitre de la liste. LEFT JOIN le garde,
// avec series_title a NULL dans ce cas.
const BOOK_SELECT = `
  SELECT
    book.id, book.user_id, book.author_id, book.series_id,
    book.title, book.publication_year, book.publisher, book.page_count,
    book.isbn, book.cover_url, book.summary, book.volume_number,
    book.reading_status, book.rating, book.comment,
    book.wishlisted_at, book.acquired_at, book.started_reading_at, book.finished_reading_at,
    book.created_at, book.updated_at,
    author.first_name AS author_first_name,
    author.last_name AS author_last_name,
    book_series.title AS series_title
  FROM book
  LEFT JOIN author ON author.id = book.author_id
  LEFT JOIN book_series ON book_series.id = book.series_id
`;

// liste les livres d'un utilisateur, avec filtres optionnels (voir book.controller.js).
// filters.status : une des 4 valeurs de reading_status
// filters.owned : uniquement les livres possedes (acquired_at renseigne)
// filters.wishlisted : uniquement les livres voulus mais pas encore possedes
// filters.series : uniquement les livres d'une saga precise (son id)
export async function findBooksByUser(userId, filters = {}) {

  // le user_id est toujours la premiere condition : c'est elle qui isole
  // la bibliotheque de chaque utilisateur
  const conditions = ["book.user_id = ?"];
  const params = [userId];

  if (filters.status) {
    conditions.push("book.reading_status = ?");
    params.push(filters.status);
  }

  if (filters.owned) {
    conditions.push("book.acquired_at IS NOT NULL");
  }

  // "voulu mais pas encore possede" : wishlisted_at rempli ET acquired_at vide.
  // Les deux dates sont volontairement independantes (voir skill Lykos).
  if (filters.wishlisted) {
    conditions.push("book.wishlisted_at IS NOT NULL AND book.acquired_at IS NULL");
  }

  if (filters.series) {
    conditions.push("book.series_id = ?");
    params.push(filters.series);
  }

  const [rows] = await pool.execute(
    `${BOOK_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY book.created_at DESC`,
    params,
  );

  return rows;
}

// recupere un livre precis, a condition qu'il appartienne bien a userId.
// Si le livre existe mais appartient a quelqu'un d'autre, la requete ne
// renvoie rien (le controller traduit ca en 404, jamais en 403, pour ne pas
// reveler l'existence du livre a un utilisateur qui n'a pas le droit de le voir).
export async function findBookById(id, userId) {

  const [rows] = await pool.execute(
    `${BOOK_SELECT} WHERE book.id = ? AND book.user_id = ? LIMIT 1`,
    [id, userId],
  );

  return rows[0];
}

// cree un nouveau livre. author_id et series_id sont deja resolus par le
// controller (creation implicite) avant d'appeler cette fonction.
export async function createBook(book) {

  const [result] = await pool.execute(
    `INSERT INTO book (
       user_id, author_id, series_id, title, publication_year, publisher,
       page_count, isbn, cover_url, summary, volume_number,
       reading_status, rating, comment,
       wishlisted_at, acquired_at, started_reading_at, finished_reading_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.user_id,
      book.author_id,
      book.series_id,
      book.title,
      book.publication_year,
      book.publisher,
      book.page_count,
      book.isbn,
      book.cover_url,
      book.summary,
      book.volume_number,
      book.reading_status,
      book.rating,
      book.comment,
      book.wishlisted_at,
      book.acquired_at,
      book.started_reading_at,
      book.finished_reading_at,
    ],
  );

  // on relit le livre fraichement cree pour renvoyer la version complete,
  // avec author_first_name/author_last_name/series_title deja joints
  return findBookById(result.insertId, book.user_id);
}

// met a jour un livre existant. "fields" est un objet { colonne: valeur }
// deja prepare par le controller (jamais construit a partir de cles brutes
// du body de la requete, pour ne jamais injecter un nom de colonne arbitraire).
// Seules les colonnes presentes dans "fields" sont modifiees (PATCH partiel).
export async function updateBook(id, userId, fields) {

  const columns = [];
  const params = [];

  for (const [column, value] of Object.entries(fields)) {
    columns.push(`${column} = ?`);
    params.push(value);
  }

  // securite : le controller a deja verifie qu'on a au moins un champ,
  // mais on se protege quand meme d'un appel avec un objet vide
  if (columns.length === 0) {
    return findBookById(id, userId);
  }

  // user_id dans le WHERE : meme si un id d'un autre utilisateur passait ici,
  // la mise a jour ne toucherait aucune ligne
  params.push(id, userId);

  await pool.execute(
    `UPDATE book SET ${columns.join(", ")} WHERE id = ? AND user_id = ?`,
    params,
  );

  return findBookById(id, userId);
}

// supprime un livre. Renvoie true si une ligne a vraiment ete supprimee,
// false si aucun livre ne correspondait (inexistant ou pas au bon utilisateur).
export async function deleteBook(id, userId) {

  const [result] = await pool.execute(
    "DELETE FROM book WHERE id = ? AND user_id = ?",
    [id, userId],
  );

  return result.affectedRows > 0;
}
