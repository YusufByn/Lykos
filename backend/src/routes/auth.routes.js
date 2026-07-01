// Routes liées à l'authentification.
// Elles définissent les URLs puis délèguent la logique au contrôleur.

import { Router } from "express";
import { getAuthProfile, login, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// Inscription d'un nouvel utilisateur.
authRouter.post("/register", register);

// Connexion d'un utilisateur existant.
authRouter.post("/login", login);

// Route simple pour vérifier qu'un token valide donne accès à la route protégée.
authRouter.get("/me", authMiddleware, getAuthProfile);

export default authRouter;
