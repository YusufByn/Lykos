// Middleware d'authentification JWT.
// Il protège les routes qui nécessitent un utilisateur connecté.

import { verifyToken } from "../config/jwt.js";

// Vérifie le token JWT et attache l'utilisateur décodé à la requête.
export function authMiddleware(req, res, next) {

  // variable autHeader qui est egale a l'authorization dans le headers de ma request
  // donc le bearer et le token
  const authorizationHeader = req.headers.authorization;

  // si pas de authorization header dans ma request on revnoie un 401
  if (!authorizationHeader) {
    return res.status(401).json({ 
      message: "Token d'authentification manquant." 
    });
  }


  // declare la variable type et token, qui sont le authorization dans headers de la request separé
  // donc authHeader = bearer + token
  // on separe donc type = bearer et token = le token
  const [type, token] = authorizationHeader.split(" ");

  // si le type n'est pas bearer ou pas de token, 401
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ 
      message: "Format du token invalide." 
    });
  }

  try {
    // On vérifie la signature et l'expiration du token avant de faire confiance au payload
    // avec la fonction créer dans jwt.js
    const decodedUser = verifyToken(token);
    // étant donné qu'on a verif le user avec la verif de token, on créer req.user en indiquant 
    // que c'est bien le user verifie grace a la method
    req.user = decodedUser;

    return next();
  } catch {
    return res.status(401).json({ 
      message: "Token invalide ou expiré." 
    });
  }
}
