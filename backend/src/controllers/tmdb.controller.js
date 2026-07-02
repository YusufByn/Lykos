// Controller TMDB.
// Il recupere les parametres de la requete, appelle le service tmdb,
// et renvoie la reponse au client. Pas de logique metier lourde ici,
// tout le nettoyage des donnees est deja fait dans tmdb.service.js.

import {
  getMovieDetails,
  getSeasonDetails,
  getSeriesDetails,
  searchMovies,
  searchSeries,
} from "../services/tmdb.service.js";

// recherche de films via le query param "query" (ex: /api/search/movie?query=matrix)
export async function searchMoviesController(req, res) {

  // variable query qui recupere le mot cle tape par l'utilisateur dans l'url
  const { query } = req.query;

  // si pas de mot cle envoye, on ne va meme pas jusqu'a tmdb
  if (!query) {
    return res.status(400).json({ 
      message: "Le paramètre query est obligatoire." 
    });
  }

  try {
    // on delegue la recherche et le nettoyage au service tmdb
    const movies = await searchMovies(query);

    return res.status(200).json(movies);
  } catch (error) {
    console.error("Erreur lors de la recherche de films :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la recherche de films." 
    });
  }
}

// recherche de series via le query param "query" (ex: /api/search/tv?query=friends)
export async function searchSeriesController(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ 
      message: "Le paramètre query est obligatoire." 
    });
  }

  try {
    const series = await searchSeries(query);

    return res.status(200).json(series);
  } catch (error) {
    console.error("Erreur lors de la recherche de séries :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la recherche de séries." 
    });
  }
}

// detail d'un film via son id tmdb recu dans l'url (/api/movie/:id)
export async function getMovieDetailsController(req, res) {

  // variable id qui recupere le parametre d'url :id
  const { id } = req.params;

  try {
    const movie = await getMovieDetails(id);

    return res.status(200).json(movie);
  } catch (error) {
    console.error("Erreur lors de la récupération du film :", error.message);

    // si tmdb ne trouve pas le film (mauvais id), on renvoie un 404 clair
    return res.status(404).json({ 
      message: "Film introuvable." 
    });
  }
}

// detail d'une serie via son id tmdb recu dans l'url (/api/tv/:id)
export async function getSeriesDetailsController(req, res) {
  const { id } = req.params;

  try {
    const series = await getSeriesDetails(id);

    return res.status(200).json(series);
  } catch (error) {
    console.error("Erreur lors de la récupération de la série :", error.message);

    return res.status(404).json({ 
      message: "Série introuvable." 
    });
  }
}

// detail d'une saison via l'id de la serie et le numero de saison dans l'url
// (/api/tv/:id/season/:number)
export async function getSeasonDetailsController(req, res) {

  // destructuration des deux parametres d'url : id de la serie et numero de saison
  const { id, number } = req.params;

  try {
    const season = await getSeasonDetails(id, number);

    return res.status(200).json(season);
  } catch (error) {
    console.error("Erreur lors de la récupération de la saison :", error.message);

    return res.status(404).json({ 
      message: "Saison introuvable." 
    });
  }
}
