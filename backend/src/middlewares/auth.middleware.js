// Middleware d'authentification JWT.
// Il protège les routes qui nécessitent un utilisateur connecté.

import { verifyToken } from "../config/jwt.js";

// Vérifie le token JWT et attache l'utilisateur décodé à la requête.
export function authMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({ message: "Token d'authentification manquant." });
  }

  const [type, token] = authorizationHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Format du token invalide." });
  }

  try {
    // On vérifie la signature et l'expiration du token avant de faire confiance au payload.
    const decodedUser = verifyToken(token);
    req.user = decodedUser;

    return next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}
