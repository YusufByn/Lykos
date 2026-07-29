// Contrôleur d'authentification.
// Il orchestre l'inscription et la connexion des utilisateurs.

import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@lykos/shared";
import { env } from "../config/env.js";
import { signToken } from "../config/jwt.js";
import {
  createPasswordReset,
  findPasswordResetByToken,
  markPasswordResetAsUsed,
} from "../repositories/password_reset.repository.js";
import { createUser, findUserByEmail, updateUserPassword } from "../repositories/user.repository.js";
import { sendPasswordResetEmail } from "../services/mail.service.js";

const BCRYPT_SALT_ROUNDS = 12;

// duree de validite d'un token de reset : 1 heure, comme demande dans la roadmap
const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

// transforme le token brut en empreinte SHA-256 avant de le stocker ou de le chercher en base.
// Pas besoin de bcrypt ici : contrairement a un mot de passe choisi par un humain,
// le token est deja un secret aleatoire de 256 bits (voir randomBytes plus bas),
// un hash rapide suffit a empecher qu'un vol de la base donne des tokens exploitables.
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

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

  // email et password qui est celui de la request
  const { email, password } = validation.data;

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

  // email et password qui est celui de la request
  const { email, password } = validation.data;

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

// Demande de reinitialisation de mot de passe : genere un token unique,
// l'enregistre en base avec une expiration, puis envoie un email avec le lien.
export async function forgotPassword(req, res) {
  // validation zod : on ne verifie que l'email ici
  const validation = forgotPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  const { email } = validation.data;

  // meme reponse dans tous les cas (email trouve ou non), pour ne jamais
  // reveler a un attaquant si un email est inscrit chez nous ou pas
  const genericResponse = {
    message: "Si cet email existe, un lien de réinitialisation vient de lui être envoyé.",
  };

  try {
    const user = await findUserByEmail(email);

    // si l'email n'existe pas en base, on s'arrete la mais on renvoie quand
    // meme une reponse 200 normale (voir commentaire au dessus)
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // token aleatoire et impossible a deviner, transforme en chaine hexadecimale.
    // C'est CE token (en clair) qui part dans l'email : c'est la seule fois ou il existe non hashe.
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

    // on enregistre uniquement l'empreinte du token en base, jamais le token en clair
    // (comme ca une fuite de la base ne permet pas de reinitialiser un mot de passe a la place de quelqu'un)
    const tokenHash = hashToken(token);
    await createPasswordReset({ userId: user.id, tokenHash, expiresAt });

    // lien complet envoye par email, il pointe vers la page front qui recuperera
    // le token dans l'url (voir F9 - ResetPassword.jsx)
    const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetLink);

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation :", error.message);

    return res.status(500).json({ 
      message: "Erreur serveur lors de la demande de réinitialisation." 
    });
  }
}

// Reinitialisation du mot de passe a partir du token recu par email.
export async function resetPassword(req, res) {
  const validation = resetPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ 
      message: validation.error.errors[0].message 
    });
  }

  const { token, password } = validation.data;

  try {
    // on hash le token recu pour le comparer a l'empreinte stockee en base
    // (on ne stocke jamais le token en clair, voir forgotPassword)
    const tokenHash = hashToken(token);
    const passwordReset = await findPasswordResetByToken(tokenHash);

    // token inconnu en base -> on refuse sans donner plus de details
    if (!passwordReset) {
      return res.status(400).json({ 
        message: "Ce lien de réinitialisation est invalide." 
      });
    }

    // used_at deja rempli -> le token a deja servi une fois, usage unique impose
    if (passwordReset.used_at) {
      return res.status(400).json({ 
        message: "Ce lien de réinitialisation a déjà été utilisé." 
      });
    }

    // on compare la date d'expiration a maintenant pour verifier que le token est encore valide
    if (new Date(passwordReset.expires_at) < new Date()) {
      return res.status(400).json({ 
        message: "Ce lien de réinitialisation a expiré." 
      });
    }

    // on hash le nouveau mot de passe avant de l'enregistrer, exactement comme a l'inscription
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    await updateUserPassword(passwordReset.user_id, passwordHash);

    // on marque le token comme utilise pour qu'il ne puisse plus jamais reservir
    await markPasswordResetAsUsed(passwordReset.id);

    return res.status(200).json({ 
      message: "Votre mot de passe a été réinitialisé avec succès." 
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe :", error.message);

    return res.status(500).json({ 
      message: "Erreur serveur lors de la réinitialisation du mot de passe." 
    });
  }
}
