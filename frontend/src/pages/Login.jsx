// Page de connexion (F9).
// Valide le formulaire côté client avec le schéma Zod partagé, envoie les
// identifiants au backend, puis authentifie l'utilisateur en cas de succès.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema } from "@lykos/shared";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  // message renvoyé par le backend (ex: "Identifiants invalides."), affiché
  // tel quel au-dessus du formulaire sans préciser quel champ est en cause
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
    // autorité sur ce qui est accepté ou non
    const validation = loginSchema.safeParse(form);

    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // on purge un éventuel token périmé avant d'appeler /auth/login : sans ça,
      // api.js verrait un token présent et interpréterait le 401 d'un mauvais
      // mot de passe comme une session expirée, avec redirection forcée
      logout();

      const data = await api.post("/auth/login", validation.data);
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
      title="Se connecter"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-medium text-[#174ED8]">
            S'inscrire
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

        <div className="mb-4 text-right">
          <Link to="/forgot-password" className="text-sm text-[#174ED8]">
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#174ED8] px-3 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </AuthCard>
  );
}
