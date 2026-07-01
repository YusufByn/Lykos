// Contrôleur d'authentification.
// Il orchestre l'inscription et la connexion des utilisateurs.

import bcrypt from "bcrypt";
import { loginSchema, registerSchema } from "@lykos/shared";
import { signToken } from "../config/jwt.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";

const BCRYPT_SALT_ROUNDS = 12;

// Prépare la réponse renvoyée après inscription ou connexion
function buildAuthResponse(user) {
  // variable token qui est egal au clé suivant : l'id, le mail et le role 
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
  // variable validation : on appelle le schema d'inscriptino zod, on le parse par rapport au body de la request
  const validation = registerSchema.safeParse(req.body);

  // si pas de succes dans la validation on return un 400
  if (!validation.success) {

    return res.status(400).json({ 
      // récupère le message de la première erreur de validation trouvée par Zod
      message: validation.error.errors[0].message 
    });
  }

  // variable mail qui est egal au mail dans validation (qui est le body de la request parsé)
  const email = validation.data.email.toLowerCase();
  // varaible password du body de la request (destructuration ici avec les{})
  const { password } = validation.data;

  try {
    // On vérifie d'abord que l'email n'est pas déjà utilisé. (method dans le repoitory user)
    const existingUser = await findUserByEmail(email);

    // si un user a deja le meme mail on renvoie 409
    if (existingUser) {
      return res.status(409).json({ 
        message: "Cet email est déjà utilisé." 
      });
    }

    // On hash le mot de passe avant insertion pour ne jamais le stocker en clair, 
    // on le hash avec le nombre de la variable qui suit
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // on créer le user avec son mail, le mdp ainsi que son role de base en user
    const createdUser = await createUser({ email, passwordHash, role: "user" });

    // on rappelle notre fonction du dessus qui prepare la reponse après inscription ou 
    // connexion avec le user crée
    const authResponse = buildAuthResponse(createdUser);

    return res.status(201).json(authResponse);
  } catch (error) {

    console.error("Erreur lors de l'inscription :", error.message);

    return res.status(500).json({
       message: "Erreur serveur lors de l'inscription." 
      });
  }
}

// Connecte un utilisateur si l'email existe et si le mot de passe correspond.
export async function login(req, res) {
  // vairable validaiton avec les validation zod, safeparse le body de la request
  const validation = loginSchema.safeParse(req.body);

  // si pas de succes -> on revnoie le premier message d'erreur zod
  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  // on lowercase l'email qu'on recroit du body de la request
  const email = validation.data.email.toLowerCase();
  // password qui est celui de la request
  const { password } = validation.data;

  try {
    
    // variable user : on cherche le user par le mail dans body de la request
    const user = await findUserByEmail(email);

    // si pas de user (donc mail) -> msg d'erreur 
    if (!user) {
      return res.status(401).json({ 
        message: "Identifiants invalides." 
      });
    }

    // On récupère le hash stocké pour comparer le mot de passe avec bcrypt
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    // si les mdp ne match pas on renvoie msg d'erreur
    if (!passwordMatches) {
      return res.status(401).json({ 
        message: "Identifiants invalides." 
      });
    }

    // Prépare la réponse renvoyée après inscription ou connexion
    const authResponse = buildAuthResponse(user);

    return res.status(200).json(authResponse);
  } catch (error) {
    console.error("Erreur lors de la connexion :", error.message);
    return res.status(500).json({ 
      message: "Erreur serveur lors de la connexion." 
    });
  }
}
