export type ViewKey = 'auth' | 'reports' | 'printing'

export type SessionState = {
  accessToken: string
  refreshToken: string
  employeeId: number | null
  fullName: string
  username: string
  role: string
  expiresAt: string
  permissions: string[]
}

export type ReportState = {
  sales: unknown
  inventory: unknown
  attendance: unknown
  employees: unknown
  employeeDetail: unknown
  productDetail: unknown
}

export type ReportKind =
  | 'sales'
  | 'inventory'
  | 'attendance'
  | 'employees'
  | 'employeeDetail'
  | 'productDetail'

export type InvoiceListItem = {
  id: number
  invoiceNumber: string
  employeeId: number
  employeeName: string
  date: string
  totalAfterDiscount: number
  hasReturn: boolean
}

export type PrintableInvoice = {
  invoiceId: number
  invoiceNumber: string
  employeeName: string
  date: string
  paymentMethod: string
  totalBeforeDiscount: number
  discountPercentage: number
  discountAmount: number
  totalAfterDiscount: number
  hasReturn: boolean
  items: Array<{
    productId: number
    productName: string
    unitPrice: number
    quantity: number
    lineTotal: number
  }>
  htmlReceipt: string
}

export type InvoiceDetail = {
  id: number
  invoiceNumber: string
  employeeId: number
  employeeName: string
  date: string
  totalBeforeDiscount: number
  discountPercentage: number
  totalAfterDiscount: number
  hasReturn: boolean
  items: Array<{
    id: number
    productId: number
    productNameSnapshot: string
    unitPriceSnapshot: number
    quantity: number
    lineTotal: number
  }>
}

export type SignInFormState = {
  username: string
  password: string
}

export type CreateUserFormState = {
  fullName: string
  username: string
  password: string
  role: string
}

export type ResetPasswordFormState = {
  currentPassword: string
  newPassword: string
}

export type ReportFiltersState = {
  salesFromDate: string
  salesToDate: string
  salesEmployeeId: string
  inventoryCategoryId: string
  inventoryActiveOnly: string
  attendanceFromDate: string
  attendanceToDate: string
  attendanceEmployeeId: string
  employeesActiveOnly: string
  employeesRole: string
  employeeDetailId: string
  employeeDetailFromDate: string
  employeeDetailToDate: string
  productDetailId: string
  productDetailFromDate: string
  productDetailToDate: string
}

export type PrintingFiltersState = {
  invoiceDate: string
  invoiceEmployeeId: string
  invoiceProductId: string
  invoiceId: string
}

export type EmployeeOption = {
  id: number
  fullName: string
  username: string
  role: string
  isActive: boolean
}

export type ProductOption = {
  id: number
  name: string
  categoryId: number
  categoryName: string
  isActive: boolean
}

export type CategoryOption = {
  id: number
  name: string
}
