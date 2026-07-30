// Page d'inscription (F9).
// Valide le formulaire côté client avec le schéma Zod partagé, envoie les
// identifiants au backend, puis authentifie l'utilisateur en cas de succès.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerSchema } from "@lykos/shared";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function Register() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  // message renvoyé par le backend (ex: "Cet email est déjà utilisé."),
  // affiché tel quel au-dessus du formulaire
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    // validation côté front pour le confort de saisie uniquement : le
    // backend revalide de toute façon les mêmes règles, c'est lui qui fait
    // autorité sur ce qui est accepté ou non. Seuls email et password sont
    // envoyés au schéma : registerSchema ne connaît pas confirmPassword.
    const validation = registerSchema.safeParse({
      email: form.email,
      password: form.password,
    });

    // "confirmer le mot de passe" n'existe pas côté backend : c'est une
    // contrainte d'interface pour repérer une faute de frappe à la saisie,
    // pas une règle métier, donc elle se vérifie ici et ne part jamais à l'API
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
      // on purge un éventuel token périmé avant d'appeler /auth/register :
      // sans ça, api.js verrait un token présent et interpréterait un 409
      // (email déjà utilisé) comme une session expirée, avec redirection forcée
      logout();

      const data = await api.post("/auth/register", validation.data);
      login(data.token, data.user);
      navigate("/bibliotheque", { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-[#174ED8]">
            Se connecter
          </Link>
        </>
      }
    >
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
          value={form.email}
          onChange={handleChange}
          error={errors.email?.[0]}
        />

        <FormField
          label="Mot de passe"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password?.[0]}
        />
        <p className="-mt-3 mb-4 text-sm text-[#434655]">8 caractères minimum.</p>

        <FormField
          label="Confirmer le mot de passe"
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
          {loading ? "Création..." : "Créer un compte"}
        </button>
      </form>
    </AuthCard>
  );
}
