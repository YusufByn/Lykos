// Middleware de rôle.
// Il permet de restreindre certaines routes aux utilisateurs admin.
// Il doit toujours être utilisé après authMiddleware, car il a besoin de req.user.

// Vérifie que l'utilisateur authentifié a bien le rôle "admin".
export function adminMiddleware(req, res, next) {

  // req.user est rempli par auth.middleware.js plus tôt dans la chaine des middlewares
  // donc a ce stade on a deja un user connu et verifie (token valide)
  const user = req.user;

  // si pas de user (securite) ou si le role n'est pas admin, on refuse l'acces
  if (!user || user.role !== "admin") {
    return res.status(403).json({ 
      message: "Accès réservé aux administrateurs." 
    });
  }

  // le role est bien admin, on laisse passer la requete vers le controller
  return next();
}
