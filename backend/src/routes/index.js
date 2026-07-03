// Point d'entree de toutes les routes de l'application.
// Regroupe chaque router d'entite pour ne faire qu'un seul import dans app.js.
// Quand on ajoute une nouvelle entite (watchlist, episodes, admin...),
// on cree son fichier de routes et on le branche ici, pas dans app.js.

import { Router } from "express";
import authRouter from "./auth.routes.js";
import episodeRouter from "./episode.routes.js";
import tmdbRouter from "./tmdb.routes.js";
import trackingRouter from "./tracking.routes.js";

const router = Router();

// routes d'authentification : /api/auth/register, /api/auth/login
router.use("/auth", authRouter);

// routes tmdb, montees a la racine pour garder /api/search/movie, /api/movie/:id...
// (le prefixe /tmdb n'est pas utilise, les urls demandees dans la roadmap sont directes)
router.use("/", tmdbRouter);

// routes de la watchlist personnelle : /api/watchlist
router.use("/watchlist", trackingRouter);

// routes du suivi episodique : /api/progress
router.use("/progress", episodeRouter);

export default router;
