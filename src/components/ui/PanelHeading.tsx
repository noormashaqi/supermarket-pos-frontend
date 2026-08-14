export function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="panel-heading">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  )
}
