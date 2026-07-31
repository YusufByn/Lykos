// Rangée de pills pour filtrer par statut de lecture au sein d'une collection
// (Ma bibliothèque ou Wishlist). Ne pas confondre avec la sidebar : la sidebar
// choisit la collection, ce composant choisit le statut à l'intérieur de
// cette collection (voir skill Lykos, section Navigation).

import { READING_STATUSES } from "@lykos/shared";
import { READING_STATUS_LABELS } from "../constants";

// "all" n'est pas un statut de la base : c'est l'absence de filtre côté front,
// traduite par l'absence du paramètre "status" dans l'appel à l'API
const OPTIONS = [
  { value: "all", label: "Tous" },
  ...READING_STATUSES.map((status) => ({ value: status, label: READING_STATUS_LABELS[status] })),
];

export default function StatusSelector({ value, onChange }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? "rounded-full bg-[#174ED8] px-4 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-[#E2E2E2] px-4 py-1.5 text-sm text-[#434655]"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
