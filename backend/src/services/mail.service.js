// Service d'envoi d'emails.
// Il centralise la configuration Nodemailer et l'envoi des emails de l'application.
// Rappel skill Lykos : services/ = appels vers des systemes EXTERNES, jamais de SQL ici.

import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// on cree le transporteur une seule fois au chargement du fichier, puis on le
// reutilise pour tous les envois (pas besoin de le recreer a chaque email)
// en developpement, MAIL_HOST/MAIL_USER/MAIL_PASSWORD pointent vers un service
// de test (ex. Mailtrap) qui capture les emails sans les envoyer a une vraie boite
const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  // le port 465 utilise TLS implicite (connexion chiffree des l'ouverture),
  // tandis que le port 587 utilise STARTTLS (connexion en clair puis
  // passage au chiffrement)
  secure: env.mail.port === 465,
  auth: {
    user: env.mail.user,
    pass: env.mail.password,
  },
  // evite qu'une requete reste bloquee plusieurs minutes si le serveur
  // SMTP est injoignable
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// envoie l'email de reinitialisation de mot de passe avec le lien contenant le token
export async function sendPasswordResetEmail(to, resetLink) {

  await transporter.sendMail({
    // l'expediteur doit correspondre a une adresse verifiee chez le
    // fournisseur SMTP, il ne peut donc pas etre code en dur
    from: env.mail.from,
    to,
    subject: "Réinitialisation de votre mot de passe Lykos",
    // texte simple, suffisant pour un lien de reinitialisation
    text: `Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1 heure) :
${resetLink}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
  });
}
