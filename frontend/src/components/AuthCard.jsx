// Carte de mise en page partagée par les quatre pages d'authentification
// (Login, Register, ForgotPassword, ResetPassword). Évite de dupliquer la
// même structure (fond blanc plein écran, carte centrée, titre, pied de
// carte) dans chacune des quatre pages.

export default function AuthCard({ title, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-[420px] rounded-lg border border-[#E2E2E2] p-8">
        <h1 className="mb-6 text-2xl font-semibold text-[#1B1B1B]">{title}</h1>

        {children}

        {footer && (
          <p className="mt-6 text-center text-sm text-[#434655]">{footer}</p>
        )}
      </div>
    </div>
  );
}
