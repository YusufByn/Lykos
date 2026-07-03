// Schémas de validation liés au suivi episodique (episode_progress).
// Partages entre backend et frontend pour garder les memes regles des deux cotes.

import { z } from "zod";

// schema pour cocher ou decocher un episode (POST /api/progress)
export const markEpisodeSchema = z.object({
  // id du suivi (media_tracking) auquel appartient la serie, pas l'id tmdb
  mediaTrackingId: z.number().int().positive(),
  seasonNumber: z.number().int().min(1),
  episodeNumber: z.number().int().min(1),
  // true = on coche l'episode comme vu, false = on le decoche
  watched: z.boolean(),
});

// schema pour modifier la note ou le commentaire d'un episode (PATCH /api/progress/:id)
// les deux champs sont optionnels, on ne modifie que ce qui est envoye
export const updateEpisodeSchema = z.object({
  // note optionnelle sur 5, comme la note globale d'un media
  rating: z.number().min(0).max(5).nullable().optional(),
  comment: z.string().nullable().optional(),
});
