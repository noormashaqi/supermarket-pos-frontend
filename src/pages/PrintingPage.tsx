import { useState, useEffect } from 'react';
import { PrintingView } from '../features/printing/PrintingView';
import type {
  InvoiceDetail,
  InvoiceListItem,
  PrintableInvoice,
  PrintingFiltersState,
} from '../types/app';
import { invoicesService } from '../api/services/invoicesService';

export const PrintingPage = () => {
  const [filters, setFilters] = useState<PrintingFiltersState>({
    invoiceDate: '',
    invoiceEmployeeId: '',
    invoiceProductId: '',
    invoiceId: '',
  });

  const [invoiceList, setInvoiceList] = useState<InvoiceListItem[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail | null>(null);
  const [printableInvoice, setPrintableInvoice] = useState<PrintableInvoice | null>(null);

  const handleFilterChange = (field: keyof PrintingFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadInvoices = async () => {
    try {
      const invoices = await invoicesService.getInvoices();
      const listItems: InvoiceListItem[] = invoices.map((inv) => ({
        id: Number(inv.id) || 1,
        invoiceNumber: inv.invoiceNumber,
        employeeId: 1,
        employeeName: inv.employeeName,
        date: inv.createdAt,
        totalAfterDiscount: inv.totalAfterDiscount,
        hasReturn: inv.hasReturn,
      }));
      setInvoiceList(listItems);
    } catch {
      // fallback
    }
  };

  const handleSelectInvoice = (id: number) => {
    setFilters((prev) => ({ ...prev, invoiceId: String(id) }));
  };

  const handleLoadInvoiceById = async () => {
    if (!filters.invoiceId) return;
    try {
      const inv = await invoicesService.getInvoiceById(filters.invoiceId);
      if (inv) {
        setInvoiceDetails({
          id: Number(inv.id) || 1,
          invoiceNumber: inv.invoiceNumber,
          employeeId: 1,
          employeeName: inv.employeeName,
          date: inv.createdAt,
          totalBeforeDiscount: inv.totalBeforeDiscount,
          discountPercentage: inv.discountPercentage,
          totalAfterDiscount: inv.totalAfterDiscount,
          hasReturn: inv.hasReturn,
          items: inv.items.map((i, idx) => ({
            id: idx + 1,
            productId: Number(i.productId) || 1,
            productNameSnapshot: i.productNameSnapshot,
            unitPriceSnapshot: i.unitPriceSnapshot,
            quantity: i.quantity,
            lineTotal: i.lineTotal,
          })),
        });
      }
    } catch {
      // fallback
    }
  };

  const handleLoadPrintableInvoice = async () => {
    if (!filters.invoiceId) return;
    try {
      const inv = await invoicesService.getInvoiceById(filters.invoiceId);
      if (inv) {
        setPrintableInvoice({
          invoiceId: Number(inv.id) || 1,
          invoiceNumber: inv.invoiceNumber,
          employeeName: inv.employeeName,
          date: inv.createdAt,
          paymentMethod: 'Cash',
          totalBeforeDiscount: inv.totalBeforeDiscount,
          discountPercentage: inv.discountPercentage,
          discountAmount: inv.totalBeforeDiscount - inv.totalAfterDiscount,
          totalAfterDiscount: inv.totalAfterDiscount,
          hasReturn: inv.hasReturn,
          htmlReceipt: '',
          items: inv.items.map((i) => ({
            productId: Number(i.productId) || 1,
            productName: i.productNameSnapshot,
            unitPrice: i.unitPriceSnapshot,
            quantity: i.quantity,
            lineTotal: i.lineTotal,
          })),
        });
      }
    } catch {
      // fallback
    }
  };

  const handleOpenPrintWindow = () => {
    window.print();
  };

  useEffect(() => {
    handleLoadInvoices();
  }, []);

  return (
    <PrintingView
      filters={filters}
      invoiceList={invoiceList}
      invoiceDetails={invoiceDetails}
      printableInvoice={printableInvoice}
      onFilterChange={handleFilterChange}
      onSelectInvoice={handleSelectInvoice}
      onLoadInvoices={handleLoadInvoices}
      onLoadInvoiceById={handleLoadInvoiceById}
      onLoadPrintableInvoice={handleLoadPrintableInvoice}
      onOpenPrintWindow={handleOpenPrintWindow}
    />
  );
};
