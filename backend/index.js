// Point d'entrée du serveur.
// Vérifie la connexion à la base de données avant de démarrer Express.

import { testConnection } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import app from "./app.js";

async function start() {
  // On vérifie que la base de données est accessible avant tout
  await testConnection();

  // Démarre le serveur Express sur le port défini dans les variables d'environnement
  app.listen(env.port, () => {
    console.log(`Serveur démarré sur le port ${env.port}`);
  });
}

start();
