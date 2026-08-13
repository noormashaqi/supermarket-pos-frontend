export function TokenList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="token-group">
      <span className="mini-label">{title}</span>
      <div className="token-wrap">
        {values.length ? (
          values.map((value) => (
            <span key={value} className="token-chip">
              {value}
            </span>
          ))
        ) : (
          <span className="token-chip muted">No permissions loaded yet.</span>
        )}
      </div>
    </div>
  )
}
