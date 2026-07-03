// Repository de la table media_tracking.
// Regroupe toutes les requetes SQL liees a la watchlist personnelle des utilisateurs.
// Les controllers appellent ces fonctions au lieu d'ecrire du SQL directement.

import { pool } from "../config/db.js";

// colonnes communes reutilisees dans toutes les requetes de ce fichier,
// pour ne jamais oublier un champ et eviter de repeter la liste partout
const TRACKING_COLUMNS =
  "id, tmdb_id, media_type, status, global_rating, global_comment, added_at, updated_at, user_id";

// recupere tous les suivis d'un utilisateur, du plus recent au plus ancien
export async function findTrackingByUser(userId) {

  const [rows] = await pool.execute(
    `SELECT ${TRACKING_COLUMNS} FROM media_tracking WHERE user_id = ? ORDER BY added_at DESC`,
    [userId],
  );

  return rows;
}

// recupere un suivi par son id, peu importe le proprietaire
// (c'est le controller qui verifie ensuite que le suivi appartient au bon utilisateur)
export async function findTrackingById(id) {

  const [rows] = await pool.execute(
    `SELECT ${TRACKING_COLUMNS} FROM media_tracking WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0];
}

// verifie si un utilisateur suit deja ce media precis, pour empecher les doublons
export async function findTrackingByUserAndMedia(userId, tmdbId, mediaType) {

  const [rows] = await pool.execute(
    "SELECT id FROM media_tracking WHERE user_id = ? AND tmdb_id = ? AND media_type = ? LIMIT 1",
    [userId, tmdbId, mediaType],
  );

  return rows[0];
}

// ajoute un media a la watchlist d'un utilisateur
export async function createTracking({ userId, tmdbId, mediaType, status, globalRating, globalComment }) {

  const [result] = await pool.execute(
    "INSERT INTO media_tracking (tmdb_id, media_type, status, global_rating, global_comment, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    [tmdbId, mediaType, status, globalRating, globalComment, userId],
  );

  // on relit la ligne fraichement creee pour renvoyer un objet complet (avec added_at, etc.)
  return findTrackingById(result.insertId);
}

// met a jour le statut, la note globale et le commentaire global d'un suivi existant
export async function updateTracking(id, { status, globalRating, globalComment }) {

  await pool.execute(
    "UPDATE media_tracking SET status = ?, global_rating = ?, global_comment = ? WHERE id = ?",
    [status, globalRating, globalComment, id],
  );

  // on relit la ligne pour renvoyer la version a jour (avec le nouveau updated_at)
  return findTrackingById(id);
}

// supprime un suivi de la watchlist
export async function deleteTracking(id) {
  await pool.execute("DELETE FROM media_tracking WHERE id = ?", [id]);
}
