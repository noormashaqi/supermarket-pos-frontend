import { useState, useEffect, type FormEvent } from 'react';
import { Users, UserPlus, Search, UserX, RefreshCw, UserCheck } from 'lucide-react';
import { Badge, Table, Modal, ConfirmDialog, type Column } from '../components/common';
import { useModal } from '../hooks';
import type { CreateUserFormState, EmployeeOption } from '../types/app';
import { apiClient } from '../api/client';

export const UsersPageWrapper = () => {
  const [form, setForm] = useState<CreateUserFormState>({
    fullName: '',
    username: '',
    password: '',
    role: 'Cashier',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addUserModal = useModal();
  const toggleStatusModal = useModal<EmployeeOption>();

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<any[]>('/api/Employees');
      if (Array.isArray(data)) {
        setEmployees(
          data.map((e) => ({
            id: Number(e.id) || 1,
            fullName: e.fullName || e.name || 'User',
            username: e.username || 'user',
            role: e.role || 'Cashier',
            isActive: e.isActive ?? true,
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
    loadEmployees();
  }, []);

  const handleFormChange = (field: keyof CreateUserFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.username) return;

    setIsLoading(true);
    try {
      await apiClient('/api/Employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ fullName: '', username: '', password: '', role: 'Cashier' });
      await loadEmployees();
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
      await loadEmployees();
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

  const columns: Column<EmployeeOption>[] = [
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
      header: 'Role',
      cell: (emp) => {
        if (emp.role === 'Admin') return <Badge variant="info">Admin</Badge>;
        if (emp.role === 'InventoryEmployee' || emp.role === 'Inventory')
          return <Badge variant="warning">Inventory Employee</Badge>;
        return <Badge variant="success">Cashier</Badge>;
      },
    },
    {
      header: 'Account Status',
      cell: (emp) =>
        emp.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Deactivated</Badge>
        ),
    },
    {
      header: 'Actions',
      cell: (emp) => (
        <button
          onClick={() => toggleStatusModal.open(emp)}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
            emp.isActive
              ? 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
              : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {emp.isActive ? (
            <>
              <UserX className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span>Activate</span>
            </>
          )}
        </button>
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
            <span>Employee User Management (إدارة الموظفين)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin screen to register new employee accounts, view account status, and manage active/deactivated profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEmployees}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => addUserModal.open()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee by name, username, or role..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredEmployees.length} Employee Profiles
        </span>
      </div>

      {/* Main Table Container */}
      <Table
        columns={columns}
        data={filteredEmployees}
        keyExtractor={(emp) => String(emp.id)}
        emptyMessage="No employees found."
      />

      {/* Add User Modal */}
      <Modal
        isOpen={addUserModal.isOpen}
        onClose={addUserModal.close}
        title="Add New Employee User"
        maxWidth="md"
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
              placeholder="e.g. Tariq Al-Mansoor"
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
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cashier">Cashier (كاشير)</option>
              <option value="InventoryEmployee">Inventory Employee (موظف مخزون)</option>
              <option value="Admin">Admin (مدير النظام)</option>
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
