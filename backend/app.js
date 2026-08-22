// Configure l'application Express sans la démarrer.
// Le démarrage est délégué à index.js.

import express from "express";
import cors from "cors";
import routes from "./src/routes/index.js";
import { env } from "./src/config/env.js";

const app = express();

// --- Middlewares globaux ---

// Permet de lire le corps des requêtes au format JSON
app.use(express.json());

// en production, seule l'origine du frontend deploye est autorisee, et les
// en-tetes Content-Type et Authorization doivent etre declares explicitement
// pour que les requetes preflight OPTIONS aboutissent
app.use(
  cors({
    origin: env.frontendUrl,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- Routes ---
// Toutes les routes de l'application passent par ce seul point d'entree,
// voir src/routes/index.js pour le detail de chaque router.
app.use("/api", routes);

export default app;
