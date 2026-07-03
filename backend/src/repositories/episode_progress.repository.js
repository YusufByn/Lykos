// Repository de la table episode_progress.
// Regroupe toutes les requetes SQL liees au suivi episode par episode des series.
// Les controllers appellent ces fonctions au lieu d'ecrire du SQL directement.

import { pool } from "../config/db.js";

// colonnes communes reutilisees dans toutes les requetes de ce fichier
const EPISODE_COLUMNS =
  "id, season_number, episode_number, watched_at, rating, comment, updated_at, media_tracking_id";

// recupere tous les episodes suivis pour un media_tracking donne,
// tries par saison puis par episode pour un affichage dans l'ordre
export async function findEpisodesByMediaTracking(mediaTrackingId) {

  const [rows] = await pool.execute(
    `SELECT ${EPISODE_COLUMNS} FROM episode_progress WHERE media_tracking_id = ? ORDER BY season_number, episode_number`,
    [mediaTrackingId],
  );

  return rows;
}

// recupere un episode par son id
// (c'est le controller qui verifie ensuite que l'episode appartient au bon utilisateur)
export async function findEpisodeById(id) {

  const [rows] = await pool.execute(
    `SELECT ${EPISODE_COLUMNS} FROM episode_progress WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0];
}

// recupere un episode precis via sa position (saison + numero) dans un suivi donne,
// utile pour savoir si on doit creer ou juste mettre a jour la ligne quand on coche
export async function findEpisodeByPosition(mediaTrackingId, seasonNumber, episodeNumber) {

  const [rows] = await pool.execute(
    `SELECT ${EPISODE_COLUMNS} FROM episode_progress
     WHERE media_tracking_id = ? AND season_number = ? AND episode_number = ? LIMIT 1`,
    [mediaTrackingId, seasonNumber, episodeNumber],
  );

  return rows[0];
}

// cree la ligne de progression pour un episode jamais coche avant,
// rating et comment restent vides tant que l'utilisateur ne les renseigne pas
export async function createEpisodeProgress({ mediaTrackingId, seasonNumber, episodeNumber, watchedAt }) {

  const [result] = await pool.execute(
    "INSERT INTO episode_progress (season_number, episode_number, watched_at, media_tracking_id) VALUES (?, ?, ?, ?)",
    [seasonNumber, episodeNumber, watchedAt, mediaTrackingId],
  );

  // on relit la ligne fraichement creee pour renvoyer un objet complet
  return findEpisodeById(result.insertId);
}

// met a jour uniquement la date de visionnage d'un episode deja existant
// (watchedAt = une date si on coche, null si on decoche)
export async function updateWatchedAt(id, watchedAt) {

  await pool.execute(
    "UPDATE episode_progress SET watched_at = ? WHERE id = ?",
    [watchedAt, id],
  );

  return findEpisodeById(id);
}

// met a jour la note et le commentaire d'un episode existant
export async function updateEpisodeDetails(id, { rating, comment }) {

  await pool.execute(
    "UPDATE episode_progress SET rating = ?, comment = ? WHERE id = ?",
    [rating, comment, id],
  );

  return findEpisodeById(id);
}
