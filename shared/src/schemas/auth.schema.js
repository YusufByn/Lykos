// Schémas de validation liés à l'authentification.
// Ils sont partagés entre le backend et le frontend pour garder les mêmes règles.

import { z } from "zod";

// Valide les données nécessaires pour créer un compte.
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("L'email est invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

// Valide les données nécessaires pour se connecter.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("L'email est invalide."),
  password: z
    .string()
    .min(1, "Le mot de passe est obligatoire."),
});

// Valide la demande de reinitialisation de mot de passe : juste l'email.
// (voir POST /api/auth/forgot-password)
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("L'email est invalide."),
});

// Valide la reinitialisation elle-meme : le token recu par email + le nouveau
// mot de passe. (voir POST /api/auth/reset-password)
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Le token est obligatoire."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});
