// Service TMDB.
// Il centralise tous les appels vers l'API externe TMDB avec fetch natif,
// et nettoie les reponses pour ne renvoyer au controller que les champs utiles.
// Rappel skill Lykos : services/ = appels externes, jamais de SQL ici.

import { env } from "../config/env.js";

// url de base de l'api tmdb, utilisee pour toutes les requetes de ce fichier
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// url de base des images tmdb, on utilise la taille w500 pour les affiches
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// fonction generique qui appelle un endpoint tmdb avec le token en bearer
// et renvoie directement le json de la reponse, sans nettoyage
async function fetchFromTmdb(path, searchParams = {}) {

  // on construit l'url complete a partir du path et des query params recus
  // URL est un objet natif qui represente une url et permet de la manipuler proprement
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  // on ajoute les query params a l'url (ex: query, include_adult)
  // URLSearchParams transforme un objet { cle: valeur } en query string encodee (ex: ?query=matrix&include_adult=false)
  url.search = new URLSearchParams(searchParams).toString();

  const response = await fetch(url, {
    headers: {
      // le token tmdb reste uniquement cote backend, jamais envoye au front
      Authorization: `Bearer ${env.tmdb.accessToken}`,
      Accept: "application/json",
    },
  });

  // si tmdb repond une erreur (ex: id inexistant), on la remonte au controller
  if (!response.ok) {
    throw new Error(`Erreur TMDB (${response.status}) sur ${path}`);
  }

  return response.json();
}

// prefixe un chemin d'image tmdb avec l'url de base, ou renvoie null si pas d'image
function buildImageUrl(posterPath) {
  return posterPath ? `${TMDB_IMAGE_BASE_URL}${posterPath}` : null;
}

// nettoie un resultat de recherche (film ou serie) pour ne garder que les champs utiles
// mediaType sert a savoir si on lit "title"/"release_date" ou "name"/"first_air_date"
function cleanSearchResult(result, mediaType) {

  // le titre et la date n'ont pas le meme nom de champ selon film ou serie
  const title = mediaType === "movie" ? result.title : result.name;
  const releaseDate = mediaType === "movie" ? result.release_date : result.first_air_date;

  return {
    id: result.id,
    title,
    posterUrl: buildImageUrl(result.poster_path),
    // on ne garde que l'annee (4 premiers caracteres), pas la date complete
    year: releaseDate ? releaseDate.slice(0, 4) : null,
    overview: result.overview,
  };
}

// recherche des films par mot cle, en filtrant le contenu adulte
export async function searchMovies(query) {
  const data = await fetchFromTmdb("/search/movie", {
    query,
    include_adult: false,
  });

  // on nettoie chaque resultat avant de le renvoyer au controller
  return data.results.map((result) => cleanSearchResult(result, "movie"));
}

// recherche des series par mot cle, en filtrant le contenu adulte
export async function searchSeries(query) {
  const data = await fetchFromTmdb("/search/tv", {
    query,
    include_adult: false,
  });

  return data.results.map((result) => cleanSearchResult(result, "tv"));
}

// recupere le detail d'un film et ne garde que les champs utiles au front
export async function getMovieDetails(movieId) {
  const movie = await fetchFromTmdb(`/movie/${movieId}`);

  return {
    id: movie.id,
    title: movie.title,
    posterUrl: buildImageUrl(movie.poster_path),
    year: movie.release_date ? movie.release_date.slice(0, 4) : null,
    overview: movie.overview,
    // duree du film en minutes, telle que renvoyee par tmdb
    duration: movie.runtime,
  };
}

// recupere le detail d'une serie, avec la liste de ses saisons (hors specials)
export async function getSeriesDetails(seriesId) {
  const series = await fetchFromTmdb(`/tv/${seriesId}`);

  // on filtre la saison 0 (Specials), qui n'est pas une vraie saison a suivre
  const seasons = series.seasons
    .filter((season) => season.season_number !== 0)
    .map((season) => ({
      seasonNumber: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
      posterUrl: buildImageUrl(season.poster_path),
    }));

  return {
    id: series.id,
    title: series.name,
    posterUrl: buildImageUrl(series.poster_path),
    year: series.first_air_date ? series.first_air_date.slice(0, 4) : null,
    overview: series.overview,
    seasons,
  };
}

// recupere le detail d'une saison (liste des episodes) pour une serie donnee
export async function getSeasonDetails(seriesId, seasonNumber) {
  const season = await fetchFromTmdb(`/tv/${seriesId}/season/${seasonNumber}`);

  // on nettoie chaque episode pour ne garder que les champs utiles au front
  const episodes = season.episodes.map((episode) => ({
    episodeNumber: episode.episode_number,
    name: episode.name,
    overview: episode.overview,
    airDate: episode.air_date,
  }));

  return {
    seasonNumber: season.season_number,
    name: season.name,
    episodes,
  };
}
