import { apiClient } from '../client';
import type { Employee, EmployeeRole, AttendanceLog } from '../../types/employees';

export const employeesService = {
  getEmployees: async (): Promise<Employee[]> => {
    return await apiClient<Employee[]>('/employees');
  },

  createEmployee: async (data: {
    fullName: string;
    username: string;
    password?: string;
    role: EmployeeRole;
    permissions: string[];
  }): Promise<Employee> => {
    return await apiClient<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEmployeePermissions: async (
    id: string | number,
    permissions: string[]
  ): Promise<Employee> => {
    return await apiClient<Employee>(`/employees/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
  },

  deactivateEmployee: async (id: string | number): Promise<void> => {
    await apiClient(`/employees/${id}/deactivate`, {
      method: 'PATCH',
    });
  },

  getAttendanceLogs: async (): Promise<AttendanceLog[]> => {
    return await apiClient<AttendanceLog[]>('/attendance');
  },
};