// Point d'entrée du package partagé.
// Exporte tous les schémas Zod utilisés par le backend et le frontend.

export { loginSchema, registerSchema } from "./schemas/auth.schema.js";
export { createTrackingSchema, updateTrackingSchema } from "./schemas/tracking.schema.js";
export { markEpisodeSchema, updateEpisodeSchema } from "./schemas/episode.schema.js";
