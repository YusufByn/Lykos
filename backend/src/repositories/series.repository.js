// Repository de la table book_series.
// Regroupe les requetes SQL liees aux sagas.
// Table en LECTURE SEULE cote API (voir book.controller.js) : une saga n'est
// jamais modifiee ni supprimee via une route, seulement creee en effet de bord
// de l'ajout d'un livre (creation implicite).

import { pool } from "../config/db.js";

// cherche une saga par titre, en ignorant la casse (meme logique que pour
// l'auteur : evite de creer deux sagas pour "Red Rising" et "red rising").
export async function findSeriesByTitle(title) {

  const [rows] = await pool.execute(
    "SELECT id, title, total_volumes FROM book_series WHERE LOWER(title) = LOWER(?) LIMIT 1",
    [title],
  );

  return rows[0];
}

// cree une nouvelle saga. Appele uniquement quand findSeriesByTitle n'a rien trouve.
// total_volumes reste NULL a la creation : on ne le connait pas forcement au
// moment ou l'utilisateur ajoute son premier tome.
export async function createSeries({ title }) {

  const [result] = await pool.execute(
    "INSERT INTO book_series (title) VALUES (?)",
    [title],
  );

  return { id: result.insertId, title, total_volumes: null };
}
