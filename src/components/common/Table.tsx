import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  onRowClick,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200/80 shadow-xs font-medium text-xs">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-xs">
      <table className="w-full text-left text-xs text-slate-700 border-collapse">
        <thead className="bg-slate-50/90 backdrop-blur-xs text-[10px] uppercase tracking-wider text-slate-500 font-extrabold border-b border-slate-200/80 sticky top-0 z-10">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-5 py-3.5 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`transition-all duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-indigo-50/40 active:bg-indigo-50/70' : 'hover:bg-slate-50/80'
              }`}
            >
              {columns.map((col, idx) => (
                <td key={idx} className="px-5 py-3.5 font-medium whitespace-nowrap">
                  {col.cell
                    ? col.cell(item)
                    : col.accessorKey
                    ? String(item[col.accessorKey] ?? '')
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
