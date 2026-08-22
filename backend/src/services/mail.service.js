// Service d'envoi d'emails.
// Il centralise l'appel a l'API Brevo et l'envoi des emails de l'application.
// Rappel skill Lykos : services/ = appels vers des systemes EXTERNES, jamais de SQL ici.
//
// on passe par l'API HTTP de Brevo (port 443) plutot que par SMTP (ports 587/465)
// car l'hebergeur bloque les connexions SMTP sortantes

import { env } from "../config/env.js";

// env.mail.from est au format "Lykos <adresse@exemple.com>" : on extrait
// l'adresse entre chevrons pour le champ sender.email attendu par Brevo,
// avec un repli sur la valeur brute si le format ne contient pas de chevrons
function extractEmailAddress(from) {
  const match = from.match(/<(.+)>/);
  return match ? match[1] : from;
}

// envoie l'email de reinitialisation de mot de passe avec le lien contenant le token
export async function sendPasswordResetEmail(to, resetLink) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.mail.apiKey,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      sender: { email: extractEmailAddress(env.mail.from), name: "Lykos" },
      to: [{ email: to }],
      subject: "Réinitialisation de votre mot de passe Lykos",
      // texte simple, suffisant pour un lien de reinitialisation
      htmlContent: `Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour choisir un nouveau mot de passe (valable 1 heure) :
${resetLink}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || response.statusText;
    throw new Error(`Echec de l'envoi de l'email via Brevo (${response.status}) : ${message}`);
  }
}
