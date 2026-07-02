// Configure l'application Express sans la démarrer.
// Le démarrage est délégué à index.js.

import express from "express";
import cors from "cors";
import routes from "./src/routes/index.js";

const app = express();

// --- Middlewares globaux ---

// Permet de lire le corps des requêtes au format JSON
app.use(express.json());

// Autorise les requêtes cross-origin depuis le frontend
app.use(cors());

// --- Routes ---
// Toutes les routes de l'application passent par ce seul point d'entree,
// voir src/routes/index.js pour le detail de chaque router.
app.use("/api", routes);

export default app;
