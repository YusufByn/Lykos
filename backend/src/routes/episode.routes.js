// Routes liees au suivi episodique (episode_progress).
// Toutes ces routes necessitent d'etre connecte (voir auth.middleware.js).

import { Router } from "express";
import { getProgress, markEpisode, updateEpisode } from "../controllers/episode.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const episodeRouter = Router();

// on applique le middleware d'auth une seule fois sur tout le router,
// comme deja fait pour les routes tmdb et watchlist
episodeRouter.use(authMiddleware);

// progression (liste des episodes suivis) d'une serie suivie : GET /api/progress/:mediaTrackingId
episodeRouter.get("/:mediaTrackingId", getProgress);

// cocher/decocher un episode : POST /api/progress
episodeRouter.post("/", markEpisode);

// modifier la note ou le commentaire d'un episode : PATCH /api/progress/:id
episodeRouter.patch("/:id", updateEpisode);

export default episodeRouter;
