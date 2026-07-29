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

  // on return le premier user trouvé dans le tableau si y'en a un
  return users[0];
}

// Crée un utilisateur avec un mot de passe déjà hashé.
// Renvoie l'utilisateur créé (id, email, role).
export async function createUser({ email, passwordHash, role }) {

  const [result] = await pool.execute(
    "INSERT INTO user (email, password_hash, role) VALUES (?, ?, ?)",
    [email, passwordHash, role],
  );

  // on return l'id (insertid car quand on fait un insert avec pool.execute ca renvoie un insertid),
  //  le mail et le role
  return { id: result.insertId, email, role };
}

// Recupere tous les utilisateurs pour le dashboard admin.
// On ne selectionne jamais password_hash ici, l'admin n'a pas besoin de le voir.
export async function findAllUsers() {

  const [users] = await pool.execute(
    "SELECT id, email, created_at FROM user ORDER BY created_at DESC",
  );

  return users;
}

// Compte le nombre total d'utilisateurs inscrits, pour la stat du dashboard admin.
export async function countUsers() {

  const [rows] = await pool.execute("SELECT COUNT(*) AS total FROM user");

  // COUNT(*) renvoie toujousr une seule ligne (total) donc on revnoie total
  return rows[0].total;
}

// Met a jour le mot de passe hashe d'un utilisateur.
// Utilise lors d'un reset de mot de passe (voir resetPassword du controller).
export async function updateUserPassword(userId, passwordHash) {

  await pool.execute(
    "UPDATE user SET password_hash = ? WHERE id = ?",
    [passwordHash, userId],
  );
}
