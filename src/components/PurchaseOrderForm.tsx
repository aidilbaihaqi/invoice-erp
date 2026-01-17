import { useState, useEffect } from 'react';
import { Customer, PurchaseOrderItem, Item, PurchaseOrder } from '../lib/supabase';
import { db } from '../lib/db';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface PurchaseOrderFormProps {
  initialData?: (PurchaseOrder & { id: string }) | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialItems?: PurchaseOrderItem[];
}

export default function PurchaseOrderForm({ initialData, onSuccess, onCancel, initialItems }: PurchaseOrderFormProps) {
  const [vendors, setVendors] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      po_id: '',
    },
  ]);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadVendors();
    loadProducts();
    if (initialData) {
      setPoNumber(initialData.po_number);
      setDate(initialData.date);
      setExpectedDelivery(initialData.expected_delivery || '');
      setNotes(initialData.notes || '');
      setSelectedVendor(initialData.vendor_id);
      loadPOItems(initialData.id);
    } else {
      generatePoNumber();
      if (initialItems && initialItems.length > 0) {
        setItems(
          initialItems.map((item) => ({
            ...item,
            total: item.quantity * item.unit_price,
          }))
        );
      }
    }
  }, [initialData, initialItems]);

  const loadPOItems = async (id: string) => {
    try {
      const data = await db.purchase_orders.getItems(id);
      setItems(data.map((item: PurchaseOrderItem) => ({
        ...item,
        total: item.quantity * item.unit_price
      })));
    } catch (error) {
      console.error('Error loading PO items:', error);
    }
  };

  const loadVendors = async () => {
    try {
      // Using customers as vendors for now, in a real app might be separate
      const data = await db.customers.list();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
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

  const generatePoNumber = () => {
    const prefix = 'PO';
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const key = `seq_${prefix}_${yyyymm}`;
    const current = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(current));
    const seq = String(current).padStart(4, '0');
    setPoNumber(`${prefix}/${yyyymm}/${seq}`);
  };

  const calculateItemTotal = (item: PurchaseOrderItem) => {
    return item.quantity * item.unit_price;
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
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
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax assumption for PO
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const savePO = async () => {
    try {
      if (!selectedVendor) {
        setMessage('Please select a vendor');
        return;
      }

      const totals = calculateTotals();
      const poData: Omit<PurchaseOrder, 'id' | 'created_at'> = {
        po_number: poNumber,
        vendor_id: selectedVendor,
        date,
        expected_delivery: expectedDelivery,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        notes,
        status: initialData ? initialData.status : 'pending',
      };

      let error;
      if (initialData) {
        const result = await db.purchase_orders.update(initialData.id, poData, items);
        error = result.error;
      } else {
        const result = await db.purchase_orders.create(poData, items);
        error = result.error;
      }

      if (error) throw error;

      setMessage('Purchase Order saved successfully!');
      setTimeout(() => {
        if (!initialData) {
          generatePoNumber();
          setItems([
            {
              item_name: '',
              description: '',
              quantity: 1,
              unit_price: 0,
              total: 0,
              po_id: '',
            },
          ]);
          setNotes('');
        }
        setMessage('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error) {
      const err = error as unknown;
      const msg = typeof err === 'object' && err && 'message' in err ? String((err as { message: unknown }).message) : 'Error saving purchase order';
      setMessage(msg);
      console.error(err);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{initialData ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
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
        <div className={`p-4 mb-4 rounded-md ${
          message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">PO Number</label>
          <input
            type="text"
            value={poNumber}
            readOnly
            className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery</label>
          <input
            type="date"
            value={expectedDelivery}
            onChange={(e) => setExpectedDelivery(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Items</h3>
          <button
            onClick={addItem}
            className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      list={`products-${index}`}
                      value={item.item_name}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="w-full rounded border-gray-300 text-sm"
                      placeholder="Item name"
                    />
                    <datalist id={`products-${index}`}>
                      {products.map((product) => (
                        <option key={product.id} value={product.name} />
                      ))}
                    </datalist>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full rounded border-gray-300 text-sm"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-20 rounded border-gray-300 text-sm text-right"
                      min="1"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      className="w-32 rounded border-gray-300 text-sm text-right"
                      min="0"
                    />
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (10%):</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
            <span>Total:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={savePO}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Purchase Order
        </button>
      </div>
    </div>
  );
}
