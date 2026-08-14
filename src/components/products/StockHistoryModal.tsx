import { Modal, Table, Badge, type Column } from '../common';
import type { Product, StockMovement } from '../../types';
import { formatDate } from '../../utils';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  movements: StockMovement[];
  isLoading?: boolean;
}

export const StockHistoryModal = ({
  isOpen,
  onClose,
  product,
  movements,
}: StockHistoryModalProps) => {
  if (!product) return null;

  const columns: Column<StockMovement>[] = [
    {
      header: 'Date & Time',
      cell: (m) => formatDate(m.createdAt),
    },
    {
      header: 'Quantity Added',
      cell: (m) => <span className="font-bold text-emerald-600 text-xs">+{m.quantityAdded}</span>,
    },
    {
      header: 'Reason / Source',
      accessorKey: 'reason',
    },
    {
      header: 'Employee',
      cell: (m) => <Badge variant="info">{m.employeeName}</Badge>,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock Addition History: ${product.name}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Product Category: {product.categoryName}</span>
          <span className="font-bold text-blue-700">Current Balance: {product.quantity} {product.unit}</span>
        </div>

        <Table
          columns={columns}
          data={movements}
          keyExtractor={(m) => m.id}
          emptyMessage="No stock addition logs recorded for this product."
        />

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
