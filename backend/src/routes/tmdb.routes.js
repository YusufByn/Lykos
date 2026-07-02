// Routes liees a TMDB (recherche et details films/series).
// Toutes ces routes necessitent d'etre connecte (voir auth.middleware.js).

import { Router } from "express";
import {
  getMovieDetailsController,
  getSeasonDetailsController,
  getSeriesDetailsController,
  searchMoviesController,
  searchSeriesController,
} from "../controllers/tmdb.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const tmdbRouter = Router();

// on applique le middleware d'auth une seule fois sur tout le router,
// plutot que de le repeter sur chaque route une par une
tmdbRouter.use(authMiddleware);

// recherche de films : /api/search/movie?query=...
tmdbRouter.get("/search/movie", searchMoviesController);

// recherche de series : /api/search/tv?query=...
tmdbRouter.get("/search/tv", searchSeriesController);

// detail d'un film : /api/movie/:id
tmdbRouter.get("/movie/:id", getMovieDetailsController);

// detail d'une serie : /api/tv/:id
tmdbRouter.get("/tv/:id", getSeriesDetailsController);

// detail d'une saison de serie : /api/tv/:id/season/:number
tmdbRouter.get("/tv/:id/season/:number", getSeasonDetailsController);

export default tmdbRouter;
