import { useState, useEffect, type FormEvent } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  Search,
  UserX,
} from 'lucide-react';
import { Badge, Modal, ConfirmDialog, Table, type Column } from '../components/common';
import { useModal } from '../hooks';
import { employeesService } from '../api/services/employeeService';
import { PermissionKeys, type Employee, type AttendanceLog } from '../types/employees';
import { formatDate } from '../utils';

type EmployeeRole = 'Cashier' | 'Inventory' | 'Admin';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance'>('employees');
  const [isLoading, setIsLoading] = useState(false);

  // Form modal
  const formModal = useModal<Employee>();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Cashier');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Permissions editor modal
  const permModal = useModal<Employee>();

  // Deactivate modal
  const deactivateModal = useModal<Employee>();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, atts] = await Promise.all([
        employeesService.getEmployees(),
        employeesService.getAttendanceLogs(),
      ]);
      setEmployees(emps);
      setAttendanceLogs(atts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availablePermissions = [
    { key: PermissionKeys.SalesCreate, label: 'Create POS Sales & Checkout' },
    { key: PermissionKeys.InvoicesView, label: 'View Invoices & Print Receipts' },
    { key: PermissionKeys.InvoicesReturn, label: 'Execute Pure Returns (إرجاع فقط)' },
    { key: PermissionKeys.InvoicesExchange, label: 'Execute Item Exchange (تبديل أصناف)' },
    { key: PermissionKeys.InventoryStockAdd, label: 'Add Stock Quantity (Stock In)' },
    { key: PermissionKeys.ProductsManage, label: 'Add, Edit & Deactivate Products' },
    { key: PermissionKeys.CategoriesManage, label: 'Add & Edit Categories' },
    { key: PermissionKeys.EmployeesManage, label: 'Manage Employees & Permissions' },
  ];

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSaveEmployee = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) return;

    setIsLoading(true);
    try {
      await employeesService.createEmployee({
        fullName,
        username,
        password: password || '123456',
        role,
        permissions: selectedPermissions,
      });
      await loadData();
      formModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!permModal.data) return;
    setIsLoading(true);
    try {
      await employeesService.updateEmployeePermissions(permModal.data.id, selectedPermissions);
      await loadData();
      permModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateModal.data) return;
    setIsLoading(true);
    try {
      await employeesService.deactivateEmployee(deactivateModal.data.id);
      await loadData();
      deactivateModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const employeeColumns: Column<Employee>[] = [
    {
      header: 'Employee Name',
      cell: (e) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{e.fullName}</p>
          <p className="text-[10px] text-slate-400 font-mono">@{e.username}</p>
        </div>
      ),
    },
    {
      header: 'Base Role',
      cell: (e) => {
        if (e.role === 'Admin') return <Badge variant="info">Admin (Full Access)</Badge>;
        if (e.role === 'Inventory') return <Badge variant="warning">Inventory Employee</Badge>;
        return <Badge variant="success">Cashier</Badge>;
      },
    },
    {
      header: 'Permissions',
      cell: (e) => (
        <span className="text-xs font-semibold text-slate-600">
          {e.role === 'Admin' ? 'All Permissions (Automatic)' : `${(e.permissions || []).length} Custom Action Permissions`}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (e) => (
        e.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Deactivated (History Preserved)</Badge>
        )
      ),
    },
    {
      header: 'Created At',
      cell: (e) => <span className="text-xs text-slate-500">{formatDate(e.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (e) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedPermissions(e.permissions || []);
              permModal.open(e);
            }}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permissions</span>
          </button>

          {e.isActive && e.role !== 'Admin' && (
            <button
              onClick={() => deactivateModal.open(e)}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const attendanceColumns: Column<AttendanceLog>[] = [
    {
      header: 'Employee Name',
      cell: (a) => <span className="font-bold text-slate-800 text-xs">{a.employeeName}</span>,
    },
    {
      header: 'Shift Login Time (وقت الدخول)',
      cell: (a) => <span className="text-xs text-emerald-700 font-semibold">{formatDate(a.loginTime)}</span>,
    },
    {
      header: 'Shift Logout Time (وقت الخروج)',
      cell: (a) =>
        a.logoutTime ? (
          <span className="text-xs text-slate-500">{formatDate(a.logoutTime)}</span>
        ) : (
          <Badge variant="success">Active Shift</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Employee Management, Permissions & Shift Attendance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            3 fixed roles (Admin, Cashier, Inventory) with customizable per-action permissions & automatic shift login/logout tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setFullName('');
            setUsername('');
            setPassword('');
            setRole('Cashier');
            setSelectedPermissions([PermissionKeys.SalesCreate, PermissionKeys.InvoicesView]);
            formModal.open();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Navigation Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'employees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Roster & Permissions ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shift Attendance Logs ({attendanceLogs.length})</span>
          </button>
        </div>

        {activeTab === 'employees' && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employee by name or username..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
              />
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredEmployees.length} Employees
            </span>
          </div>
        )}
      </div>

      {/* Main Table View */}
      {activeTab === 'employees' ? (
        <Table
          columns={employeeColumns}
          data={filteredEmployees}
          keyExtractor={(e) => e.id}
          emptyMessage="No employees registered."
        />
      ) : (
        <Table
          columns={attendanceColumns}
          data={attendanceLogs}
          keyExtractor={(a) => a.id}
          emptyMessage="No attendance logs recorded."
        />
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title="Add New Employee"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tariq Al-Hassan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g. tariq"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: 123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Base Role (الدور الأساسي)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as EmployeeRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cashier">Cashier (كاشير)</option>
                <option value="Inventory">Inventory Employee (موظف مخزون)</option>
                <option value="Admin">Admin (مدير النظام)</option>
              </select>
            </div>
          </div>

          {/* Action Permissions Checkbox Grid */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Custom Per-Action Permissions (Permission per Action)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availablePermissions.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(p.key)}
                    onChange={() => handleTogglePermission(p.key)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-slate-100">
            <button
              type="button"
              onClick={formModal.close}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Permissions Editor Modal */}
      <Modal
        isOpen={permModal.isOpen}
        onClose={permModal.close}
        title={`Action Permissions: ${permModal.data?.fullName}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Customize individual action permissions for <span className="font-bold text-slate-800">{permModal.data?.fullName}</span>:
          </p>
          <div className="space-y-2">
            {availablePermissions.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(p.key)}
                  onChange={() => handleTogglePermission(p.key)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">{p.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-slate-100">
            <button
              type="button"
              onClick={permModal.close}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              Save Permissions
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Employee Modal */}
      <ConfirmDialog
        isOpen={deactivateModal.isOpen}
        title="Deactivate Employee Account"
        message={`Are you sure you want to deactivate "${deactivateModal.data?.fullName}"? They will no longer be able to log in, but all historical invoices, sales, and attendance logs will be preserved permanently.`}
        onConfirm={handleDeactivate}
        onCancel={deactivateModal.close}
        isLoading={isLoading}
      />
    </div>
  );
};