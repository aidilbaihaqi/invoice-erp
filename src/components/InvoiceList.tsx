import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Invoice } from '../lib/supabase';
import { Plus, FileText, Trash2, Eye, Edit2 } from 'lucide-react';
import InvoiceViewer from './InvoiceViewer';

type InvoiceListItem = Invoice & { customer?: { name?: string } };

export default function InvoiceList({ onNewInvoice, onEdit }: { onNewInvoice: () => void; onEdit: (invoice: InvoiceListItem) => void }) {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceListItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await db.invoices.list();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await db.invoices.delete(id);
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleStatusToggle = async (id?: string, currentStatus?: Invoice['status']) => {
    if (!id || !currentStatus) return;
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      await db.invoices.updateStatus(id, newStatus);
      loadInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
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

  const isOverdue = (invoice: Invoice) => {
    if (!invoice.due_date || invoice.status === 'paid') return false;
    const today = new Date();
    const due = new Date(invoice.due_date);
    return today > due;
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const matchesText =
      (inv.invoice_number || '').toLowerCase().includes(term) ||
      (inv.customer?.name || '').toLowerCase().includes(term) ||
      (inv.status || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || (inv.status || '') === statusFilter;
    const dateVal = inv.date ? new Date(inv.date) : null;
    const fromOk = !dateFrom || (dateVal && dateVal >= new Date(dateFrom));
    const toOk = !dateTo || (dateVal && dateVal <= new Date(dateTo));
    return matchesText && matchesStatus && fromOk && toOk;
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const pagedInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = [
      ['Invoice Number', 'Customer', 'Date', 'Due Date', 'Status', 'Total'],
      ...filteredInvoices.map((inv) => [
        inv.invoice_number,
        inv.customer?.name || '',
        inv.date,
        inv.due_date || '',
        inv.status,
        String(inv.total),
      ]),
    ];
    const csvContent = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (viewingInvoice) {
    return <InvoiceViewer invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search invoice/customer/status..."
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
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
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
            onClick={onNewInvoice}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
          <p className="text-gray-500 mt-2">Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
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
              {pagedInvoices.map((invoice) => (
                <tr key={invoice.id} className={`hover:bg-gray-50 ${isOverdue(invoice) ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customer?.name || 'Unknown Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStatusToggle(invoice.id, invoice.status)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : isOverdue(invoice)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                      title="Click to toggle status"
                    >
                      {invoice.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewingInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
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
