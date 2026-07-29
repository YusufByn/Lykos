// Schémas de validation liés à la bibliothèque (table book).
// Partagés entre backend et frontend pour garder les mêmes règles des deux côtés.
// Convention : les noms de champs collent exactement aux colonnes SQL (snake_case),
// pas de traduction camelCase <-> snake_case a faire nulle part.

import { z } from "zod";

// les 4 statuts de lecture possibles (voir schema.sql : colonne reading_status)
export const READING_STATUSES = ["to_read", "reading", "read", "abandoned"];

// message d'erreur reutilise pour les 4 dates de suivi (meme format partout)
const DATE_ERROR = "La date doit être au format AAAA-MM-JJ.";

// schema pour ajouter un livre (POST /api/books)
// title et author_last_name sont les deux seuls champs vraiment obligatoires :
// - author_first_name est optionnel car certains auteurs n'ont qu'un seul nom
//   (Homere, Voltaire...), voir schema.sql
// - series_title et volume_number sont optionnels : tous les livres ne font
//   pas partie d'une saga (cas du "one-shot")
export const createBookSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),

  // champs texte libres : le controller s'en sert pour creer l'auteur et la
  // saga s'ils n'existent pas deja en base (voir book.controller.js)
  author_first_name: z.string().trim().min(1).optional(),
  author_last_name: z.string().trim().min(1, "Le nom de l'auteur est obligatoire."),
  series_title: z.string().trim().min(1).optional(),
  volume_number: z.number().int().positive().optional(),

  // champs descriptifs, tous facultatifs
  publication_year: z.number().int().optional(),
  publisher: z.string().trim().optional(),
  page_count: z.number().int().positive().optional(),
  isbn: z.string().trim().optional(),
  cover_url: z.string().trim().optional(),
  summary: z.string().optional(),

  // statut par defaut : to_read, comme un livre qu'on vient juste d'ajouter a la liste
  reading_status: z.enum(READING_STATUSES).default("to_read"),
  rating: z.number().int().min(1, "La note doit être comprise entre 1 et 5.").max(5, "La note doit être comprise entre 1 et 5.").optional(),
  comment: z.string().optional(),

  // les 4 dates de suivi sont independantes du statut (voir skill Lykos) :
  // une date NULL/absente signifie juste que l'evenement n'a pas eu lieu
  wishlisted_at: z.string().date(DATE_ERROR).optional(),
  acquired_at: z.string().date(DATE_ERROR).optional(),
  started_reading_at: z.string().date(DATE_ERROR).optional(),
  finished_reading_at: z.string().date(DATE_ERROR).optional(),
});

// schema pour modifier un livre existant (PATCH /api/books/:id)
// tous les champs sont optionnels ici : un PATCH ne modifie que ce qui est
// envoye. Le .refine tout en bas interdit quand meme un body totalement vide,
// qui n'aurait aucun sens (rien a modifier).
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).optional(),

    author_first_name: z.string().trim().min(1).optional(),
    author_last_name: z.string().trim().min(1).optional(),
    // chaine vide autorisee ici : c'est le signal pour retirer le livre de sa saga
    series_title: z.string().trim().optional(),
    volume_number: z.number().int().positive().optional(),

    publication_year: z.number().int().optional(),
    publisher: z.string().trim().optional(),
    page_count: z.number().int().positive().optional(),
    isbn: z.string().trim().optional(),
    cover_url: z.string().trim().optional(),
    summary: z.string().optional(),

    reading_status: z.enum(READING_STATUSES).optional(),
    rating: z.number().int().min(1, "La note doit être comprise entre 1 et 5.").max(5, "La note doit être comprise entre 1 et 5.").optional(),
    comment: z.string().optional(),

    wishlisted_at: z.string().date(DATE_ERROR).optional(),
    acquired_at: z.string().date(DATE_ERROR).optional(),
    started_reading_at: z.string().date(DATE_ERROR).optional(),
    finished_reading_at: z.string().date(DATE_ERROR).optional(),
  })
  // Object.keys sur les donnees deja validees : si le body est vide ({}),
  // il n'y a rien a modifier, ca n'a pas de sens d'accepter la requete
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la modification.",
  });
