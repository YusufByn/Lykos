// Crée et exporte le pool de connexions MySQL.
// Centralise aussi la vérification de la connexion au démarrage.

import mysql from "mysql2/promise";
import { env } from "./env.js";

// Crée un pool de connexions réutilisables pour éviter d'ouvrir
// une nouvelle connexion à chaque requête
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: 10,
});

// Vérifie que la base de données est joignable.
// Lance une erreur (et stoppe le démarrage) si la connexion échoue.
export async function testConnection() {
  try {
    // Requête minimale pour confirmer que le pool peut se connecter
    await pool.query("SELECT NOW()");
    console.log("✅ Connexion à la base de données réussie.");
  } catch (error) {
    console.error("❌ Impossible de se connecter à la base de données :", error.message);
    // On relance l'erreur pour interrompre le démarrage du serveur
    throw error;
  }
}
