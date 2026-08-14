import { currency, formatDateTime } from '../../lib/formatters'
import type { InvoiceListItem } from '../../types/app'

export function InvoiceTable({
  rows,
  onSelectInvoice,
}: {
  rows: InvoiceListItem[]
  onSelectInvoice: (id: number) => void
}) {
  if (!rows.length) {
    return (
      <div className="placeholder-card">
        No invoice rows loaded yet. Click "Load Invoices" to call the backend.
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Number</th>
            <th>Employee</th>
            <th>Date</th>
            <th>Total</th>
            <th>Return</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelectInvoice(row.id)}>
              <td>{row.id}</td>
              <td>{row.invoiceNumber}</td>
              <td>{row.employeeName}</td>
              <td>{formatDateTime(row.date)}</td>
              <td>{currency(row.totalAfterDiscount)}</td>
              <td>{row.hasReturn ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
