export function KeyValueGrid({ pairs }: { pairs: Array<[string, string]> }) {
  return (
    <div className="kv-grid">
      {pairs.map(([label, value]) => (
        <div key={label} className="kv-row">
          <span>{label}</span>
          <strong>{value || '-'}</strong>
        </div>
      ))}
    </div>
  )
}
