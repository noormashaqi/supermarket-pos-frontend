export function ResultPanel({
  title,
  data,
  compact = false,
}: {
  title: string
  data: unknown
  compact?: boolean
}) {
  return (
    <section className={compact ? 'result-panel compact' : 'result-panel'}>
      <div className="result-header">
        <span className="mini-label">{title}</span>
      </div>
      <pre>{data ? JSON.stringify(data, null, 2) : 'No data loaded yet.'}</pre>
    </section>
  )
}
