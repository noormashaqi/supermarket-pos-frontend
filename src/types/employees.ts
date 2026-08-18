export type EmployeeRole = 'Admin' | 'Cashier' | 'Inventory' | 'InventoryEmployee';

export const PermissionKeys = {
  SalesCreate: 'sales.create',
  InvoicesView: 'invoices.view',
  InvoicesReturn: 'invoices.return',
  InvoicesExchange: 'invoices.exchange',
  ProductsView: 'products.view',
  ProductsManage: 'products.manage',
  CategoriesView: 'categories.view',
  CategoriesManage: 'categories.manage',
  StockAdd: 'products.stock_add',
  EmployeesView: 'employees.view',
  EmployeesManage: 'employees.manage',
  ReportsView: 'reports.view',
  DashboardView: 'dashboard.view',
} as const;

export type PermissionKey = typeof PermissionKeys[keyof typeof PermissionKeys] | string;

export interface Employee {
  id: number;
  fullName: string;
  username: string;
  role: EmployeeRole;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceLog {
  id: number;
  employeeId: number;
  employeeName: string;
  loginTime: string;
  logoutTime?: string | null;
}