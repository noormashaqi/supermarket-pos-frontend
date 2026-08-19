export type EmployeeRole = 'Admin' | 'Cashier' | 'Inventory' | 'InventoryEmployee';

export const PermissionKeys = {
  SalesCreate: 'sales.create',
  InvoicesView: 'invoices.view',
  InvoicesReturn: 'invoices.return',
  InvoicesExchange: 'invoices.exchange',
  InvoicesOverridePrice: 'invoices.override_price',
  SalesPriceOverride: 'sales.price_override',
  ProductsView: 'products.view',
  ProductsManage: 'products.manage',
  CategoriesView: 'categories.view',
  CategoriesManage: 'categories.manage',
  StockAdd: 'products.stock_add',
  InventoryStockAdd: 'inventory.stock_add',
  EmployeesView: 'employees.view',
  EmployeesManage: 'employees.manage',
  ReportsView: 'reports.view',
  DashboardView: 'dashboard.view',
} as const;

export type PermissionKey = typeof PermissionKeys[keyof typeof PermissionKeys] | string;

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