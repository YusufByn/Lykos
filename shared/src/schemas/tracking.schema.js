// Schémas de validation liés a la watchlist (media_tracking).
// Partages entre backend et frontend pour garder les memes regles des deux cotes.

import { z } from "zod";

// les 4 statuts possibles pour un media suivi (voir schema.sql : colonne status)
const TRACKING_STATUSES = ["a_regarder", "en_cours", "termine", "abandonne"];

// schema pour ajouter un media a la watchlist (POST /api/watchlist)
export const createTrackingSchema = z.object({
  // id du film/serie cote tmdb, pas notre id a nous
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  // le statut est obligatoire a la creation, pas de valeur par defaut cote zod
  status: z.enum(TRACKING_STATUSES),
  // note optionnelle sur 5, comme des etoiles
  globalRating: z.number().min(0).max(5).nullable().optional(),
  globalComment: z.string().nullable().optional(),
});

// schema pour modifier un suivi existant (PATCH /api/watchlist/:id)
// tous les champs sont optionnels : on ne modifie que ce qui est envoye
export const updateTrackingSchema = z.object({
  status: z.enum(TRACKING_STATUSES).optional(),
  globalRating: z.number().min(0).max(5).nullable().optional(),
  globalComment: z.string().nullable().optional(),
});
