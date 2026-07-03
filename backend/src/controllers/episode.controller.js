// Controller du suivi episodique (episode_progress).
// Il orchestre la consultation de la progression, le fait de cocher/decocher
// un episode, et la modification de sa note ou de son commentaire.
// Pas de SQL ici, tout passe par les repositories episode_progress et media_tracking.

import { markEpisodeSchema, updateEpisodeSchema } from "@lykos/shared";
import { findTrackingById } from "../repositories/media_tracking.repository.js";
import {
  createEpisodeProgress,
  findEpisodeById,
  findEpisodeByPosition,
  findEpisodesByMediaTracking,
  updateEpisodeDetails,
  updateWatchedAt,
} from "../repositories/episode_progress.repository.js";

// recupere la progression (liste des episodes suivis) d'une serie suivie
export async function getProgress(req, res) {

  // variable mediaTrackingId qui recupere le parametre d'url :mediaTrackingId
  const { mediaTrackingId } = req.params;

  try {
    // on verifie d'abord que le suivi existe et appartient a l'utilisateur connecte
    const mediaTracking = await findTrackingById(mediaTrackingId);

    if (!mediaTracking) {
      return res.status(404).json({ 
        message: "Suivi introuvable." 
      });
    }

    // on compare l'id du jwt a l'id proprietaire du suivi, comme sur la watchlist
    if (mediaTracking.user_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès à ce suivi." 
      });
    }

    const episodes = await findEpisodesByMediaTracking(mediaTrackingId);

    return res.status(200).json(episodes);
  } catch (error) {
    console.error("Erreur lors de la récupération de la progression :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la récupération de la progression." 
    });
  }
}

// coche ou decoche un episode (POST /api/progress)
// cocher enregistre la date du jour dans watched_at, decocher la remet a null
export async function markEpisode(req, res) {

  // variable validation : on parse le body de la request avec le schema zod partage
  const validation = markEpisodeSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  const { mediaTrackingId, seasonNumber, episodeNumber, watched } = validation.data;

  try {
    // on verifie que le suivi (media_tracking) appartient bien a l'utilisateur connecte
    // avant de toucher a la moindre progression d'episode
    const mediaTracking = await findTrackingById(mediaTrackingId);

    if (!mediaTracking) {
      return res.status(404).json({ 
        message: "Suivi introuvable." 
      });
    }

    if (mediaTracking.user_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès à ce suivi." 
      });
    }

    // watched a true -> on enregistre la date du jour, false -> on remet a null
    const watchedAt = watched ? new Date() : null;

    // on regarde si une ligne existe deja pour cet episode precis
    const existingEpisode = await findEpisodeByPosition(mediaTrackingId, seasonNumber, episodeNumber);

    let episode;

    if (existingEpisode) {
      // l'episode a deja ete coche au moins une fois, on met juste a jour la date
      episode = await updateWatchedAt(existingEpisode.id, watchedAt);
    } else {
      // premiere fois qu'on touche a cet episode, on cree la ligne
      episode = await createEpisodeProgress({
        mediaTrackingId,
        seasonNumber,
        episodeNumber,
        watchedAt,
      });
    }

    return res.status(200).json(episode);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'épisode :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la mise à jour de l'épisode." 
    });
  }
}

// modifie la note ou le commentaire d'un episode existant (PATCH /api/progress/:id)
export async function updateEpisode(req, res) {

  // variable id qui recupere le parametre d'url :id (id de la ligne episode_progress)
  const { id } = req.params;

  const validation = updateEpisodeSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  try {
    const existingEpisode = await findEpisodeById(id);

    // si l'episode n'existe pas du tout en base, 404
    if (!existingEpisode) {
      return res.status(404).json({ 
        message: "Épisode introuvable." 
      });
    }

    // l'episode ne connait pas directement son proprietaire, on passe par son suivi
    const mediaTracking = await findTrackingById(existingEpisode.media_tracking_id);

    // on verifie que ce suivi appartient bien a l'utilisateur connecte
    if (!mediaTracking || mediaTracking.user_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès à cet épisode." 
      });
    }

    // on garde l'ancienne valeur si le champ n'est pas envoye dans la requete,
    // comme pour la modification d'un suivi de la watchlist
    const updatedEpisode = await updateEpisodeDetails(id, {
      rating: validation.data.rating ?? existingEpisode.rating,
      comment: validation.data.comment ?? existingEpisode.comment,
    });

    return res.status(200).json(updatedEpisode);
  } catch (error) {
    console.error("Erreur lors de la modification de l'épisode :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la modification de l'épisode." 
    });
  }
}
