import { InvoiceTable } from '../../components/ui/InvoiceTable'
import { currency, formatDateTime } from '../../lib/formatters'
import type {
  InvoiceDetail,
  InvoiceListItem,
  PrintableInvoice,
  PrintingFiltersState,
} from '../../types/app'

type Props = {
  filters: PrintingFiltersState
  invoiceList: InvoiceListItem[]
  invoiceDetails: InvoiceDetail | null
  printableInvoice: PrintableInvoice | null
  onFilterChange: (field: keyof PrintingFiltersState, value: string) => void
  onSelectInvoice: (id: number) => void
  onLoadInvoices: () => void
  onLoadInvoiceById: () => void
  onLoadPrintableInvoice: () => void
  onOpenPrintWindow: () => void
}

export function PrintingView({
  filters,
  invoiceList,
  invoiceDetails,
  printableInvoice,
  onFilterChange,
  onSelectInvoice,
  onLoadInvoices,
  onLoadInvoiceById,
  onLoadPrintableInvoice,
  onOpenPrintWindow,
}: Props) {
  return (
    <main className="printing-page">
      <section className="panel reports-hero">
        <div>
          <span className="eyebrow">Invoice Printing</span>
          <h2>Find an invoice, preview it cleanly, then print or save it as PDF.</h2>
          <p className="panel-description">
            This page is dedicated to invoice operations and stays separate from reports.
          </p>
        </div>
        <div className="button-cluster">
          <button type="button" className="action-button" onClick={onLoadInvoiceById}>
            Load Invoice
          </button>
          <button
            type="button"
            className="action-button action-button-secondary"
            onClick={onLoadPrintableInvoice}
          >
            Prepare Receipt
          </button>
          <button type="button" className="action-button action-button-dark" onClick={onOpenPrintWindow}>
            Print / Save PDF
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="triple-grid">
          <label>
            Date
            <input
              type="date"
              value={filters.invoiceDate}
              onChange={(event) => onFilterChange('invoiceDate', event.target.value)}
            />
          </label>
          <label>
            Employee ID
            <input
              value={filters.invoiceEmployeeId}
              onChange={(event) => onFilterChange('invoiceEmployeeId', event.target.value)}
            />
          </label>
          <label>
            Product ID
            <input
              value={filters.invoiceProductId}
              onChange={(event) => onFilterChange('invoiceProductId', event.target.value)}
            />
          </label>
        </div>
        <div className="invoice-search-row">
          <button type="button" className="action-button" onClick={onLoadInvoices}>
            Search Invoices
          </button>
          <label className="compact-field invoice-id-field">
            Invoice ID
            <input
              value={filters.invoiceId}
              onChange={(event) => onFilterChange('invoiceId', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>Invoice list</h3>
        <p className="panel-description">Select any invoice row to load its ID into the preview section.</p>
        <InvoiceTable rows={invoiceList} onSelectInvoice={onSelectInvoice} />
      </section>

      <section className="view-grid">
        <section className="panel">
          <h3>Invoice details</h3>
          <p className="panel-description">Loaded from `GET /api/invoices/{'{id}'}`.</p>
          {invoiceDetails ? (
            <>
              <div className="summary-grid">
                <article className="summary-card">
                  <span>Invoice Number</span>
                  <strong>{invoiceDetails.invoiceNumber}</strong>
                </article>
                <article className="summary-card">
                  <span>Employee</span>
                  <strong>{invoiceDetails.employeeName}</strong>
                </article>
                <article className="summary-card">
                  <span>Date</span>
                  <strong>{formatDateTime(invoiceDetails.date)}</strong>
                </article>
                <article className="summary-card">
                  <span>Total</span>
                  <strong>{currency(invoiceDetails.totalAfterDiscount)}</strong>
                </article>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.productNameSnapshot}</td>
                        <td>{item.quantity}</td>
                        <td>{currency(item.unitPriceSnapshot)}</td>
                        <td>{currency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">Load an invoice to see its full details here.</div>
          )}
        </section>

        <section className="panel">
          <h3>Receipt preview</h3>
          <p className="panel-description">Prepared from `GET /api/invoices/{'{id}'}/printable`.</p>
          {printableInvoice ? (
            <div className="receipt-preview">
              <div className="receipt-header">
                <div>
                  <span className="mini-label">Invoice</span>
                  <h3>{printableInvoice.invoiceNumber}</h3>
                </div>
                <div className="receipt-total">{currency(printableInvoice.totalAfterDiscount)}</div>
              </div>
              <div className="receipt-meta">
                <span>{printableInvoice.employeeName}</span>
                <span>{formatDateTime(printableInvoice.date)}</span>
                <span>{printableInvoice.paymentMethod}</span>
              </div>
              <div className="receipt-items">
                {printableInvoice.items.map((item) => (
                  <div key={`${item.productId}-${item.productName}`} className="receipt-row">
                    <span>{item.productName}</span>
                    <span>{item.quantity}x</span>
                    <span>{currency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-footer">
                <div>
                  <span>Subtotal</span>
                  <span>{currency(printableInvoice.totalBeforeDiscount)}</span>
                </div>
                <div>
                  <span>Discount</span>
                  <span>{currency(printableInvoice.discountAmount)}</span>
                </div>
                <div className="grand-total">
                  <span>Total</span>
                  <span>{currency(printableInvoice.totalAfterDiscount)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">Prepare a receipt to preview the printable format.</div>
          )}
        </section>
      </section>
    </main>
  )
}
