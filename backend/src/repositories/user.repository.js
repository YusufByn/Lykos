// Repository de la table user.
// Regroupe toutes les requêtes SQL liées aux utilisateurs.
// Les controllers appellent ces fonctions au lieu d'écrire du SQL directement.

import { pool } from "../config/db.js";

// Cherche un utilisateur par email, en récupérant les champs utiles à l'authentification.
// Renvoie undefined si aucun utilisateur ne correspond.
export async function findUserByEmail(email) {
  const [users] = await pool.execute(
    "SELECT id, email, password_hash, role FROM user WHERE email = ? LIMIT 1",
    [email],
  );

  return users[0];
}

// Crée un utilisateur avec un mot de passe déjà hashé.
// Renvoie l'utilisateur créé (id, email, role).
export async function createUser({ email, passwordHash, role }) {
  const [result] = await pool.execute(
    "INSERT INTO user (email, password_hash, role) VALUES (?, ?, ?)",
    [email, passwordHash, role],
  );

  return { id: result.insertId, email, role };
}
