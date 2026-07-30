// Page de réinitialisation du mot de passe (F9).
// Le token vient du lien reçu par email sous forme de query string
// (voir mail.service.js côté backend : /reset-password?token=...), d'où
// useSearchParams plutôt qu'un paramètre de route.

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordSchema } from "@lykos/shared";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import { api } from "../services/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // status distingue les trois issues possibles après soumission : succès,
  // échec (token invalide/expiré/déjà utilisé), ou pas encore soumis (null)
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = resetPasswordSchema.safeParse({ token, password: form.password });

    // "confirmer le nouveau mot de passe" n'existe pas côté backend : c'est
    // une contrainte d'interface pour repérer une faute de frappe à la
    // saisie, pas une règle métier, donc elle se vérifie ici et ne part
    // jamais à l'API
    const passwordsMatch = form.password === form.confirmPassword;

    if (!validation.success || !passwordsMatch) {
      const fieldErrors = validation.success ? {} : validation.error.flatten().fieldErrors;

      if (!passwordsMatch) {
        fieldErrors.confirmPassword = ["Les mots de passe ne correspondent pas."];
      }

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await api.post("/auth/reset-password", validation.data);
      setMessage(data.message);
      setStatus("success");
    } catch (error) {
      // le backend renvoie ici un message distinct selon le cas (token
      // invalide, expiré, ou déjà utilisé) : on l'affiche tel quel plutôt
      // que d'inventer un message générique
      setMessage(error.message);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  // pas de token dans l'url -> inutile d'afficher un formulaire qui échouera
  // à coup sûr, on oriente directement vers une nouvelle demande
  if (!token) {
    return (
      <AuthCard title="Nouveau mot de passe">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Aucun lien de réinitialisation valide n'a été trouvé.
        </p>

        <p className="mt-6 text-center text-sm text-[#434655]">
          <Link to="/forgot-password" className="font-medium text-[#174ED8]">
            Demander un nouveau lien
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title="Nouveau mot de passe">
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-[#1B1B1B]">
          {message}
        </p>

        <p className="mt-6 text-center text-sm text-[#434655]">
          <Link to="/login" className="font-medium text-[#174ED8]">
            Se connecter
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (status === "error") {
    return (
      <AuthCard title="Nouveau mot de passe">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {message}
        </p>

        <p className="mt-6 text-center text-sm text-[#434655]">
          <Link to="/forgot-password" className="font-medium text-[#174ED8]">
            Demander un nouveau lien
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nouveau mot de passe">
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Nouveau mot de passe"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
        />
        <p className="-mt-3 mb-4 text-sm text-[#434655]">8 caractères minimum.</p>

        <FormField
          label="Confirmer le nouveau mot de passe"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword?.[0]}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#174ED8] px-3 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Envoi..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </AuthCard>
  );
}
