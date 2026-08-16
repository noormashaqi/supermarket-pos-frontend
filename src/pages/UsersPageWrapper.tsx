import { useState, useEffect, type FormEvent } from 'react';
import { Users, UserPlus, Search, UserX, UserCheck, Clock } from 'lucide-react';
import { Badge, Table, Modal, ConfirmDialog, type Column } from '../components/common';
import { useModal } from '../hooks';
import type { CreateUserFormState, EmployeeOption, RoleOption } from '../types/app';
import { apiClient } from '../api/client';
import { formatDate } from '../utils';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  loginTime: string;
  logoutTime?: string | null;
}

const defaultRoles: RoleOption[] = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Cashier' },
  { id: 3, name: 'InventoryEmployee' },
];

export const UsersPageWrapper = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance'>('employees');
  const [roles, setRoles] = useState<RoleOption[]>(defaultRoles);
  const [form, setForm] = useState<CreateUserFormState>({
    fullName: '',
    username: '',
    password: '',
    role: 'Cashier',
    roleId: 2,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addUserModal = useModal();
  const toggleStatusModal = useModal<EmployeeOption>();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empData, attData, rolesData] = await Promise.all([
        apiClient<any[]>('/api/Employees').catch(() => []),
        apiClient<any[]>('/api/Attendance').catch(() => []),
        apiClient<any[]>('/api/Roles').catch(() => []),
      ]);

      if (Array.isArray(rolesData) && rolesData.length > 0) {
        const mappedRoles = rolesData.map((r: any) => ({
          id: Number(r.id || r.roleId) || 1,
          name: String(r.name || r.roleName || r.role || 'Role'),
        }));
        setRoles(mappedRoles);
        if (mappedRoles.length > 0 && !form.roleId) {
          setForm((prev) => ({
            ...prev,
            roleId: mappedRoles[0].id,
            role: mappedRoles[0].name,
          }));
        }
      }

      if (Array.isArray(empData)) {
        setEmployees(
          empData.map((e) => ({
            id: Number(e.id) || 1,
            fullName: e.fullName || e.name || 'User',
            username: e.username || 'user',
            role: e.role || 'Cashier',
            roleId: e.roleId ? Number(e.roleId) : undefined,
            isActive: e.isActive ?? true,
          }))
        );
      }

      if (Array.isArray(attData)) {
        setAttendanceLogs(
          attData.map((a) => ({
            id: Number(a.id) || 1,
            employeeId: Number(a.employeeId) || 1,
            employeeName: a.employeeName || 'Staff',
            loginTime: a.loginTime || new Date().toISOString(),
            logoutTime: a.logoutTime,
          }))
        );
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormChange = (field: keyof CreateUserFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleSelectChange = (roleIdVal: string) => {
    const selectedId = Number(roleIdVal);
    const foundRole = roles.find((r) => r.id === selectedId);
    setForm((prev) => ({
      ...prev,
      roleId: selectedId,
      role: foundRole ? foundRole.name : prev.role,
    }));
  };

  const handleCreateUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.username) return;

    setIsLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        username: form.username,
        password: form.password,
        roleId: form.roleId || 2,
        role: form.role || 'Cashier',
      };

      await apiClient('/api/Employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setForm({ fullName: '', username: '', password: '', role: 'Cashier', roleId: 2 });
      await loadData();
      addUserModal.close();
    } catch (err: any) {
      alert(`Error creating user: ${err.message || 'Failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleStatusModal.data) return;
    const emp = toggleStatusModal.data;
    setIsLoading(true);
    try {
      await apiClient(`/api/Employees/${emp.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !emp.isActive }),
      });
      await loadData();
      toggleStatusModal.close();
    } catch (err: any) {
      alert(`Error toggling status: ${err.message || 'Failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAttendance = attendanceLogs.filter(
    (a) =>
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(a.employeeId).includes(searchTerm)
  );

  const employeeColumns: Column<EmployeeOption>[] = [
    {
      header: 'Employee Name',
      cell: (emp) => (
        <div>
          <p className="font-bold text-slate-800 text-xs">{emp.fullName}</p>
          <p className="text-[10px] text-slate-400 font-mono">@{emp.username}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      cell: (emp) => (
        <Badge variant={emp.role === 'Admin' ? 'danger' : emp.role === 'InventoryEmployee' || emp.role === 'Inventory' ? 'warning' : 'info'}>
          {emp.role}
        </Badge>
      ),
    },
    {
      header: 'Account Status',
      cell: (emp) => (
        <Badge variant={emp.isActive ? 'success' : 'danger'}>
          {emp.isActive ? 'Active (نشط)' : 'Deactivated (معطل)'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (emp) => (
        <button
          onClick={() => toggleStatusModal.open(emp)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
            emp.isActive
              ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {emp.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          <span>{emp.isActive ? 'Deactivate' : 'Activate'}</span>
        </button>
      ),
    },
  ];

  const attendanceColumns: Column<AttendanceRecord>[] = [
    {
      header: 'Employee Name',
      cell: (att) => <span className="font-bold text-slate-800 text-xs">{att.employeeName}</span>,
    },
    {
      header: 'Login Time (وقت الدخول)',
      cell: (att) => <span className="text-xs font-semibold text-blue-600">{formatDate(att.loginTime)}</span>,
    },
    {
      header: 'Logout Time (وقت الخروج)',
      cell: (att) => (
        <span className="text-xs font-semibold text-slate-600">
          {att.logoutTime ? formatDate(att.logoutTime) : 'Active Session'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (att) => (
        <Badge variant={att.logoutTime ? 'info' : 'success'}>
          {att.logoutTime ? 'Shift Finished' : 'Currently On Duty'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Staff & Attendance Directory (إدارة الموظفين والدخول)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee accounts, assign roles, inspect active shifts, or toggle login access.
          </p>
        </div>

        <button
          onClick={() => addUserModal.open()}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Tabs Bar */}
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
            <span>Employee Accounts ({employees.length})</span>
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
            <span>Shift Attendance Log ({attendanceLogs.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 pl-1 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'employees'
                ? 'Search employee by name, username, or role...'
                : 'Search shift history by employee name...'
            }
            className="w-full text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-medium bg-transparent"
          />
        </div>
      </div>

      {/* Main Table */}
      {activeTab === 'employees' ? (
        <Table
          columns={employeeColumns}
          data={filteredEmployees}
          keyExtractor={(emp) => String(emp.id)}
          emptyMessage="No employees found."
        />
      ) : (
        <Table
          columns={attendanceColumns}
          data={filteredAttendance}
          keyExtractor={(att) => String(att.id)}
          emptyMessage="No shift attendance records found."
        />
      )}

      {/* Add New Employee Modal */}
      <Modal
        isOpen={addUserModal.isOpen}
        onClose={addUserModal.close}
        title="Add New Employee Account (إضافة موظف جديد)"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => handleFormChange('fullName', e.target.value)}
              placeholder="e.g. Tariq Ahmad"
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
              value={form.username}
              onChange={(e) => handleFormChange('username', e.target.value.toLowerCase())}
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
              value={form.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Role (الدورالوظيفي) <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.roleId || ''}
              onChange={(e) => handleRoleSelectChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4 border-slate-100">
            <button
              type="button"
              onClick={addUserModal.close}
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
              {isLoading ? 'Creating...' : 'Create Employee Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate / Activate Status Dialog */}
      <ConfirmDialog
        isOpen={toggleStatusModal.isOpen}
        title={toggleStatusModal.data?.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={
          toggleStatusModal.data?.isActive
            ? `Are you sure you want to deactivate "${toggleStatusModal.data?.fullName}"? They will no longer be able to log in, but all historical data remains preserved.`
            : `Are you sure you want to activate "${toggleStatusModal.data?.fullName}"?`
        }
        onConfirm={handleConfirmToggleStatus}
        onCancel={toggleStatusModal.close}
        isLoading={isLoading}
      />
    </div>
  );
};
