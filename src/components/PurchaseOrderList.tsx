import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Plus, ShoppingCart, Trash2, Eye, CheckCircle, Edit2 } from 'lucide-react';
import PurchaseOrderViewer from './PurchaseOrderViewer';
import { PurchaseOrder } from '../lib/supabase';

type PurchaseOrderListItem = PurchaseOrder & { vendor?: { name?: string }; customer?: { name?: string } };

export default function PurchaseOrderList({ onNewPO, onEdit }: { onNewPO: () => void; onEdit: (po: PurchaseOrderListItem) => void }) {
  const [pos, setPos] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPO, setViewingPO] = useState<PurchaseOrderListItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadPOs();
  }, []);

  const loadPOs = async () => {
    try {
      const data = await db.purchase_orders.list() as PurchaseOrderListItem[];
      setPos(data);
    } catch (error) {
      console.error('Error loading POs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
      await db.purchase_orders.delete(id);
      loadPOs();
    } catch (error) {
      console.error('Error deleting PO:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await db.purchase_orders.updateStatus(id, status);
      loadPOs();
    } catch (error) {
      console.error('Error updating PO status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredPos = pos.filter((po) => {
    const term = search.toLowerCase();
    const matchesText =
      (po.po_number || '').toLowerCase().includes(term) ||
      (po.vendor?.name || po.customer?.name || '').toLowerCase().includes(term) ||
      (po.status || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || (po.status || '') === statusFilter;
    const dateVal = po.date ? new Date(po.date) : null;
    const fromOk = !dateFrom || (dateVal && dateVal >= new Date(dateFrom));
    const toOk = !dateTo || (dateVal && dateVal <= new Date(dateTo));
    return matchesText && matchesStatus && fromOk && toOk;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPos.length / pageSize));
  const pagedPos = filteredPos.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = [
      ['PO Number', 'Vendor', 'Date', 'Expected Delivery', 'Status', 'Total'],
      ...filteredPos.map((po) => [
        po.po_number,
        po.vendor?.name || po.customer?.name || '',
        po.date,
        po.expected_delivery || '',
        po.status || '',
        String(po.total),
      ]),
    ];
    const csvContent = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase_orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (viewingPO) {
    return <PurchaseOrderViewer po={viewingPO} onClose={() => setViewingPO(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search PO/vendor/status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Export CSV
          </button>
          <button
            onClick={onNewPO}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create PO
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredPos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
          <p className="text-gray-500 mt-2">Create your first purchase order to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagedPos.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {po.po_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {po.vendor?.name || po.customer?.name || 'Unknown Vendor'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(po.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(po.expected_delivery)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      po.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(po.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {po.status !== 'completed' && (
                      <button
                        onClick={() => { if (po.id) handleStatusUpdate(po.id, 'completed'); }}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Mark as Received"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(po)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewingPO(po)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { if (po.id) handleDelete(po.id); }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100"
                disabled={page === 1}
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100"
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
