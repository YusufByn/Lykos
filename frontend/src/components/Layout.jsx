// Structure commune aux écrans connectés : une sidebar de navigation et une
// zone de contenu où React Router injecte la page enfant via <Outlet />.
// Évite de dupliquer la sidebar dans chacune des six pages qui la partagent.
// La sidebar elle-même vit dans Sidebar.jsx (composant séparé, un rôle chacun).

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-4">
        <Sidebar />
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
