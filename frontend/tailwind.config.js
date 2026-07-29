// Configuration Tailwind.
// Tailwind v4 detecte le contenu automatiquement, mais on garde ce fichier
// pour centraliser les futurs ajustements de theme (couleurs, polices...)
// et pour que ce soit explicite et facile a expliquer a l'oral.

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
