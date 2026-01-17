import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import { auth, AuthUser } from './lib/auth';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import QuotationForm from './components/QuotationForm';
import QuotationList from './components/QuotationList';
import PurchaseOrderList from './components/PurchaseOrderList';
import PurchaseOrderForm from './components/PurchaseOrderForm';
import CustomerManagement from './components/CustomerManagement';
import ItemManagement from './components/ItemManagement';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';

import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { Item, PurchaseOrderItem, Invoice, Quotation, PurchaseOrder } from './lib/supabase';

function App() {
  type Page = 'dashboard' | 'invoices' | 'quotations' | 'po' | 'customers' | 'items' | 'about' | 'contact' | 'settings';
  type EditingQuotation = (Quotation & { id: string } & { customer?: { name?: string } }) | null;
  type EditingPO = (PurchaseOrder & { id: string } & { customer?: { name?: string } }) | null;
  type EditingInvoice = (Invoice & { id: string } & { customer?: { name?: string } }) | null;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<EditingInvoice>(null);
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<EditingQuotation>(null);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [editingPO, setEditingPO] = useState<EditingPO>(null);
  const [poInitialItems, setPoInitialItems] = useState<PurchaseOrderItem[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await auth.getSession();
        if (session) {
          const currentUser = await auth.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsCreatingInvoice(false);
    setEditingInvoice(null);
    setIsCreatingQuotation(false);
    setEditingQuotation(null);
    setIsCreatingPO(false);
    setEditingPO(null);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRestock = (item: Item) => {
    const quantity = Math.max(5 - (item.stock || 0), 1);
    const prefill: PurchaseOrderItem = {
      item_name: item.name,
      description: item.description || '',
      quantity,
      unit_price: item.price,
      total: quantity * item.price,
    };
    setPoInitialItems([prefill]);
    setEditingPO(null);
    setIsCreatingPO(true);
    setCurrentPage('po');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onRestock={handleRestock}
            onCreateInvoice={() => { setIsCreatingInvoice(true); setEditingInvoice(null); setCurrentPage('invoices'); }}
            onCreateQuotation={() => { setIsCreatingQuotation(true); setEditingQuotation(null); setCurrentPage('quotations'); }}
            onCreatePO={() => { setIsCreatingPO(true); setEditingPO(null); setCurrentPage('po'); }}
          />
        );
      case 'invoices':
        return isCreatingInvoice || editingInvoice ? (
          <InvoiceForm 
            initialData={editingInvoice}
            onSuccess={() => { setIsCreatingInvoice(false); setEditingInvoice(null); }} 
            onCancel={() => { setIsCreatingInvoice(false); setEditingInvoice(null); }} 
          />
        ) : (
          <InvoiceList 
            onNewInvoice={() => setIsCreatingInvoice(true)} 
            onEdit={(invoice) => setEditingInvoice(invoice?.id ? { ...invoice, id: invoice.id } : null)}
          />
        );
      case 'quotations':
        return isCreatingQuotation || editingQuotation ? (
          <QuotationForm 
            initialData={editingQuotation}
            onSuccess={() => { setIsCreatingQuotation(false); setEditingQuotation(null); }}
            onCancel={() => { setIsCreatingQuotation(false); setEditingQuotation(null); }}
          />
        ) : (
          <QuotationList 
            onNewQuotation={() => setIsCreatingQuotation(true)}
            onEdit={(quotation) => setEditingQuotation(quotation?.id ? { ...quotation, id: quotation.id } : null)}
          />
        );
      case 'po':
        return isCreatingPO || editingPO ? (
          <PurchaseOrderForm 
            initialData={editingPO}
            initialItems={poInitialItems}
            onSuccess={() => { setIsCreatingPO(false); setEditingPO(null); }} 
            onCancel={() => { setIsCreatingPO(false); setEditingPO(null); }} 
          />
        ) : (
          <PurchaseOrderList 
            onNewPO={() => setIsCreatingPO(true)}
            onEdit={(po) => setEditingPO(po?.id ? { ...po, id: po.id } : null)}
          />
        );
      case 'customers':
        return <CustomerManagement />;
      case 'items':
        return <ItemManagement />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <InvoiceList 
            onNewInvoice={() => setIsCreatingInvoice(true)}
            onEdit={(invoice) => setEditingInvoice(invoice?.id ? { ...invoice, id: invoice.id } : null)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} />
      <main className="py-6">{renderPage()}</main>
    </div>
  );
}

export default App;
