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
// fonction pour tester la connexion à la db
export async function testConnection(){
    // rows c'est le premier tableau retourné par la requete mysql
    const [rows] = await pool.execute('SELECT NOW() AS now');
    // rows[0].now c'est la date et l'heure actuelle
    console.log("connecté a la db sur mysql à l'heure : ", rows[0].now);
    
}
