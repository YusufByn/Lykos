// Structure commune aux écrans connectés : une sidebar de navigation et une
// zone de contenu où React Router injecte la page enfant via <Outlet />.
// Évite de dupliquer la sidebar dans chacune des six pages qui la partagent.
// Contenu minimal pour l'instant : la vraie sidebar (liens, rôle admin) sera
// construite en F10.

import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <p className="text-lg font-semibold text-gray-800">Lykos</p>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
