// Point d'entree de toutes les routes de l'application.
// Regroupe chaque router d'entite pour ne faire qu'un seul import dans app.js.
// Quand on ajoute une nouvelle entite (watchlist, episodes, admin...),
// on cree son fichier de routes et on le branche ici, pas dans app.js.

import { Router } from "express";
import adminRouter from "./admin.routes.js";
import authRouter from "./auth.routes.js";

const router = Router();

// routes d'authentification : /api/auth/register, /api/auth/login
router.use("/auth", authRouter);

// routes de l'espace administrateur : /api/admin
router.use("/admin", adminRouter);


export default router;
