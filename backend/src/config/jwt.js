// Centralise la configuration JWT et expose deux utilitaires
// pour signer et vérifier les tokens dans toute l'application.

import jwt from "jsonwebtoken";
import { env } from "./env.js";

export const jwtSecret = env.jwt.secret;
export const jwtExpiresIn = env.jwt.expiresIn;

// Génère un token JWT signé à partir d'un payload (un objet qui permet de regrouper
// plusieurs info en un seul param, plutôt que de passer chaque
// data separement
// Le token expire selon la durée définie dans les variables d'environnement.
export function signToken(payload) {
  // la method sign permet de créer le token avec 3 parametre, l'objet payload, le jwt secret et quand il expire
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

// Vérifie et décode un token JWT.
// Lance une erreur si le token est invalide ou expiré.
export function verifyToken(token) {
  // dans jsonwebtoken on verifie le token, comparé au jwt secret
  return jwt.verify(token, jwtSecret);
}
