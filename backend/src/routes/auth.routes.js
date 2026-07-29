// Routes liées à l'authentification.
// Elles définissent les URLs puis délèguent la logique au contrôleur.

import { Router } from "express";
import { forgotPassword, login, register, resetPassword } from "../controllers/auth.controller.js";

const authRouter = Router();

// Inscription d'un nouvel utilisateur.
authRouter.post("/register", register);

// Connexion d'un utilisateur existant.
authRouter.post("/login", login);

// Demande de réinitialisation de mot de passe (envoie l'email avec le lien).
authRouter.post("/forgot-password", forgotPassword);

// Réinitialisation du mot de passe à partir du token reçu par email.
authRouter.post("/reset-password", resetPassword);

export default authRouter;
