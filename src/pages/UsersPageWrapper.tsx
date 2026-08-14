import { useState, useEffect, type FormEvent } from 'react';
import { UsersPage } from '../features/users/UsersPage';
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

  const loadEmployees = async () => {
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
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleFormChange = (field: keyof CreateUserFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.fullName || !form.username) return;

    try {
      await apiClient('/api/Employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ fullName: '', username: '', password: '', role: 'Cashier' });
      await loadEmployees();
    } catch (err: any) {
      alert(`Error creating user: ${err.message || 'Failed'}`);
    }
  };

  const handleToggleStatus = async (employee: EmployeeOption) => {
    try {
      await apiClient(`/api/Employees/${employee.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !employee.isActive }),
      });
      await loadEmployees();
    } catch (err: any) {
      alert(`Error toggling status: ${err.message || 'Failed'}`);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <UsersPage
      form={form}
      searchTerm={searchTerm}
      employees={filteredEmployees}
      onFormChange={handleFormChange}
      onSearchChange={setSearchTerm}
      onSubmit={handleSubmit}
      onToggleStatus={handleToggleStatus}
      onRefresh={loadEmployees}
    />
  );
};
