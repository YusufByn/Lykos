// Controller de l'espace administrateur.
// Il orchestre la supervision des utilisateurs pour le dashboard admin.
// Pas de SQL ici, tout passe par le repository user.
// Rappel securite : l'admin ne doit jamais voir le contenu des watchlists,
// seulement la liste des comptes et un compteur.

import { countUsers, findAllUsers } from "../repositories/user.repository.js";

// liste tous les utilisateurs inscrits (email + date d'inscription seulement)
export async function getUsers(req, res) {

  try {
    // findAllUsers ne selectionne jamais password_hash, meme pour un admin
    const users = await findAllUsers();

    return res.status(200).json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la récupération des utilisateurs." 
    });
  }
}

// renvoie le nombre total d'utilisateurs inscrits
export async function getStats(req, res) {

  try {
    const totalUsers = await countUsers();

    return res.status(200).json({ totalUsers });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error.message);

    return res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques." 
    });
  }
}
