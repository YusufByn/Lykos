// Page de demande de réinitialisation du mot de passe (F9).
// Envoie l'email au backend qui répond toujours avec le même message
// générique, que ce compte existe ou non (voir plus bas).

import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "@lykos/shared";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import { api } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  // une fois la demande envoyée avec succès, on remplace le formulaire par
  // le message renvoyé par le backend (voir rendu plus bas)
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    // validation côté front pour le confort de saisie uniquement : le
    // backend revalide de toute façon le format de l'email
    const validation = forgotPasswordSchema.safeParse({ email });

    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await api.post("/auth/forgot-password", validation.data);

      // le backend renvoie toujours le même message générique, que l'email
      // soit inscrit ou non : on l'affiche tel quel. C'est une protection
      // contre l'énumération de comptes, un attaquant ne peut pas deviner
      // à partir de la réponse si une adresse email existe chez nous
      setMessage(data.message);
      setSubmitted(true);
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Mot de passe oublié">
      {submitted ? (
        <div>
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-[#1B1B1B]">
            {message}
          </p>

          <p className="mt-6 text-center text-sm text-[#434655]">
            <Link to="/login" className="font-medium text-[#174ED8]">
              Retour à la connexion
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-[#434655]">
            Saisis ton adresse email. Si un compte existe, tu recevras un lien
            de réinitialisation valable une heure.
          </p>

          {serverError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email?.[0]}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#174ED8] px-3 py-2 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
