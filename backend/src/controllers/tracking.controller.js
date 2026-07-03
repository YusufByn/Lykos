// Controller de la watchlist (media_tracking).
// Il orchestre la consultation, l'ajout, la modification et la suppression
// des medias suivis par l'utilisateur connecte. Pas de SQL ici, tout passe
// par le repository media_tracking.

import { createTrackingSchema, updateTrackingSchema } from "@lykos/shared";
import {
  createTracking,
  deleteTracking,
  findTrackingById,
  findTrackingByUser,
  findTrackingByUserAndMedia,
  updateTracking,
} from "../repositories/media_tracking.repository.js";

// liste tous les medias suivis par l'utilisateur connecte
export async function getWatchlist(req, res) {

  try {
    // req.user vient du token decode par auth.middleware.js, on ne fait
    // jamais confiance a un id envoye dans l'url ou le body pour ca
    const tracking = await findTrackingByUser(req.user.id);

    return res.status(200).json(tracking);
  } catch (error) {
    console.error("Erreur lors de la récupération de la watchlist :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la récupération de la watchlist." 
    });
  }
}

// ajoute un media a la watchlist de l'utilisateur connecte
export async function addToWatchlist(req, res) {

  // variable validation : on parse le body de la request avec le schema zod partage
  const validation = createTrackingSchema.safeParse(req.body);

  // si pas de succes dans la validation on renvoie le premier message d'erreur
  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  // destructuration des donnees validees par zod
  const { tmdbId, mediaType, status, globalRating, globalComment } = validation.data;

  try {
    // on verifie d'abord que l'utilisateur n'a pas deja ce media dans sa liste
    const existingTracking = await findTrackingByUserAndMedia(req.user.id, tmdbId, mediaType);

    // si un suivi existe deja pour ce user + ce media, on refuse le doublon
    if (existingTracking) {
      return res.status(409).json({ 
        message: "Ce média est déjà dans votre liste." 
      });
    }

    const tracking = await createTracking({
      userId: req.user.id,
      tmdbId,
      mediaType,
      status,
      // on force null si non fourni, pour rester coherent avec la colonne en base
      globalRating: globalRating ?? null,
      globalComment: globalComment ?? null,
    });

    return res.status(201).json(tracking);
  } catch (error) {
    console.error("Erreur lors de l'ajout à la watchlist :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de l'ajout à la watchlist." 
    });
  }
}

// modifie le statut, la note globale ou le commentaire global d'un suivi existant
export async function updateWatchlistItem(req, res) {

  // variable id qui recupere le parametre d'url :id (id du suivi, pas l'id tmdb)
  const { id } = req.params;

  const validation = updateTrackingSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  try {
    const existingTracking = await findTrackingById(id);

    // si le suivi n'existe pas du tout en base, 404
    if (!existingTracking) {
      return res.status(404).json({ 
        message: "Suivi introuvable." 
      });
    }

    // on verifie que la ressource appartient bien a l'utilisateur connecte
    // (on compare l'id du jwt a l'id proprietaire de la ligne)
    if (existingTracking.user_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès à ce suivi." 
      });
    }

    // on garde l'ancienne valeur si le champ n'est pas envoye dans la requete,
    // comme ca un PATCH partiel (juste le statut par exemple) ne casse pas le reste
    const updatedTracking = await updateTracking(id, {
      status: validation.data.status ?? existingTracking.status,
      globalRating: validation.data.globalRating ?? existingTracking.global_rating,
      globalComment: validation.data.globalComment ?? existingTracking.global_comment,
    });

    return res.status(200).json(updatedTracking);
  } catch (error) {
    console.error("Erreur lors de la modification du suivi :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la modification du suivi." 
    });
  }
}

// supprime un media de la watchlist de l'utilisateur connecte
export async function removeFromWatchlist(req, res) {
  const { id } = req.params;

  try {
    const existingTracking = await findTrackingById(id);

    if (!existingTracking) {
      return res.status(404).json({ 
        message: "Suivi introuvable." 
      });
    }

    // meme verification d'appartenance que pour la modification
    if (existingTracking.user_id !== req.user.id) {
      return res.status(403).json({ 
        message: "Vous n'avez pas accès à ce suivi." 
      });
    }

    await deleteTracking(id);

    // 204 : suppression reussie, pas de contenu a renvoyer
    return res.status(204).send();
  } catch (error) {
    console.error("Erreur lors de la suppression du suivi :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la suppression du suivi." 
    });
  }
}
