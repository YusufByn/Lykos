// Contrôleur d'authentification.
// Il orchestre l'inscription et la connexion des utilisateurs.

import bcrypt from "bcrypt";
import { loginSchema, registerSchema } from "@lykos/shared";
import { signToken } from "../config/jwt.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";

const BCRYPT_SALT_ROUNDS = 12;

// Prépare la réponse renvoyée après inscription ou connexion.
function buildAuthResponse(user) {
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

// Inscrit un nouvel utilisateur après validation et hash du mot de passe.
export async function register(req, res) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ message: validation.error.errors[0].message });
  }

  const email = validation.data.email.toLowerCase();
  const { password } = validation.data;

  try {
    // On vérifie d'abord que l'email n'est pas déjà utilisé.
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    // On hash le mot de passe avant insertion pour ne jamais le stocker en clair.
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const createdUser = await createUser({ email, passwordHash, role: "user" });

    const authResponse = buildAuthResponse(createdUser);

    return res.status(201).json(authResponse);
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error.message);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
  }
}

// Connecte un utilisateur si l'email existe et si le mot de passe correspond.
export async function login(req, res) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ message: validation.error.errors[0].message });
  }

  const email = validation.data.email.toLowerCase();
  const { password } = validation.data;

  try {
    // On récupère le hash stocké pour comparer le mot de passe avec bcrypt.
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const authResponse = buildAuthResponse(user);

    return res.status(200).json(authResponse);
  } catch (error) {
    console.error("Erreur lors de la connexion :", error.message);
    return res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
}

// Route de test temporaire pour valider le middleware d'authentification.
export function getAuthProfile(req, res) {
  return res.status(200).json({ user: req.user });
}
