// Routes liees a la watchlist personnelle (media_tracking).
// Toutes ces routes necessitent d'etre connecte (voir auth.middleware.js).

import { Router } from "express";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
} from "../controllers/tracking.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const trackingRouter = Router();

// on applique le middleware d'auth une seule fois sur tout le router,
// comme deja fait pour les routes tmdb
trackingRouter.use(authMiddleware);

// liste des suivis de l'utilisateur connecte : GET /api/watchlist
trackingRouter.get("/", getWatchlist);

// ajout d'un media a la liste : POST /api/watchlist
trackingRouter.post("/", addToWatchlist);

// modification du statut, de la note ou du commentaire : PATCH /api/watchlist/:id
trackingRouter.patch("/:id", updateWatchlistItem);

// suppression d'un suivi : DELETE /api/watchlist/:id
trackingRouter.delete("/:id", removeFromWatchlist);

export default trackingRouter;
