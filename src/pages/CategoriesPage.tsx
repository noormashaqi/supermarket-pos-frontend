import { useState, useEffect, type FormEvent } from 'react';
import { Tags, Plus, Search } from 'lucide-react';
import { Modal, Table, type Column } from '../components/common';
import { useModal } from '../hooks';
import { categoriesService } from '../api/services/categoriesService';
import type { Category, CreateCategoryInput } from '../types';
import { formatDate } from '../utils';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formModal = useModal<Category>();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    setIsLoading(true);
    try {
      const input: CreateCategoryInput = { name, code, description };
      await categoriesService.createCategory(input);
      await loadCategories();
      formModal.close();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Category>[] = [
    {
      header: 'Category Code',
      cell: (cat) => <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{cat.code}</span>,
    },
    {
      header: 'Category Name',
      cell: (cat) => <span className="font-bold text-slate-800 text-xs">{cat.name}</span>,
    },
    {
      header: 'Description',
      cell: (cat) => <span className="text-xs text-slate-500">{cat.description || 'No description'}</span>,
    },
    {
      header: 'Created Date',
      cell: (cat) => <span className="text-xs text-slate-500">{formatDate(cat.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-600" />
            <span>Product Categories</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Organize supermarket products into structured categories.</p>
        </div>

        <button
          onClick={() => {
            setName('');
            setCode('');
            setDescription('');
            formModal.open();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories by name or code..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredCategories.length} Categories
        </span>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredCategories}
        keyExtractor={(cat) => cat.id}
        emptyMessage="No categories found."
      />

      {/* Add Category Modal */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        title="Add New Category"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dairy & Eggs"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Category Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. DAIRY"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of products inside this category..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {isLoading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
