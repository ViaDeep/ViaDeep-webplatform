/** Sección cuya pantalla web de Figma todavía no está implementada. */
export function PendingDesignPage({ title, figmaScreen }: { title: string; figmaScreen: string }) {
  return (
    <section>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">Se construirá con la pantalla de Figma «{figmaScreen}».</p>
    </section>
  );
}
