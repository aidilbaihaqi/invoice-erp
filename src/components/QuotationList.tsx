import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Invoice, Quotation, QuotationItem } from '../lib/supabase';
import { Plus, FileCheck, Trash2, Eye, ArrowRight, Edit2 } from 'lucide-react';
import QuotationViewer from './QuotationViewer';

type QuotationListItem = Quotation & { customer?: { name?: string } };

export default function QuotationList({ onNewQuotation, onEdit }: { onNewQuotation: () => void; onEdit: (quotation: QuotationListItem) => void }) {
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingQuotation, setViewingQuotation] = useState<QuotationListItem | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const data = await db.quotations.list();
      setQuotations(data);
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    const term = search.toLowerCase();
    const matchesText =
      (q.quotation_number || '').toLowerCase().includes(term) ||
      (q.customer?.name || '').toLowerCase().includes(term) ||
      (q.status || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || (q.status || '') === statusFilter;
    const dateVal = q.date ? new Date(q.date) : null;
    const fromOk = !dateFrom || (dateVal && dateVal >= new Date(dateFrom));
    const toOk = !dateTo || (dateVal && dateVal <= new Date(dateTo));
    return matchesText && matchesStatus && fromOk && toOk;
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / pageSize));
  const pagedQuotations = filteredQuotations.slice((page - 1) * pageSize, page * pageSize);

  const exportCSV = () => {
    const rows = [
      ['Quotation Number', 'Customer', 'Date', 'Valid Until', 'Status', 'Total'],
      ...filteredQuotations.map((q) => [
        q.quotation_number,
        q.customer?.name || '',
        q.date,
        q.valid_until || '',
        q.status || '',
        String(q.total),
      ]),
    ];
    const csvContent = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotations_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleConvertToInvoice = async (quotation: QuotationListItem) => {
    if (!confirm(`Convert Quotation #${quotation.quotation_number} to Invoice?`)) return;
    if (!quotation.id) return;

    try {
      // 1. Get Quotation Items
      const items = await db.quotations.getItems(quotation.id) as QuotationItem[];
      
      // 2. Prepare Invoice Data
      const invoiceData: Omit<Invoice, 'id' | 'created_at'> = {
        invoice_number: quotation.quotation_number.replace('QUO', 'INV'),
        customer_id: quotation.customer_id,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        tax: quotation.tax,
        total: quotation.total,
        status: 'pending',
        notes: `Converted from Quotation #${quotation.quotation_number}. ${quotation.notes || ''}`,
      };

      // 3. Prepare Invoice Items (remove IDs to create new ones)
      const invoiceItems = items.map((item) => ({
        item_name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax_rate: item.tax_rate,
        total: item.total
      }));

      // 4. Create Invoice
      const { error } = await db.invoices.create(invoiceData, invoiceItems);
      
      if (error) throw error;

      alert('Successfully converted to Invoice!');
    } catch (error) {
      console.error('Error converting to invoice:', error);
      alert('Failed to convert to invoice');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    
    try {
      await db.quotations.delete(id);
      loadQuotations();
    } catch (error) {
      console.error('Error deleting quotation:', error);
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

  if (viewingQuotation) {
    return <QuotationViewer quotation={viewingQuotation} onClose={() => setViewingQuotation(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quotations</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search quotation/customer/status..."
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
            onClick={onNewQuotation}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Quotation
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : filteredQuotations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No quotations found</h3>
          <p className="text-gray-500 mt-2">Create your first quotation to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quotation Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
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
              {pagedQuotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {quotation.quotation_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quotation.customer?.name || 'Unknown Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quotation.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quotation.valid_until)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(quotation.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleConvertToInvoice(quotation)}
                      className="text-green-600 hover:text-green-900 mr-4"
                      title="Convert to Invoice"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(quotation)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewingQuotation(quotation)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(quotation.id)}
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
