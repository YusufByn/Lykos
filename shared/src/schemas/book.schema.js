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
//
// Divergence assumee avec createBookSchema, la deuxieme apres series_title :
// ici tout champ optionnel accepte null, alors qu'aucun ne l'accepte a la
// creation. A la creation, un champ non renseigne est simplement absent du
// corps : l'omission suffit a dire "pas de valeur", et autoriser null en plus
// n'ajouterait qu'un second moyen d'exprimer exactement la meme chose.
// En modification, l'omission a deja un autre sens : "ne pas toucher a ce
// champ". Sans null, il devenait donc impossible d'effacer une valeur deja
// enregistree : la chaine vide est refusee par .date() comme par les types
// numeriques, et omettre la cle veut dire "ne pas modifier". null est la seule
// valeur JSON qui exprime "vide ce champ", d'ou .nullable() ici uniquement.
// Cela donne une regle unique cote front (voir buildPayload dans BookForm.jsx) :
// en edition, un champ optionnel vide part a null. Et une seule representation
// de l'absence en base, NULL et jamais "" : c'est deja le sens des 4 dates, ou
// une valeur nulle dit que l'evenement n'a pas eu lieu.
//
// Quatre champs echappent volontairement a .nullable() :
// - title, author_last_name et reading_status : un livre ne peut pas les
//   perdre, les vider n'aurait aucun sens (ils restent en .min(1) ou en enum) ;
// - series_title, qui garde son mecanisme d'origine : la chaine vide y est
//   deja le signal de detachement de saga, interprete par resolveSeriesId()
//   dans book.controller.js, teste et valide en F4. Ajouter null lui donnerait
//   deux facons d'exprimer la meme intention, sans rien resoudre de plus.
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1).optional(),

    author_first_name: z.string().trim().min(1).nullable().optional(),
    author_last_name: z.string().trim().min(1).optional(),
    // chaine vide autorisee ici : c'est le signal pour retirer le livre de sa saga
    series_title: z.string().trim().optional(),
    volume_number: z.number().int().positive().nullable().optional(),

    publication_year: z.number().int().nullable().optional(),
    publisher: z.string().trim().nullable().optional(),
    page_count: z.number().int().positive().nullable().optional(),
    isbn: z.string().trim().nullable().optional(),
    cover_url: z.string().trim().nullable().optional(),
    summary: z.string().nullable().optional(),

    reading_status: z.enum(READING_STATUSES).optional(),
    rating: z.number().int().min(1, "La note doit être comprise entre 1 et 5.").max(5, "La note doit être comprise entre 1 et 5.").nullable().optional(),
    comment: z.string().nullable().optional(),

    wishlisted_at: z.string().date(DATE_ERROR).nullable().optional(),
    acquired_at: z.string().date(DATE_ERROR).nullable().optional(),
    started_reading_at: z.string().date(DATE_ERROR).nullable().optional(),
    finished_reading_at: z.string().date(DATE_ERROR).nullable().optional(),
  })
  // Object.keys sur les donnees deja validees : si le body est vide ({}),
  // il n'y a rien a modifier, ca n'a pas de sens d'accepter la requete
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être fourni pour la modification.",
  });
