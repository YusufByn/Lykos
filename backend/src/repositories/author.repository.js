// Repository de la table author.
// Regroupe les requetes SQL liees aux auteurs.
// Table en LECTURE SEULE cote API (voir book.controller.js) : un auteur n'est
// jamais modifie ni supprime via une route, seulement cree en effet de bord
// de l'ajout d'un livre (creation implicite).

import { pool } from "../config/db.js";

// cherche un auteur par prenom + nom, en ignorant la casse.
// Ca evite de creer un doublon si l'utilisateur tape "pierce brown" alors
// qu'un auteur "Pierce Brown" existe deja en base.
// firstName peut etre null (auteur avec un seul nom, ex. Voltaire) : dans ce
// cas on cherche un auteur dont first_name est aussi null.
export async function findAuthorByName(firstName, lastName) {

  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name FROM author
     WHERE LOWER(last_name) = LOWER(?)
       AND (
         (first_name IS NULL AND ? IS NULL)
         OR LOWER(first_name) = LOWER(?)
       )
     LIMIT 1`,
    [lastName, firstName, firstName],
  );

  return rows[0];
}

// cree un nouvel auteur. Appele uniquement quand findAuthorByName n'a rien trouve.
export async function createAuthor({ first_name, last_name }) {

  const [result] = await pool.execute(
    "INSERT INTO author (first_name, last_name) VALUES (?, ?)",
    [first_name ?? null, last_name],
  );

  return { id: result.insertId, first_name: first_name ?? null, last_name };
}
