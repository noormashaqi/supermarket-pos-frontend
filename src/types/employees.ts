export type EmployeeRole = 'Admin' | 'Cashier' | 'Inventory';

export const PermissionKeys = {
  SalesCreate: 'sales.create',
  InvoicesView: 'invoices.view',
  InvoicesReturn: 'invoices.return',
  InvoicesExchange: 'invoices.exchange',
  InventoryStockAdd: 'inventory.stock_add',
  ProductsManage: 'products.manage',
  CategoriesManage: 'categories.manage',
  EmployeesManage: 'employees.manage',
} as const;

export type PermissionKey = typeof PermissionKeys[keyof typeof PermissionKeys];

export interface Employee {
  id: number | string;
  fullName: string;
  username: string;
  role: EmployeeRole;
  isActive: boolean;
  permissions?: string[];
  createdAt: string;
}
export interface AttendanceLog {
  id: number;
  employeeId: number;
  employeeName: string;
  loginTime: string;
  logoutTime?: string | null;
}