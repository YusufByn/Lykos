// Point d'entrée du package partagé.
// Exporte tous les schémas Zod utilisés par le backend et le frontend.

export { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./schemas/auth.schema.js";
