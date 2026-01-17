import { useState, useEffect } from 'react';
import { Customer, QuotationItem, Item, Quotation } from '../lib/supabase';
import { db } from '../lib/db';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface QuotationFormProps {
  initialData?: (Quotation & { id: string }) | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function QuotationForm({ initialData, onSuccess, onCancel }: QuotationFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([
    {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      tax_rate: 10,
      total: 0,
      quotation_id: '',
    },
  ]);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCustomers();
    loadProducts();
    if (initialData) {
      setQuotationNumber(initialData.quotation_number);
      setDate(initialData.date);
      setValidUntil(initialData.valid_until);
      setNotes(initialData.notes || '');
      setPaymentTerms(initialData.payment_terms || '');
      setSelectedCustomer(initialData.customer_id);
      loadQuotationItems(initialData.id);
    } else {
      generateQuotationNumber();
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 30);
      setValidUntil(validDate.toISOString().split('T')[0]);
    }
  }, [initialData]);

  const loadQuotationItems = async (id: string) => {
    try {
      const data = await db.quotations.getItems(id);
      setItems(data.map((item: QuotationItem) => ({
        ...item,
        total: (item.quantity * item.unit_price - (item.discount || 0)) * (1 + (item.tax_rate || 0) / 100)
      })));
    } catch (error) {
      console.error('Error loading quotation items:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await db.customers.list();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await db.items.list();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleProductSelect = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        item_name: product.name,
        description: product.description || '',
        unit_price: product.price,
      };
      newItems[index].total = calculateItemTotal(newItems[index]);
      setItems(newItems);
    } else {
      updateItem(index, 'item_name', productName);
    }
  };

  const generateQuotationNumber = () => {
    const prefix = 'QUO';
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const key = `seq_${prefix}_${yyyymm}`;
    const current = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(current));
    const seq = String(current).padStart(4, '0');
    setQuotationNumber(`${prefix}/${yyyymm}/${seq}`);
  };

  const calculateItemTotal = (item: QuotationItem) => {
    const subtotal = item.quantity * item.unit_price;
    const afterDiscount = subtotal - item.discount;
    const tax = afterDiscount * (item.tax_rate / 100);
    return afterDiscount + tax;
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount: 0,
        tax_rate: 10,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const tax = items.reduce((sum, item) => {
      const afterDiscount = item.quantity * item.unit_price - item.discount;
      return sum + afterDiscount * (item.tax_rate / 100);
    }, 0);
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };

  const saveQuotation = async () => {
    if (!selectedCustomer) {
      setMessage('Please select a customer');
      return;
    }

    const totals = calculateTotals();

    try {
      const quotationData: Omit<Quotation, 'id' | 'created_at'> = {
        quotation_number: quotationNumber,
        customer_id: selectedCustomer,
        date,
        valid_until: validUntil,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        notes,
        payment_terms: paymentTerms,
        status: initialData ? initialData.status : 'draft',
      };

      let error;
      if (initialData) {
        const result = await db.quotations.update(initialData.id, quotationData, items);
        error = result.error;
      } else {
        const result = await db.quotations.create(quotationData, items);
        error = result.error;
      }

      if (error) throw error;

      setMessage('Quotation saved successfully!');
      setTimeout(() => {
        if (!initialData) {
          generateQuotationNumber();
          setItems([
            {
              item_name: '',
              description: '',
              quantity: 1,
              unit_price: 0,
              discount: 0,
              tax_rate: 10,
              total: 0,
              quotation_id: '',
            },
          ]);
          setNotes('');
          setPaymentTerms('');
        }
        setMessage('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      setMessage('Error saving quotation');
      console.error(error);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{initialData ? 'Edit Quotation' : 'Create Quotation'}</h2>
        {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quotation Number
          </label>
          <input
            type="text"
            value={quotationNumber}
            onChange={(e) => setQuotationNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid Until
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Items</h3>
          <button
            onClick={addItem}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 p-4 border border-gray-200 rounded-md"
            >
              <div className="col-span-3">
                <input
                  type="text"
                  list={`products-${index}`}
                  placeholder="Item Name"
                  value={item.item_name}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <datalist id={`products-${index}`}>
                  {products.map((product) => (
                    <option key={product.id} value={product.name} />
                  ))}
                </datalist>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, 'description', e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, 'quantity', parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-2 py-1 border rounded text-sm ${
                    !initialData &&
                    products.find(p => p.name === item.item_name) &&
                    ((products.find(p => p.name === item.item_name)?.stock) || 0) < item.quantity
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  min="1"
                />
                {!initialData &&
                  products.find(p => p.name === item.item_name) &&
                  (((products.find(p => p.name === item.item_name)?.stock) || 0) < item.quantity) && (
                    <div className="text-xs text-red-500 mt-1">
                      Max: {products.find(p => p.name === item.item_name)?.stock || 0}
                    </div>
                  )}
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={(e) =>
                    updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  placeholder="Tax %"
                  value={item.tax_rate}
                  onChange={(e) =>
                    updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-1">
                <div className="px-2 py-1 bg-gray-100 rounded text-sm text-right">
                  {item.total.toFixed(2)}
                </div>
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => removeItem(index)}
                  className="w-full px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Terms
          </label>
          <textarea
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            rows={3}
            placeholder="e.g. 50% down payment, 50% upon completion"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="flex justify-between items-start">
        <button
          onClick={saveQuotation}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Quotation
        </button>

        <div className="bg-gray-50 p-4 rounded-lg min-w-[300px]">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium">${totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">${totals.tax.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-lg">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
