import { currency, formatDateTime } from '../../lib/formatters'
import type {
  CategoryOption,
  EmployeeOption,
  ProductOption,
  ReportFiltersState,
  ReportKind,
  ReportState,
} from '../../types/app'

type Props = {
  selectedReport: ReportKind
  selectedReportRowIndex: number | null
  filters: ReportFiltersState
  reports: ReportState
  employees: EmployeeOption[]
  products: ProductOption[]
  categories: CategoryOption[]
  onSelectedReportChange: (value: ReportKind) => void
  onSelectedReportRowChange: (value: number | null) => void
  onFilterChange: (field: keyof ReportFiltersState, value: string) => void
  onRunReport: (key: keyof ReportState, path: string, label: string) => void
  onPrintReport: (title: string, data: unknown) => void
}

const reportOptions: Array<{ value: ReportKind; label: string }> = [
  { value: 'sales', label: 'Sales report' },
  { value: 'inventory', label: 'Inventory report' },
  { value: 'attendance', label: 'Attendance report' },
  { value: 'employees', label: 'Employees report' },
  { value: 'employeeDetail', label: 'Employee detail report' },
  { value: 'productDetail', label: 'Product detail report' },
]

export function ReportsView(props: Props) {
  const activeData = props.reports[props.selectedReport]
  const selectedRow = getSelectedRow(activeData, props.selectedReportRowIndex)

  return (
    <main className="reports-page">
      <section className="panel reports-hero">
        <div>
          <span className="eyebrow">Reports & Printing</span>
          <h2>Work with reports and invoice printing from one professional page.</h2>
          <p className="panel-description">
            Choose a report, filter by names, print it or save it as PDF, then handle invoice printing below.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="reports-toolbar">
          <label className="compact-field">
            Report Type
            <select
              value={props.selectedReport}
              onChange={(event) => props.onSelectedReportChange(event.target.value as ReportKind)}
            >
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="button-cluster">
            <button
              type="button"
              className="action-button"
              onClick={() => runSelectedReport(props)}
            >
              Load Report
            </button>
            <button
              type="button"
              className="action-button action-button-secondary"
              onClick={() => props.onPrintReport(getReportLabel(props.selectedReport), activeData)}
              disabled={!activeData}
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {props.selectedReport === 'sales' ? (
          <div className="triple-grid">
            <label>
              From Date
              <input type="date" value={props.filters.salesFromDate} onChange={(event) => props.onFilterChange('salesFromDate', event.target.value)} />
            </label>
            <label>
              To Date
              <input type="date" value={props.filters.salesToDate} onChange={(event) => props.onFilterChange('salesToDate', event.target.value)} />
            </label>
            <label>
              Employee
              <select value={props.filters.salesEmployeeId} onChange={(event) => props.onFilterChange('salesEmployeeId', event.target.value)}>
                <option value="">All employees</option>
                {props.employees.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {props.selectedReport === 'inventory' ? (
          <div className="double-grid">
            <label>
              Category
              <select value={props.filters.inventoryCategoryId} onChange={(event) => props.onFilterChange('inventoryCategoryId', event.target.value)}>
                <option value="">All categories</option>
                {props.categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Active Only
              <select value={props.filters.inventoryActiveOnly} onChange={(event) => props.onFilterChange('inventoryActiveOnly', event.target.value)}>
                <option value="true">Active only</option>
                <option value="false">All products</option>
              </select>
            </label>
          </div>
        ) : null}

        {props.selectedReport === 'attendance' ? (
          <div className="triple-grid">
            <label>
              From Date
              <input type="date" value={props.filters.attendanceFromDate} onChange={(event) => props.onFilterChange('attendanceFromDate', event.target.value)} />
            </label>
            <label>
              To Date
              <input type="date" value={props.filters.attendanceToDate} onChange={(event) => props.onFilterChange('attendanceToDate', event.target.value)} />
            </label>
            <label>
              Employee
              <select value={props.filters.attendanceEmployeeId} onChange={(event) => props.onFilterChange('attendanceEmployeeId', event.target.value)}>
                <option value="">All employees</option>
                {props.employees.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {props.selectedReport === 'employees' ? (
          <div className="double-grid">
            <label>
              Active Status
              <select value={props.filters.employeesActiveOnly} onChange={(event) => props.onFilterChange('employeesActiveOnly', event.target.value)}>
                <option value="">All employees</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </label>
            <label>
              Role
              <select value={props.filters.employeesRole} onChange={(event) => props.onFilterChange('employeesRole', event.target.value)}>
                <option value="">All roles</option>
                <option value="Admin">Admin</option>
                <option value="Cashier">Cashier</option>
                <option value="InventoryEmployee">Inventory employee</option>
              </select>
            </label>
          </div>
        ) : null}

        {props.selectedReport === 'employeeDetail' ? (
          <div className="triple-grid">
            <label>
              Employee
              <select value={props.filters.employeeDetailId} onChange={(event) => props.onFilterChange('employeeDetailId', event.target.value)}>
                <option value="">Choose employee</option>
                {props.employees.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From Date
              <input type="date" value={props.filters.employeeDetailFromDate} onChange={(event) => props.onFilterChange('employeeDetailFromDate', event.target.value)} />
            </label>
            <label>
              To Date
              <input type="date" value={props.filters.employeeDetailToDate} onChange={(event) => props.onFilterChange('employeeDetailToDate', event.target.value)} />
            </label>
          </div>
        ) : null}

        {props.selectedReport === 'productDetail' ? (
          <div className="triple-grid">
            <label>
              Product
              <select value={props.filters.productDetailId} onChange={(event) => props.onFilterChange('productDetailId', event.target.value)}>
                <option value="">Choose product</option>
                {props.products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              From Date
              <input type="date" value={props.filters.productDetailFromDate} onChange={(event) => props.onFilterChange('productDetailFromDate', event.target.value)} />
            </label>
            <label>
              To Date
              <input type="date" value={props.filters.productDetailToDate} onChange={(event) => props.onFilterChange('productDetailToDate', event.target.value)} />
            </label>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <ReportOutput
          reportType={props.selectedReport}
          data={activeData}
          selectedRowIndex={props.selectedReportRowIndex}
          selectedRow={selectedRow}
          onSelectRow={props.onSelectedReportRowChange}
        />
      </section>
    </main>
  )
}

function ReportOutput({
  reportType,
  data,
  selectedRowIndex,
  selectedRow,
  onSelectRow,
}: {
  reportType: ReportKind
  data: unknown
  selectedRowIndex: number | null
  selectedRow: Record<string, unknown> | null
  onSelectRow: (value: number | null) => void
}) {
  if (!data || typeof data !== 'object') {
    return <div className="empty-state">Load a report to see the result here.</div>
  }

  const model = data as Record<string, unknown>
  const summary = buildSummary(reportType, model)
  const rows = buildRows(reportType, model)

  return (
    <div className="report-output">
      <div className="summary-grid">
        {summary.map((item) => (
          <article key={item.label} className="summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
      {rows.length ? (
        <>
          <section className="report-block">
            <div className="report-block-header">
              <h3>Report list</h3>
              <p className="panel-description">Select a row to inspect its details below.</p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {Object.keys(rows[0]).map((key) => (
                      <th key={key}>{humanize(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={selectedRowIndex === index ? 'selected-row' : ''}
                      onClick={() => onSelectRow(index)}
                    >
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={valueIndex}>{formatValue(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-block report-details-block">
            <div className="report-block-header">
              <h3>Selected row details</h3>
              <p className="panel-description">Details of the row you selected from the report list.</p>
            </div>
            {selectedRow ? (
              <div className="details-grid">
                {renderSelectedDetails(reportType, selectedRow)}
              </div>
            ) : (
              <div className="empty-state">Select a row from the report list to display its details here.</div>
            )}
          </section>
        </>
      ) : (
        <div className="empty-state">No detail rows returned for this report.</div>
      )}
    </div>
  )
}

function buildSummary(reportType: ReportKind, model: Record<string, unknown>) {
  if (reportType === 'sales') {
    return [
      { label: 'Invoices', value: String(model.invoiceCount ?? '-') },
      { label: 'Net Sales', value: currencyNumber(model.netSales) },
      { label: 'Gross Sales', value: currencyNumber(model.totalSalesBeforeDiscount) },
      { label: 'Returns', value: currencyNumber(model.totalReturnedAmount) },
    ]
  }
  if (reportType === 'inventory') {
    return [
      { label: 'Products', value: String(model.productCount ?? '-') },
      { label: 'Quantity', value: String(model.totalQuantity ?? '-') },
      { label: 'Estimated Sales', value: currencyNumber(model.totalEstimatedSalesValue) },
      { label: 'Category', value: String(model.categoryId ?? 'All') },
    ]
  }
  if (reportType === 'attendance') {
    return [
      { label: 'Entries', value: String(model.entryCount ?? '-') },
      { label: 'Employee Filter', value: String(model.employeeId ?? 'All') },
      { label: 'From', value: dateLabel(model.fromDate) },
      { label: 'To', value: dateLabel(model.toDate) },
    ]
  }
  if (reportType === 'employees') {
    return [
      { label: 'Employees', value: String(model.employeeCount ?? '-') },
      { label: 'Role Filter', value: String(model.role ?? 'All') },
      { label: 'Active Filter', value: String(model.activeOnly ?? 'All') },
      { label: 'Scope', value: 'Employees' },
    ]
  }
  if (reportType === 'employeeDetail') {
    return [
      { label: 'Employee', value: String(model.fullName ?? '-') },
      { label: 'Invoices', value: String(model.invoiceCount ?? '-') },
      { label: 'Net Sales', value: currencyNumber(model.netSales) },
      { label: 'Returns', value: currencyNumber(model.totalReturnedAmount) },
    ]
  }
  return [
    { label: 'Product', value: String(model.productName ?? '-') },
    { label: 'Current Stock', value: String(model.currentStock ?? '-') },
    { label: 'Net Quantity', value: String(model.netQuantitySold ?? '-') },
    { label: 'Net Revenue', value: currencyNumber(model.netRevenue) },
  ]
}

function buildRows(reportType: ReportKind, model: Record<string, unknown>) {
  if (reportType === 'sales') return arrayRows(model.invoices)
  if (reportType === 'inventory') return arrayRows(model.products)
  if (reportType === 'attendance') return arrayRows(model.entries)
  if (reportType === 'employees') return arrayRows(model.employees)
  if (reportType === 'employeeDetail') return arrayRows(model.invoices)
  if (reportType === 'productDetail') {
    return [
      {
        productName: model.productName,
        categoryName: model.categoryName,
        sellingPrice: model.sellingPrice,
        grossQuantitySold: model.grossQuantitySold,
        quantityReturned: model.quantityReturned,
        netQuantitySold: model.netQuantitySold,
        grossRevenue: model.grossRevenue,
        returnedRevenue: model.returnedRevenue,
        netRevenue: model.netRevenue,
      },
    ]
  }
  return []
}

function getSelectedRow(data: unknown, selectedRowIndex: number | null) {
  if (selectedRowIndex === null || !data || typeof data !== 'object') return null

  const model = data as Record<string, unknown>
  const rows =
    Array.isArray(model.invoices) ? arrayRows(model.invoices)
    : Array.isArray(model.products) ? arrayRows(model.products)
    : Array.isArray(model.entries) ? arrayRows(model.entries)
    : Array.isArray(model.employees) ? arrayRows(model.employees)
    : []

  return rows[selectedRowIndex] ?? null
}

function renderSelectedDetails(reportType: ReportKind, selectedRow: Record<string, unknown>) {
  const entries = getDetailEntries(reportType, selectedRow)

  return entries.map(([key, value]) => (
    <article key={key} className="detail-card">
      <span>{humanize(key)}</span>
      <strong>{formatValue(value)}</strong>
    </article>
  ))
}

function getDetailEntries(reportType: ReportKind, selectedRow: Record<string, unknown>) {
  if (reportType === 'sales') {
    return [
      ['invoiceNumber', selectedRow.invoiceNumber],
      ['employeeName', selectedRow.employeeName],
      ['date', selectedRow.date],
      ['totalBeforeDiscount', selectedRow.totalBeforeDiscount],
      ['totalAfterDiscount', selectedRow.totalAfterDiscount],
      ['returnedAmount', selectedRow.returnedAmount],
      ['netTotal', selectedRow.netTotal],
      ['hasReturn', selectedRow.hasReturn],
    ] as Array<[string, unknown]>
  }

  if (reportType === 'inventory') {
    return [
      ['productName', selectedRow.productName],
      ['categoryName', selectedRow.categoryName],
      ['sellingPrice', selectedRow.sellingPrice],
      ['quantity', selectedRow.quantity],
      ['unit', selectedRow.unit],
      ['isActive', selectedRow.isActive],
      ['createdAt', selectedRow.createdAt],
    ] as Array<[string, unknown]>
  }

  if (reportType === 'attendance') {
    return [
      ['employeeName', selectedRow.employeeName],
      ['loginTime', selectedRow.loginTime],
      ['logoutTime', selectedRow.logoutTime],
      ['shiftDurationHours', selectedRow.shiftDurationHours],
    ] as Array<[string, unknown]>
  }

  if (reportType === 'employees') {
    return [
      ['fullName', selectedRow.fullName],
      ['username', selectedRow.username],
      ['role', selectedRow.role],
      ['isActive', selectedRow.isActive],
      ['createdAt', selectedRow.createdAt],
      ['permissionCount', selectedRow.permissionCount],
    ] as Array<[string, unknown]>
  }

  return Object.entries(selectedRow)
}

function arrayRows(value: unknown) {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
}

function formatValue(value: unknown) {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') return /\d{4}-\d{2}-\d{2}T/.test(value) ? formatDateTime(value) : value
  if (value === null || value === undefined) return '-'
  return String(value)
}

function currencyNumber(value: unknown) {
  return typeof value === 'number' ? currency(value) : '-'
}

function dateLabel(value: unknown) {
  return typeof value === 'string' && /\d{4}-\d{2}-\d{2}T/.test(value) ? formatDateTime(value) : String(value ?? '-')
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())
}

function getReportLabel(reportType: ReportKind) {
  return reportOptions.find((option) => option.value === reportType)?.label ?? 'Report'
}

function runSelectedReport(props: Props) {
  if (props.selectedReport === 'sales') {
    props.onRunReport(
      'sales',
      `/api/reports/sales${buildSuffix({
        fromDate: props.filters.salesFromDate,
        toDate: props.filters.salesToDate,
        employeeId: props.filters.salesEmployeeId,
      })}`,
      'Sales report',
    )
    return
  }
  if (props.selectedReport === 'inventory') {
    props.onRunReport(
      'inventory',
      `/api/reports/inventory${buildSuffix({
        categoryId: props.filters.inventoryCategoryId,
        activeOnly: props.filters.inventoryActiveOnly,
      })}`,
      'Inventory report',
    )
    return
  }
  if (props.selectedReport === 'attendance') {
    props.onRunReport(
      'attendance',
      `/api/reports/attendance${buildSuffix({
        fromDate: props.filters.attendanceFromDate,
        toDate: props.filters.attendanceToDate,
        employeeId: props.filters.attendanceEmployeeId,
      })}`,
      'Attendance report',
    )
    return
  }
  if (props.selectedReport === 'employees') {
    props.onRunReport(
      'employees',
      `/api/reports/employees${buildSuffix({
        activeOnly: props.filters.employeesActiveOnly,
        role: props.filters.employeesRole,
      })}`,
      'Employees report',
    )
    return
  }
  if (props.selectedReport === 'employeeDetail') {
    props.onRunReport(
      'employeeDetail',
      `/api/reports/employees/${props.filters.employeeDetailId}${buildSuffix({
        fromDate: props.filters.employeeDetailFromDate,
        toDate: props.filters.employeeDetailToDate,
      })}`,
      'Employee detail report',
    )
    return
  }
  props.onRunReport(
    'productDetail',
    `/api/reports/products/${props.filters.productDetailId}${buildSuffix({
      fromDate: props.filters.productDetailFromDate,
      toDate: props.filters.productDetailToDate,
    })}`,
    'Product detail report',
  )
}

function buildSuffix(values: Record<string, string>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== '') query.set(key, value)
  }
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}
