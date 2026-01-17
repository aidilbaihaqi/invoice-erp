import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { DollarSign, FileText, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';
import { Item, Invoice, Quotation, PurchaseOrder } from '../lib/supabase';

interface DashboardProps {
  onRestock?: (item: Item) => void;
  onCreateInvoice?: () => void;
  onCreateQuotation?: () => void;
  onCreatePO?: () => void;
}

export default function Dashboard({ onRestock, onCreateInvoice, onCreateQuotation, onCreatePO }: DashboardProps) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    outstandingInvoices: 0,
    totalQuotations: 0,
    totalPOs: 0,
    pendingAmount: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const invoices = await db.invoices.list() as Invoice[];
      const quotations = await db.quotations.list() as Quotation[];
      const pos = await db.purchase_orders.list() as PurchaseOrder[];
      const items = await db.items.list() as Item[];

      const totalRevenue = invoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.total, 0);

      const pendingAmount = invoices
        .filter((i) => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.total, 0);

      const lowStock = items.filter((item) => (item.stock || 0) < ((item.min_stock ?? 5)));

      setStats({
        totalRevenue,
        outstandingInvoices: invoices.filter((i) => i.status === 'pending').length,
        totalQuotations: quotations.length,
        totalPOs: pos.length,
        pendingAmount,
      });
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Paid Invoices
          </p>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Amount</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.pendingAmount)}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-2">
            {stats.outstandingInvoices} invoices pending
          </p>
        </div>

        {/* Quotations */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Quotations</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalQuotations}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Potential revenue
          </p>
        </div>

        {/* Purchase Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Purchase Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalPOs}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Total orders placed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            Low Stock Alerts
          </h3>
          {lowStockItems.length === 0 ? (
            <p className="text-gray-500 text-sm">All stock levels are good.</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-red-600">Stock: {item.stock || 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-white text-red-600 rounded border border-red-100">
                      Low Stock
                    </span>
                    {onRestock && (
                      <button
                        onClick={() => onRestock(item)}
                        className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        title="Create PO to restock"
                      >
                        Restock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={onCreateInvoice}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              New Invoice
            </button>
            <button
              onClick={onCreateQuotation}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              New Quotation
            </button>
            <button
              onClick={onCreatePO}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              New Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
