import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  ShoppingBag,
  Percent,
  Pause,
  Play,
  Edit2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { Product, Category, Invoice } from '../../types';
import { productsService } from '../../api/services/productsService';
import { categoriesService } from '../../api/services/categoriesService';
import { invoicesService } from '../../api/services/invoicesService';
import { formatCurrency, getSession, hasPermission } from '../../utils';
import { PermissionKeys } from '../../types/employees';
import { PrintInvoiceModal } from '../invoices/PrintInvoiceModal';
import { SupervisorOverrideModal } from './SupervisorOverrideModal';
import { ToastContainer, type ToastMessage, Modal } from '../common';
import { useModal } from '../../hooks';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice?: number; // Custom overriden unit price
}

interface HeldInvoice {
  id: string;
  referenceTag: string;
  cart: CartItem[];
  customerName: string;
  discountPercentage: string;
  timestamp: string;
}

export const PosTerminal = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Held Invoices State
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discountPercentage, setDiscountPercentage] = useState('0'); // % Percentage only!
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Price Override & Supervisor Authorization State
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [pendingOverrideItem, setPendingOverrideItem] = useState<{ productId: string; targetPrice: number } | null>(null);
  const [authorizedSupervisorName, setAuthorizedSupervisorName] = useState<string | null>(null);

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

  const canOverridePrice =
    hasPermission(PermissionKeys.InvoicesOverridePrice) ||
    hasPermission(PermissionKeys.SalesPriceOverride) ||
    hasPermission('invoices.override_price') ||
    hasPermission('sales.price_override') ||
    Boolean(authorizedSupervisorName);

  const loadPosData = async () => {
    const [prods, cats] = await Promise.all([
      productsService.getProducts(),
      categoriesService.getCategories(),
    ]);
    setProducts(prods.filter((p) => p.isActive));
    setCategories(cats);
  };

  useEffect(() => {
    loadPosData();
    try {
      const stored = localStorage.getItem('supermarket_held_invoices');
      if (stored) {
        setHeldInvoices(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading held invoices:', err);
    }
  }, []);

  const handleHoldInvoice = () => {
    if (cart.length === 0) {
      addToast('error', 'Cannot hold an empty cart!');
      return;
    }

    const tag = window.prompt(
      'Enter an optional reference tag/note for this paused order:',
      `Customer ${heldInvoices.length + 1}`
    );
    if (tag === null) return; // Cancel clicked

    const referenceTag = tag.trim() || `Customer ${heldInvoices.length + 1}`;
    const newHeld: HeldInvoice = {
      id: String(Date.now()),
      referenceTag,
      cart,
      customerName,
      discountPercentage,
      timestamp: new Date().toISOString(),
    };

    const updated = [...heldInvoices, newHeld];
    setHeldInvoices(updated);
    localStorage.setItem('supermarket_held_invoices', JSON.stringify(updated));

    // Clear active cart state
    setCart([]);
    setDiscountPercentage('0');
    setCustomerName('Walk-in Customer');

    addToast('success', `Cart held successfully: "${referenceTag}"`);
  };

  const handleResumeInvoice = (held: HeldInvoice) => {
    if (cart.length > 0) {
      const confirmOverwrite = window.confirm(
        'There are items in your active register workspace. Resuming this order will overwrite the current cart. Do you want to proceed?'
      );
      if (!confirmOverwrite) return;
    }

    setCart(held.cart);
    setCustomerName(held.customerName || 'Walk-in Customer');
    setDiscountPercentage(held.discountPercentage || '0');

    // Remove from heldInvoices
    const updated = heldInvoices.filter((item) => item.id !== held.id);
    setHeldInvoices(updated);
    localStorage.setItem('supermarket_held_invoices', JSON.stringify(updated));

    setIsHeldModalOpen(false);
    addToast('success', `Resumed order: "${held.referenceTag}"`);
  };

  const handleDiscardInvoice = (id: string, tag: string) => {
    const confirmDiscard = window.confirm(
      `Are you sure you want to discard the held order "${tag}"? This action cannot be undone.`
    );
    if (!confirmDiscard) return;

    const updated = heldInvoices.filter((item) => item.id !== id);
    setHeldInvoices(updated);
    localStorage.setItem('supermarket_held_invoices', JSON.stringify(updated));

    addToast('info', `Discarded held order: "${tag}"`);
  };

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
      return [...prevCart, { product, quantity: 1, unitPrice: product.sellingPrice }];
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

  // Price Override Actions
  const getItemUnitPrice = (item: CartItem) => item.unitPrice ?? item.product.sellingPrice;

  const startEditUnitPrice = (item: CartItem) => {
    const currentPrice = getItemUnitPrice(item);
    setEditingPriceProductId(item.product.id);
    setTempPriceInput(String(currentPrice));
  };

  const saveUnitPriceEdit = (productId: string) => {
    const parsedPrice = parseFloat(tempPriceInput);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      addToast('error', 'Invalid unit price value!');
      setEditingPriceProductId(null);
      return;
    }

    if (canOverridePrice) {
      // Authorized User Flow: Direct unit price edit in cart row
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, unitPrice: parsedPrice } : item
        )
      );
      setEditingPriceProductId(null);
      addToast('success', 'Unit price updated successfully!');
    } else {
      // Unauthorized User Flow: Trigger supervisor override modal
      setPendingOverrideItem({ productId, targetPrice: parsedPrice });
      setIsSupervisorModalOpen(true);
      setEditingPriceProductId(null);
    }
  };

  const handleSupervisorAuthorized = (supervisorName: string) => {
    setAuthorizedSupervisorName(supervisorName);
    if (pendingOverrideItem) {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === pendingOverrideItem.productId
            ? { ...item, unitPrice: pendingOverrideItem.targetPrice }
            : item
        )
      );
      addToast('success', `Price override approved by supervisor @${supervisorName}!`);
    }
    setPendingOverrideItem(null);
  };

  // Calculations (Percentage discount on invoice level only, NO tax)
  const totalBeforeDiscount = cart.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.quantity,
    0
  );
  const discountPctNum = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const discountValue = totalBeforeDiscount * (discountPctNum / 100);
  const totalAfterDiscount = Number((totalBeforeDiscount - discountValue).toFixed(2));

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('error', 'Cannot checkout an empty invoice!');
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
      const session = getSession();
      const currentEmployeeName = session ? (session.fullName || session.username) : 'Cashier';

      const invoiceData = await invoicesService.createInvoice(
        {
          customerName,
          discountPercentage: discountPctNum,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: getItemUnitPrice(item),
          })),
        },
        currentEmployeeName
      );

      setCart([]);
      setDiscountPercentage('0');
      await loadPosData();
      addToast('success', `Invoice #${invoiceData.invoiceNumber} created & saved successfully!`);
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
              {filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.product.id === product.id);
                const isOutOfStock = product.quantity <= 0;
                const isLowStock = product.quantity <= product.minStockLevel && product.quantity > 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                        {inCart.quantity}
                      </span>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          {product.categoryName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            product.unit === 'package'
                              ? 'bg-purple-50 text-purple-600 border border-purple-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {product.unit === 'package' ? 'Package' : 'Piece'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <p className="text-sm font-extrabold text-blue-600">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                        <p className="text-[9px] text-slate-400">per {product.unit}</p>
                      </div>

                      <div>
                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                            Stock: {product.quantity}
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500">
                            Stock: {product.quantity}
                          </span>
                        )}
                      </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHeldModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer border ${
                heldInvoices.length > 0
                  ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                  : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Pause className="w-3 h-3" />
              <span>Held ({heldInvoices.length})</span>
            </button>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
        </div>

        {/* Customer Name */}
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

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click any product to add to cart.</p>
            </div>
          ) : (
            cart.map((item) => {
              const currentUnitPrice = getItemUnitPrice(item);
              const isOverridden = item.unitPrice !== undefined && item.unitPrice !== item.product.sellingPrice;
              const isEditingThis = editingPriceProductId === item.product.id;

              return (
                <div
                  key={item.product.id}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                      
                      {/* Price Row with Direct Edit / Override Button */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={tempPriceInput}
                              onChange={(e) => setTempPriceInput(e.target.value)}
                              autoFocus
                              className="w-16 px-1.5 py-0.5 bg-white border border-blue-400 rounded text-xs font-bold text-blue-700 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveUnitPriceEdit(item.product.id)}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                              title="Save Price"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">
                              {formatCurrency(currentUnitPrice)} / {item.product.unit}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => startEditUnitPrice(item)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                              title={canOverridePrice ? 'Edit Unit Price' : 'Override Price (Requires Manager Approval)'}
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>{canOverridePrice ? 'Edit' : 'Override'}</span>
                            </button>

                            {isOverridden && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1 rounded flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Overridden</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
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

                    <span className="text-xs font-bold text-emerald-600 text-right">
                      {formatCurrency(currentUnitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })
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
              <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Subtotal & Total Breakdown */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (قبل الخصم):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(totalBeforeDiscount)}</span>
            </div>
            {discountPctNum > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount ({discountPctNum}%):</span>
                <span>-{formatCurrency(discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5 mt-1">
              <span>Total Payable (المبلغ النهائي):</span>
              <span className="text-emerald-600 text-base">{formatCurrency(totalAfterDiscount)}</span>
            </div>
          </div>

          {/* Pause Order & Checkout Action Bar */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleHoldInvoice}
              disabled={isSubmitting || cart.length === 0}
              className="px-3 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              title="Pause/Hold current order workspace"
            >
              <Pause className="w-4 h-4" />
              <span>Hold</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Sale...' : 'CONFIRM & PRINT RECEIPT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supervisor Override Authorization Modal */}
      <SupervisorOverrideModal
        isOpen={isSupervisorModalOpen}
        onClose={() => {
          setIsSupervisorModalOpen(false);
          setPendingOverrideItem(null);
        }}
        onAuthorize={handleSupervisorAuthorized}
        itemName={cart.find((i) => i.product.id === pendingOverrideItem?.productId)?.product.name}
      />

      {/* Held Orders Registry Modal */}
      <Modal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        title="Held / Paused Orders Registry (الطلبات المعلقة)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {heldInvoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <Pause className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-bold text-slate-600">No held orders currently saved.</p>
              <p className="text-[10px] text-slate-400">You can hold an order workspace to process another sale.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {heldInvoices.map((held) => {
                const itemCount = held.cart.reduce((s, i) => s + i.quantity, 0);
                const heldTotal = held.cart.reduce((s, i) => s + (i.unitPrice ?? i.product.sellingPrice) * i.quantity, 0);

                return (
                  <div
                    key={held.id}
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{held.referenceTag}</span>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {itemCount} items
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Customer: <span className="font-semibold">{held.customerName}</span> • Total: <span className="font-bold text-emerald-600">{formatCurrency(heldTotal)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResumeInvoice(held)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscardInvoice(held.id, held.referenceTag)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Print Receipt Modal */}
      {printModal.data && (
        <PrintInvoiceModal
          isOpen={printModal.isOpen}
          onClose={printModal.close}
          invoice={printModal.data}
        />
      )}
    </div>
  );
};
