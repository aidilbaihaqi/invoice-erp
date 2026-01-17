import { useRef, useState, useEffect, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';
import { db } from '../lib/db';
import { Quotation, QuotationItem } from '../lib/supabase';

interface QuotationViewerProps {
  quotation: Quotation & { customer?: { name?: string; email?: string; phone?: string; address?: string } };
  onClose: () => void;
}

export default function QuotationViewer({ quotation, onClose }: QuotationViewerProps) {
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
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
    documentTitle: `Quotation-${quotation.quotation_number}`,
  });

  const loadItems = useCallback(async () => {
    try {
      const data = await db.quotations.getItems(quotation.id as string);
      setItems(data as QuotationItem[]);
    } catch (error) {
      console.error('Error loading quotation items:', error);
    } finally {
      setLoading(false);
    }
  }, [quotation.id]);

  useEffect(() => {
    loadItems();
    const settings = localStorage.getItem('company_settings');
    if (settings) {
      setCompanySettings(JSON.parse(settings) as CompanySettings);
    }
  }, [loadItems, quotation]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Quotation Details</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div ref={componentRef} className="relative bg-white p-8 shadow-sm mx-auto max-w-[210mm] min-h-[297mm]">
          {companySettings?.showWatermark !== false && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-10"
              style={{ opacity: companySettings?.watermarkOpacity ?? 0.05 }}
            >
              <div className="text-6xl font-bold">
                {companySettings?.watermarkText || companySettings?.companyName || 'My Company Name'}
              </div>
            </div>
          )}
          <div className="mb-8 flex justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">QUOTATION</h1>
              <p className="text-gray-600">#{quotation.quotation_number}</p>
            </div>
            <div className="text-right">
              {companySettings?.logoUrl && (
                <img src={companySettings.logoUrl} alt="Company Logo" className="h-12 ml-auto mb-2 object-contain" />
              )}
              <h3 className="font-bold text-lg mb-1">{companySettings?.companyName || 'My Company Name'}</h3>
              <p className="text-gray-600 text-sm whitespace-pre-line">{companySettings?.address || '123 Business Street'}</p>
              <p className="text-gray-600 text-sm">
                {[companySettings?.city, companySettings?.country].filter(Boolean).join(', ') || 'City, Country 12345'}
              </p>
              <p className="text-gray-600 text-sm">{companySettings?.email || 'contact@mycompany.com'}</p>
              <p className="text-gray-600 text-sm">{companySettings?.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-gray-600 font-medium mb-2">Quotation For:</h3>
              <div className="font-bold text-lg">{quotation.customer?.name}</div>
              <div className="text-gray-600">{quotation.customer?.email}</div>
              <div className="text-gray-600">{quotation.customer?.phone}</div>
              <div className="text-gray-600 whitespace-pre-line">{quotation.customer?.address}</div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <span className="text-gray-600 mr-4">Date:</span>
                <span className="font-medium">{formatDate(quotation.date)}</span>
              </div>
              <div className="mb-2">
                <span className="text-gray-600 mr-4">Valid Until:</span>
                <span className="font-medium">{formatDate(quotation.valid_until)}</span>
              </div>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-3 font-bold text-gray-800">Description</th>
                <th className="text-right py-3 font-bold text-gray-800">Quantity</th>
                <th className="text-right py-3 font-bold text-gray-800">Price</th>
                <th className="text-right py-3 font-bold text-gray-800">Discount</th>
                <th className="text-right py-3 font-bold text-gray-800">Tax</th>
                <th className="text-right py-3 font-bold text-gray-800">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center">Loading items...</td>
                </tr>
              ) : items.map((item, index) => (
                <tr key={index}>
                  <td className="py-3">
                    <div className="font-medium text-gray-900">{item.item_name}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </td>
                  <td className="py-3 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                  <td className="py-3 text-right text-gray-900">{formatCurrency(item.discount)}</td>
                  <td className="py-3 text-right text-gray-900">{item.tax_rate}%</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatCurrency((item.quantity * item.unit_price - item.discount) * (1 + item.tax_rate / 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount:</span>
                <span>-{formatCurrency(quotation.discount)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span>{formatCurrency(quotation.tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                <span>Total:</span>
                <span>{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>

          {(quotation.notes || quotation.payment_terms) && (
            <div className="grid grid-cols-2 gap-8 border-t pt-8">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Notes:</h4>
                <p className="text-gray-600 text-sm whitespace-pre-line">{quotation.notes}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Payment Terms:</h4>
                <p className="text-gray-600 text-sm whitespace-pre-line">{quotation.payment_terms}</p>
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
                  <div>{companySettings?.companyName || 'My Company Name'}</div>
                  <div className="whitespace-pre-line">{companySettings?.address || '123 Business Street'}</div>
                  <div>{[companySettings?.city, companySettings?.country].filter(Boolean).join(', ') || 'City, Country 12345'}</div>
                  <div>{companySettings?.email || 'contact@mycompany.com'}</div>
                  <div>{companySettings?.phone}</div>
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
