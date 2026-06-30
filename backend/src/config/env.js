// Centralise la lecture des variables d'environnement.
// Ce fichier est le seul endroit où on touche à process.env.

import dotenv from "dotenv";

// Charge le fichier .env dans process.env
dotenv.config();

export const env = {
  port: process.env.PORT || 3000,

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  tmdb: {
    accessToken: process.env.TMDB_ACCESS_TOKEN,
  },

  mail: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
  },
};
