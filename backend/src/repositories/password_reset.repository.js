// Repository de la table password_reset.
// Regroupe toutes les requetes SQL liees aux tokens de reinitialisation de mot de passe.
// Les controllers appellent ces fonctions au lieu d'ecrire du SQL directement.

import { pool } from "../config/db.js";

// enregistre un nouveau token de reset pour un utilisateur, avec sa date d'expiration
// (used_at reste null tant que le token n'a pas servi, voir schema.sql)
// tokenHash : empreinte SHA-256 du token, jamais le token en clair (voir auth.controller.js)
export async function createPasswordReset({ userId, tokenHash, expiresAt }) {

  await pool.execute(
    "INSERT INTO password_reset (user_id, token, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt],
  );
}

// cherche un token de reset par son empreinte (tokenHash)
// (c'est le controller qui verifie ensuite s'il est expire ou deja utilise)
export async function findPasswordResetByToken(tokenHash) {

  const [rows] = await pool.execute(
    "SELECT id, user_id, token, expires_at, used_at, created_at FROM password_reset WHERE token = ? LIMIT 1",
    [tokenHash],
  );

  return rows[0];
}

// marque un token comme utilise, pour garantir qu'il ne peut servir qu'une seule fois
export async function markPasswordResetAsUsed(id) {

  await pool.execute(
    "UPDATE password_reset SET used_at = NOW() WHERE id = ?",
    [id],
  );
}
