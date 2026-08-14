import { useState, useEffect } from 'react';
import { ReportsView } from '../features/reports/ReportsView';
import { apiClient } from '../api/client';
import type {
  CategoryOption,
  EmployeeOption,
  ProductOption,
  ReportFiltersState,
  ReportKind,
  ReportState,
} from '../types/app';

const defaultFilters: ReportFiltersState = {
  salesFromDate: '',
  salesToDate: '',
  salesEmployeeId: '',
  inventoryCategoryId: '',
  inventoryActiveOnly: 'true',
  attendanceFromDate: '',
  attendanceToDate: '',
  attendanceEmployeeId: '',
  employeesActiveOnly: '',
  employeesRole: '',
  employeeDetailId: '',
  employeeDetailFromDate: '',
  employeeDetailToDate: '',
  productDetailId: '',
  productDetailFromDate: '',
  productDetailToDate: '',
};

const defaultReports: ReportState = {
  sales: null,
  inventory: null,
  attendance: null,
  employees: null,
  employeeDetail: null,
  productDetail: null,
};

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState<ReportKind>('sales');
  const [selectedReportRowIndex, setSelectedReportRowIndex] = useState<number | null>(null);
  
  const [filters, setFilters] = useState<ReportFiltersState>(defaultFilters);
  const [reports, setReports] = useState<ReportState>(defaultReports);
  
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOptions = async () => {
    try {
      const [empData, prodData, catData] = await Promise.all([
        apiClient<any[]>('/api/Employees').catch(() => []),
        apiClient<any[]>('/api/Products').catch(() => []),
        apiClient<any[]>('/api/Categories').catch(() => []),
      ]);

      if (Array.isArray(empData)) {
        setEmployees(
          empData.map((e) => ({
            id: Number(e.id) || 1,
            fullName: e.fullName || e.name || 'User',
            username: e.username || 'user',
            role: e.role || 'Cashier',
            isActive: e.isActive ?? true,
          }))
        );
      }

      if (Array.isArray(prodData)) {
        setProducts(
          prodData.map((p) => ({
            id: Number(p.id) || 1,
            name: p.name || 'Product',
            categoryId: Number(p.categoryId) || 1,
            categoryName: p.categoryName || 'General',
            isActive: p.isActive ?? true,
          }))
        );
      }

      if (Array.isArray(catData)) {
        setCategories(
          catData.map((c) => ({
            id: Number(c.id) || 1,
            name: c.name || 'Category',
          }))
        );
      }
    } catch (err) {
      console.error('Error loading report option dropdowns:', err);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const handleSelectedReportChange = (value: ReportKind) => {
    setSelectedReport(value);
    setSelectedReportRowIndex(null);
  };

  const handleSelectedReportRowChange = (value: number | null) => {
    setSelectedReportRowIndex(value);
  };

  const handleFilterChange = (field: keyof ReportFiltersState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRunReport = async (key: keyof ReportState, path: string, label: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient<any>(path);
      setReports((prev) => ({
        ...prev,
        [key]: data,
      }));
      setSelectedReportRowIndex(null); // Reset selected detail row when loading new report
    } catch (err: any) {
      alert(`Failed to load ${label}: ${err.message || 'Error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReport = (_title: string, _data: unknown) => {
    // Standard professional print window
    window.print();
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl min-h-[300px]">
          <div className="text-xs font-bold text-blue-600 bg-white shadow-md border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <span>Running report calculations...</span>
          </div>
        </div>
      )}
      
      <ReportsView
        selectedReport={selectedReport}
        selectedReportRowIndex={selectedReportRowIndex}
        filters={filters}
        reports={reports}
        employees={employees}
        products={products}
        categories={categories}
        onSelectedReportChange={handleSelectedReportChange}
        onSelectedReportRowChange={handleSelectedReportRowChange}
        onFilterChange={handleFilterChange}
        onRunReport={handleRunReport}
        onPrintReport={handlePrintReport}
      />
    </div>
  );
};
