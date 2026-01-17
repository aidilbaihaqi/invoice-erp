import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/db';
import { X, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Invoice, InvoiceItem } from '../lib/supabase';

interface InvoiceViewerProps {
  invoice: Invoice & { customer?: { name?: string; email?: string; phone?: string; address?: string }; tax_rate?: number; payment_terms?: string };
  onClose: () => void;
}

export default function InvoiceViewer({ invoice, onClose }: InvoiceViewerProps) {
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  type CompanySettings = {
    companyName: string;
    address: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    logoUrl?: string;
    terms?: string;
    showWatermark?: boolean;
    watermarkText?: string;
    watermarkOpacity?: number;
    showTerms?: boolean;
  };
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const useReactToPrintTyped = useReactToPrint as unknown as (opts: { content: () => HTMLElement | null; documentTitle?: string }) => () => void;
  const handlePrint = useReactToPrintTyped({
    content: () => componentRef.current,
    documentTitle: `Invoice-${invoice.invoice_number}`,
  });

  const loadItems = useCallback(async () => {
    try {
      const data = await db.invoices.getItems(invoice.id as string);
      setItems(data as InvoiceItem[]);
    } catch (error) {
      console.error('Error loading invoice items:', error);
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    loadItems();
    const settings = localStorage.getItem('company_settings');
    if (settings) {
      setCompanySettings(JSON.parse(settings) as CompanySettings);
    }
  }, [loadItems, invoice]);

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

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header Actions */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Invoice Details</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div ref={componentRef} className="relative bg-white p-8 shadow-sm mx-auto max-w-[210mm] min-h-[297mm]">
            {companySettings?.showWatermark !== false && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-10"
                style={{ opacity: companySettings?.watermarkOpacity ?? 0.05 }}
              >
                <div className="text-6xl font-bold">
                  {companySettings?.watermarkText || companySettings?.companyName || 'Your Company Name'}
                </div>
              </div>
            )}
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-gray-500">#{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                {companySettings?.logoUrl && (
                  <img src={companySettings.logoUrl} alt="Company Logo" className="h-12 ml-auto mb-2 object-contain" />
                )}
                <h3 className="text-xl font-bold text-gray-800">{companySettings?.companyName || 'Your Company Name'}</h3>
                <p className="text-gray-600 whitespace-pre-line">{companySettings?.address || '123 Business Street'}</p>
                <p className="text-gray-600">
                  {[companySettings?.city, companySettings?.country].filter(Boolean).join(', ') || 'City, Country 12345'}
                </p>
                <p className="text-gray-600">{companySettings?.email || 'contact@company.com'}</p>
                <p className="text-gray-600">{companySettings?.phone || '(555) 123-4567'}</p>
              </div>
            </div>

            {/* Bill To & Info */}
            <div className="flex justify-between mb-8 border-t pt-8">
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To</h4>
                <h3 className="text-lg font-bold text-gray-900">{invoice.customer?.name}</h3>
                <p className="text-gray-600 whitespace-pre-line">{invoice.customer?.address}</p>
                <p className="text-gray-600">{invoice.customer?.email}</p>
                <p className="text-gray-600">{invoice.customer?.phone}</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-gray-500 font-medium mr-4">Date:</span>
                  <span className="text-gray-900 font-bold">{formatDate(invoice.date)}</span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-500 font-medium mr-4">Due Date:</span>
                  <span className="text-gray-900 font-bold">{formatDate(invoice.due_date)}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium mr-4">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="min-w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-3 font-bold text-gray-900">Item Description</th>
                  <th className="text-right py-3 font-bold text-gray-900">Qty</th>
                  <th className="text-right py-3 font-bold text-gray-900">Price</th>
                  <th className="text-right py-3 font-bold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">Loading items...</td>
                  </tr>
                ) : items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.item_name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">{formatCurrency(item.unit_price)}</td>
                    <td className="text-right py-3 font-bold text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-2 text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            {invoice.notes && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 mb-1">Notes:</h4>
                  <p className="text-gray-600 text-sm">{invoice.notes}</p>
                </div>
              </div>
            )}
            {companySettings?.terms && companySettings?.showTerms !== false && (
              <div className="mt-8 border-t pt-6">
                <h4 className="font-bold text-gray-800 mb-2">Terms & Conditions</h4>
                <p className="text-gray-600 text-sm whitespace-pre-line">{companySettings.terms}</p>
              </div>
            )}
            <div className="mt-12 text-gray-500 text-sm">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="font-semibold text-gray-700 mb-2">Company Details</div>
                  <div className="text-sm text-gray-600">
                    <div>{companySettings?.companyName || 'Your Company Name'}</div>
                    <div className="whitespace-pre-line">{companySettings?.address || '123 Business Street'}</div>
                    <div>{[companySettings?.city, companySettings?.country].filter(Boolean).join(', ') || 'City, Country 12345'}</div>
                    <div>{companySettings?.email || 'contact@company.com'}</div>
                    <div>{companySettings?.phone || '(555) 123-4567'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-700 mb-2">Authorized Signature</div>
                  <div className="mt-8 border-t border-gray-300 pt-8 inline-block w-48"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
