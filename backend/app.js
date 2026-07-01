// Configure l'application Express sans la démarrer.
// Le démarrage est délégué à index.js.

import express from "express";
import cors from "cors";
import authRouter from "./src/routes/auth.routes.js";

const app = express();

// --- Middlewares globaux ---

// Permet de lire le corps des requêtes au format JSON
app.use(express.json());

// Autorise les requêtes cross-origin depuis le frontend
app.use(cors());

// --- Routes ---
// Routes d'authentification (inscription, connexion, test du token)
app.use("/api/auth", authRouter);

export default app;
