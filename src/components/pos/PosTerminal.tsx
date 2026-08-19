import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  ShoppingBag,
  Percent,
  AlertTriangle,
  Banknote,
  BookOpen,
  UserPlus,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import type { Product, Category, Invoice, DebtCustomer } from '../../types';
import { productsService } from '../../api/services/productsService';
import { categoriesService } from '../../api/services/categoriesService';
import { invoicesService } from '../../api/services/invoicesService';
import { debtService } from '../../api/services/debtService';
import { formatCurrency } from '../../utils';
import { hasPermission } from '../../utils/permissions';
import { PrintInvoiceModal } from '../invoices/PrintInvoiceModal';
import { AddCustomerModal } from './AddCustomerModal';
import { ToastContainer, type ToastMessage } from '../common';
import { useModal } from '../../hooks';
import { useSession } from '../../hooks/useSession';

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosTerminal = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPercentage, setDiscountPercentage] = useState('0'); // % Percentage only!
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debt'>('cash');
  const [debtCustomers, setDebtCustomers] = useState<DebtCustomer[]>([]);
  const [selectedDebtCustomer, setSelectedDebtCustomer] = useState<DebtCustomer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Session & Permissions
  const { session } = useSession();
  const canManageDebt = hasPermission('debt.manage', session.permissions);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Print Modal
  const printModal = useModal<Invoice>();

  // Add Customer Modal
  const addCustomerModal = useModal();

  const loadPosData = async () => {
    const [prods, cats] = await Promise.all([
      productsService.getProducts(),
      categoriesService.getCategories(),
    ]);
    setProducts(prods.filter((p) => p.isActive));
    setCategories(cats);
  };

  const loadDebtCustomers = async () => {
    const customers = await debtService.getCustomers();
    setDebtCustomers(customers);
  };

  useEffect(() => {
    loadPosData();
    loadDebtCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      addToast('error', `"${product.name}" is currently Out of Stock!`);
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex !== -1) {
        const currentQty = prevCart[existingIndex].quantity;
        if (currentQty >= product.quantity) {
          addToast('error', `Maximum stock limit (${product.quantity} ${product.unit}) reached for "${product.name}".`);
          return prevCart;
        }
        return prevCart.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.quantity) {
              addToast('error', `Maximum stock available is ${item.product.quantity} ${item.product.unit}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Calculations (Percentage discount on invoice level only, NO tax)
  const totalBeforeDiscount = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountPctNum = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const discountValue = totalBeforeDiscount * (discountPctNum / 100);
  const totalAfterDiscount = Number((totalBeforeDiscount - discountValue).toFixed(2));

  const handlePaymentMethodChange = (method: 'cash' | 'debt') => {
    if (method === 'debt' && !canManageDebt) {
      addToast('error', '⛔ Access denied — "debt.manage" permission required. Login as admin.');
      return;
    }
    setPaymentMethod(method);
    if (method === 'cash') {
      setSelectedDebtCustomer(null);
      setCustomerSearchTerm('');
      setShowCustomerDropdown(false);
    }
  };

  const handleSelectDebtCustomer = (customer: DebtCustomer) => {
    setSelectedDebtCustomer(customer);
    setCustomerSearchTerm(customer.nickname);
    setShowCustomerDropdown(false);
    setCustomerName(customer.nickname);
  };

  const handleCustomerCreated = (customer: DebtCustomer) => {
    setDebtCustomers((prev) => [...prev, customer]);
    handleSelectDebtCustomer(customer);
    addToast('success', `Customer "${customer.nickname}" created & selected!`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('error', 'Cannot checkout an empty invoice!');
      return;
    }

    if (paymentMethod === 'debt' && !selectedDebtCustomer) {
      addToast('error', 'Please select a customer for the debt sale!');
      return;
    }

    for (const item of cart) {
      if (item.quantity > item.product.quantity) {
        addToast('error', `Requested quantity for "${item.product.name}" exceeds available stock!`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const invoiceData = await invoicesService.createInvoice(
        {
          customerName: paymentMethod === 'debt' && selectedDebtCustomer
            ? selectedDebtCustomer.nickname
            : customerName,
          discountPercentage: discountPctNum,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          paymentMethod,
          debtCustomerId: selectedDebtCustomer?.id,
        },
        cart.map((item) => ({
          name: item.product.name,
          unit: item.product.unit,
        })),
        'Ahmad (Cashier)'
      );

      setCart([]);
      setDiscountPercentage('0');
      setPaymentMethod('cash');
      setSelectedDebtCustomer(null);
      setCustomerSearchTerm('');
      await loadPosData();
      await loadDebtCustomers();

      const methodLabel = invoiceData.paymentMethod === 'debt' ? '(DEBT)' : '(CASH)';
      addToast('success', `Invoice #${invoiceData.invoiceNumber} ${methodLabel} created & saved successfully!`);
      printModal.open(invoiceData);
    } catch (err: any) {
      addToast('error', `Checkout failed: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredDebtCustomers = debtCustomers.filter((c) =>
    c.nickname.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)] min-h-[600px]">
      {/* Toast Notification Banner Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* LEFT COLUMN: Product Catalog (Search by Name) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4 h-full">
        {/* Name Search Box */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 pl-1 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product by name..."
            className="w-full py-1 text-xs text-slate-800 focus:outline-none placeholder-slate-400 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs font-bold text-slate-600">No products found</p>
              <p className="text-[10px] text-slate-400">Try searching for another product name.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isLowStock = p.quantity <= p.minStockLevel && p.quantity > 0;
                const isOutOfStock = p.quantity === 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`bg-white p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                      isOutOfStock
                        ? 'border-rose-200 bg-rose-50/20 opacity-60'
                        : isLowStock
                        ? 'border-amber-300 hover:border-amber-400'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {p.unit === 'package' ? 'Package (باكيج)' : 'Piece (حبة)'}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            OUT
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> ({p.quantity})
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.quantity} stock
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.categoryName}</p>
                    </div>

                    <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(p.sellingPrice)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Checkout Drawer */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between h-full shadow-xs">
        {/* Cart Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Cashier Register</span>
            </h2>
            <p className="text-[11px] text-slate-500">Order items breakdown</p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        </div>

        {/* ─── Payment Method Toggle ─── */}
        <div className="my-3">
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
            Payment Method (طريقة الدفع)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('cash')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cash (نقد)</span>
            </button>
            <button
              type="button"
              onClick={() => handlePaymentMethodChange('debt')}
              disabled={!canManageDebt}
              title={!canManageDebt ? 'Requires debt.manage permission — login as admin' : 'Record as debt / notebook sale'}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !canManageDebt
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60'
                  : paymentMethod === 'debt'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-300 cursor-pointer'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer'
              }`}
            >
              {!canManageDebt ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              <span>Debt / دين</span>
            </button>
          </div>

          {/* Permission denied notice */}
          {!canManageDebt && (
            <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1 font-medium">
              <ShieldAlert className="w-3 h-3" />
              Debt sales require "debt.manage" permission. Login as admin to enable.
            </p>
          )}
        </div>

        {/* ─── Debt Customer Selector (shown only when Debt is selected) ─── */}
        {paymentMethod === 'debt' && (
          <div className="mb-3 space-y-2">
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Select Debt Customer (اختر الزبون)
            </label>
            <div className="relative" ref={customerDropdownRef}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) setSelectedDebtCustomer(null);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer by nickname..."
                  className="w-full pl-9 pr-8 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>

              {/* Dropdown List */}
              {showCustomerDropdown && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredDebtCustomers.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-slate-400">
                      No customers found
                    </div>
                  ) : (
                    filteredDebtCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectDebtCustomer(c)}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors cursor-pointer flex justify-between items-center ${
                          selectedDebtCustomer?.id === c.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{c.nickname}</p>
                          {c.phone && (
                            <p className="text-[10px] text-slate-400">{c.phone}</p>
                          )}
                        </div>
                        {c.totalOutstanding > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            {formatCurrency(c.totalOutstanding)}
                          </span>
                        )}
                      </button>
                    ))
                  )}

                  {/* Add New Customer Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomerDropdown(false);
                      addCustomerModal.open();
                    }}
                    className="w-full text-left px-3 py-2.5 border-t border-slate-100 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-2 text-emerald-700"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">+ Add New Customer / Nickname</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selected customer badge */}
            {selectedDebtCustomer && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800">{selectedDebtCustomer.nickname}</p>
                  <p className="text-[10px] text-amber-600">
                    Current debt: {formatCurrency(selectedDebtCustomer.totalOutstanding)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDebtCustomer(null);
                    setCustomerSearchTerm('');
                  }}
                  className="text-amber-400 hover:text-amber-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Customer Name (shown only for cash payments) */}
        {paymentMethod === 'cash' && (
          <div className="my-3">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click any product to add to cart.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center"
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {formatCurrency(item.product.sellingPrice)} / {item.product.unit} x {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 min-w-[50px] text-right">
                    {formatCurrency(item.product.sellingPrice * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Percentage Discount (%) */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* Quick Discount Percentage Buttons */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                Invoice Discount (%) (خصم الفاتورة كنسبة مئوية)
              </label>
              <span className="text-[10px] font-bold text-blue-600">{discountPctNum}% Off</span>
            </div>

            <div className="flex gap-1.5 mb-1.5">
              {['0', '5', '10', '15', '20'].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercentage(pct)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    discountPercentage === pct
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pct === '0' ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="0%"
                className="w-full pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(totalBeforeDiscount)}</span>
            </div>
            {discountPctNum > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount ({discountPctNum}%):</span>
                <span>-{formatCurrency(discountValue)}</span>
              </div>
            )}
            <div className={`flex justify-between text-sm font-bold border-t border-slate-200 pt-1.5 mt-1 ${
              paymentMethod === 'debt' ? 'text-amber-800' : 'text-slate-900'
            }`}>
              <span>
                {paymentMethod === 'debt'
                  ? 'Total (DEBT — Notebook):'
                  : 'Final Total (Cash Only):'}
              </span>
              <span className={`text-base ${paymentMethod === 'debt' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCurrency(totalAfterDiscount)}
              </span>
            </div>
          </div>

          {/* Confirm Invoice Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting || (paymentMethod === 'debt' && !selectedDebtCustomer)}
            className={`w-full py-3 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
              paymentMethod === 'debt'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <span>Confirming Sale...</span>
            ) : (
              <>
                {paymentMethod === 'debt' ? (
                  <BookOpen className="w-4 h-4" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>
                  {paymentMethod === 'debt'
                    ? `CONFIRM DEBT SALE & PRINT (${formatCurrency(totalAfterDiscount)})`
                    : `CONFIRM SALE & PRINT RECEIPT (${formatCurrency(totalAfterDiscount)})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Print Thermal Receipt Modal */}
      <PrintInvoiceModal
        isOpen={printModal.isOpen}
        onClose={printModal.close}
        invoice={printModal.data}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={addCustomerModal.isOpen}
        onClose={addCustomerModal.close}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};
