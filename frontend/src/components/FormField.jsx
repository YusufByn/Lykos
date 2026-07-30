// Champ de formulaire complet : un label, un input et son message d'erreur
// éventuel juste en dessous. Regroupe ces trois éléments dans un seul
// composant pour ne pas les répéter à chaque champ de chaque page.
// Les six props sont toutes obligatoires et utilisées à chaque appel :
// pas de props conditionnelles qui changeraient la forme du composant.

export default function FormField({ label, name, type, value, onChange, error }) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-[#1B1B1B]">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        // aria-invalid signale l'état invalide du champ, aria-describedby
        // rattache le message d'erreur au champ pour qu'un lecteur d'écran l'annonce
        aria-invalid={Boolean(error)}
        aria-describedby={`${name}-error`}
        className="w-full rounded-lg border border-[#E2E2E2] px-3 py-2 text-[#1B1B1B] focus:border-[#174ED8] focus:outline-none"
      />

      {/* espace toujours réservé : évite que le formulaire "saute" quand
          une erreur apparaît ou disparaît */}
      <p id={`${name}-error`} className="mt-1 min-h-[1.25rem] text-sm text-red-600">{error}</p>
    </div>
  );
}
