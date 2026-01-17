import { supabase, Customer, Item, Invoice, InvoiceItem, Quotation, QuotationItem, PurchaseOrder, PurchaseOrderItem } from './supabase';

const isMock = import.meta.env.VITE_SUPABASE_URL === 'https://example.supabase.co' || !import.meta.env.VITE_SUPABASE_URL;

// Helper to get current user ID
const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// LocalStorage keys
const STORAGE_KEYS = {
  CUSTOMERS: 'bolt_customers',
  ITEMS: 'bolt_items',
  INVOICES: 'bolt_invoices',
  INVOICE_ITEMS: 'bolt_invoice_items',
  QUOTATIONS: 'bolt_quotations',
  QUOTATION_ITEMS: 'bolt_quotation_items',
  PURCHASE_ORDERS: 'bolt_purchase_orders',
  PO_ITEMS: 'bolt_po_items',
};

// Seed data
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    const customers: Customer[] = [
      {
        id: '1',
        name: 'PT Maju Jaya',
        address: 'Jl. Sudirman No. 1, Jakarta',
        phone: '021-1234567',
        email: 'info@majujaya.com',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'CV Berkah Abadi',
        address: 'Jl. Ahmad Yani No. 10, Surabaya',
        phone: '031-9876543',
        email: 'contact@berkahabadi.com',
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
    const items: Item[] = [
      {
        id: '1',
        name: 'Web Development Service',
        description: 'Fullstack web development',
        price: 15000000,
        stock: 100,
        min_stock: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'Flutter based mobile app',
        price: 25000000,
        stock: 50,
        min_stock: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Server Maintenance',
        description: 'Monthly server maintenance',
        price: 2000000,
        stock: 2,
        min_stock: 5,
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }
};

if (isMock) {
  seedData();
}

// Helper to simulate async delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const db = {
  customers: {
    list: async (): Promise<Customer[]> => {
      if (isMock) {
        await delay(300);
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
      }
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> => {
      if (isMock) {
        await delay(300);
        const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
        const newCustomer = {
          ...customer,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        customers.push(newCustomer);
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        return newCustomer;
      }
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.from('customers').insert({ ...customer, user_id: userId }).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
      if (isMock) {
        await delay(300);
        const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
        const index = customers.findIndex((c: Customer) => c.id === id);
        if (index !== -1) {
          customers[index] = { ...customers[index], ...updates };
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
          return customers[index];
        }
        throw new Error('Customer not found');
      }
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
  },

  items: {
    list: async (): Promise<Item[]> => {
      if (isMock) {
        await delay(300);
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
      }
      const { data, error } = await supabase.from('items').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    create: async (item: Omit<Item, 'id' | 'created_at'>): Promise<Item> => {
      if (isMock) {
        await delay(300);
        const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
        const newItem = {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        items.push(newItem);
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
        return newItem;
      }
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.from('items').insert({ ...item, user_id: userId }).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: Partial<Item>): Promise<Item> => {
      if (isMock) {
        await delay(300);
        const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
        const index = items.findIndex((i: Item) => i.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
          return items[index];
        }
        throw new Error('Item not found');
      }
      const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
  },

  invoices: {
    list: async () => {
      if (isMock) {
        await delay(300);
        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        // Join with customers for display
        const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
        return invoices.map((inv: Invoice) => ({
          ...inv,
          customer: customers.find((c: Customer) => c.id === inv.customer_id)
        })).sort((a: Invoice, b: Invoice) => {
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
          const at = a.created_at ? new Date(a.created_at).getTime() : 0;
          return bt - at;
        });
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },

    create: async (invoice: Omit<Invoice, 'id' | 'created_at'>, items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]) => {
      if (isMock) {
        await delay(300);
        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        const invoiceItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICE_ITEMS) || '[]');
        
        const newInvoice = {
          ...invoice,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        invoices.push(newInvoice);
        
        const newItems = items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          invoice_id: newInvoice.id,
        }));
        invoiceItems.push(...newItems);
        
        // Deduct stock
        const dbItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
        items.forEach(invItem => {
          const itemIndex = dbItems.findIndex((i: Item) => i.name === invItem.item_name);
          if (itemIndex !== -1) {
            dbItems[itemIndex].stock = (dbItems[itemIndex].stock || 0) - invItem.quantity;
          }
        });
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(dbItems));

        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        localStorage.setItem(STORAGE_KEYS.INVOICE_ITEMS, JSON.stringify(invoiceItems));
        
        return { data: newInvoice, error: null };
      }
      
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({ ...invoice, user_id: userId })
        .select()
        .single();

      if (invoiceError) return { data: null, error: invoiceError };

      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: invoiceData.id
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      // Deduct stock in Supabase
      if (!itemsError) {
        for (const item of items) {
           // This is a simplified approach. In production, use RPC.
           const { data: product } = await supabase.from('items').select('id, stock').eq('name', item.item_name).eq('user_id', userId).single();
           if (product) {
             await supabase.from('items').update({ stock: (product.stock || 0) - item.quantity }).eq('id', product.id);
           }
        }
      }

      return { data: invoiceData, error: itemsError };
    },

    update: async (id: string, invoice: Partial<Invoice>, items?: Omit<InvoiceItem, 'id' | 'invoice_id'>[]) => {
      if (isMock) {
        await delay(300);
        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        const index = invoices.findIndex((i: Invoice) => i.id === id);
        
        if (index !== -1) {
          // If items are provided, handle stock reversal and update
          if (items) {
             const invoiceItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICE_ITEMS) || '[]');
             const dbItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
             
             // 1. Revert stock for old items
             const oldItems = invoiceItems.filter((i: InvoiceItem) => i.invoice_id === id);
             oldItems.forEach((oldItem: InvoiceItem) => {
               const itemIndex = dbItems.findIndex((i: Item) => i.name === oldItem.item_name);
               if (itemIndex !== -1) {
                 dbItems[itemIndex].stock = (dbItems[itemIndex].stock || 0) + oldItem.quantity;
               }
             });

             // 2. Remove old items
             const newInvoiceItems = invoiceItems.filter((i: InvoiceItem) => i.invoice_id !== id);
             
             // 3. Add new items and deduct stock
             const newItemsWithId = items.map(item => ({
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                invoice_id: id,
             }));
             
             newItemsWithId.forEach(newItem => {
               const itemIndex = dbItems.findIndex((i: Item) => i.name === newItem.item_name);
               if (itemIndex !== -1) {
                 dbItems[itemIndex].stock = (dbItems[itemIndex].stock || 0) - newItem.quantity;
               }
             });
             
             newInvoiceItems.push(...newItemsWithId);
             localStorage.setItem(STORAGE_KEYS.INVOICE_ITEMS, JSON.stringify(newInvoiceItems));
             localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(dbItems));
          }

          invoices[index] = { ...invoices[index], ...invoice };
          localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        }
        return { error: null };
      }
      
      // Supabase implementation (simplified, not handling stock reversal perfectly here for brevity)
      const { error } = await supabase.from('invoices').update(invoice).eq('id', id);
      if (error) return { error };

      if (items) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        const itemsWithId = items.map(item => ({ ...item, invoice_id: id }));
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsWithId);
        return { error: itemsError };
      }
      
      return { error: null };
    },

    delete: async (id: string) => {
      if (isMock) {
        await delay(300);
        let invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        invoices = invoices.filter((i: Invoice) => i.id !== id);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        return { error: null };
      }
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      return { error };
    },

    updateStatus: async (id: string, status: 'paid' | 'pending' | 'overdue') => {
      if (isMock) {
        await delay(300);
        const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]');
        const index = invoices.findIndex((i: Invoice) => i.id === id);
        if (index !== -1) {
          invoices[index].status = status;
          localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        }
        return { error: null };
      }
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
      return { error };
    },

    getItems: async (invoiceId: string) => {
      if (isMock) {
        await delay(300);
        const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICE_ITEMS) || '[]');
        return items.filter((i: InvoiceItem) => i.invoice_id === invoiceId);
      }
      const { data, error } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
      if (error) throw error;
      return data || [];
    }
  },

  quotations: {
    list: async () => {
      if (isMock) {
        await delay(300);
        const quotations = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATIONS) || '[]');
        const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
        return quotations.map((q: Quotation) => ({
          ...q,
          customer: customers.find((c: Customer) => c.id === q.customer_id)
        })).sort((a: Quotation, b: Quotation) => {
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
          const at = a.created_at ? new Date(a.created_at).getTime() : 0;
          return bt - at;
        });
      }
      
      const { data, error } = await supabase
        .from('quotations')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    delete: async (id: string) => {
      if (isMock) {
        await delay(300);
        let quotations = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATIONS) || '[]');
        quotations = quotations.filter((q: Quotation) => q.id !== id);
        localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
        return { error: null };
      }
      const { error } = await supabase.from('quotations').delete().eq('id', id);
      return { error };
    },
    getItems: async (quotationId: string) => {
      if (isMock) {
        await delay(300);
        const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATION_ITEMS) || '[]');
        return items.filter((i: QuotationItem) => i.quotation_id === quotationId);
      }
      const { data, error } = await supabase.from('quotation_items').select('*').eq('quotation_id', quotationId);
      if (error) throw error;
      return data || [];
    },
    create: async (quotation: Omit<Quotation, 'id' | 'created_at'>, items: Omit<QuotationItem, 'id' | 'quotation_id'>[]) => {
      if (isMock) {
        await delay(300);
        const quotations = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATIONS) || '[]');
        const quotationItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATION_ITEMS) || '[]');
        
        const newQuotation = {
          ...quotation,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        quotations.push(newQuotation);
        
        const newItems = items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          quotation_id: newQuotation.id,
        }));
        quotationItems.push(...newItems);
        
        localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
        localStorage.setItem(STORAGE_KEYS.QUOTATION_ITEMS, JSON.stringify(quotationItems));
        
        return { data: newQuotation, error: null };
      }

      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .insert({ ...quotation, user_id: userId })
        .select()
        .single();

      if (quotationError) return { data: null, error: quotationError };

      const itemsWithQuotationId = items.map(item => ({
        ...item,
        quotation_id: quotationData.id
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsWithQuotationId);

      return { data: quotationData, error: itemsError };
    },
    update: async (id: string, quotation: Partial<Quotation>, items?: Omit<QuotationItem, 'id' | 'quotation_id'>[]) => {
      if (isMock) {
        await delay(300);
        const quotations = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATIONS) || '[]');
        const index = quotations.findIndex((q: Quotation) => q.id === id);
        
        if (index !== -1) {
          quotations[index] = { ...quotations[index], ...quotation };
          localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
          
          if (items) {
             const quotationItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTATION_ITEMS) || '[]');
             const newQuotationItems = quotationItems.filter((i: QuotationItem) => i.quotation_id !== id);
             
             const newItemsWithId = items.map(item => ({
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                quotation_id: id,
             }));
             
             newQuotationItems.push(...newItemsWithId);
             localStorage.setItem(STORAGE_KEYS.QUOTATION_ITEMS, JSON.stringify(newQuotationItems));
          }
        }
        return { error: null };
      }
      
      const { error: quotationError } = await supabase
        .from('quotations')
        .update(quotation)
        .eq('id', id);

      if (quotationError) return { error: quotationError };

      if (items) {
        await supabase.from('quotation_items').delete().eq('quotation_id', id);
        
        const itemsWithId = items.map(item => ({
          ...item,
          quotation_id: id
        }));
        
        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(itemsWithId);
          
        return { error: itemsError };
      }

      return { error: null };
    }
  },
  purchase_orders: {
    list: async () => {
      if (isMock) {
        await delay(300);
        const pos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]');
        const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
        return pos.map((po: PurchaseOrder) => ({
          ...po,
          customer: customers.find((c: Customer) => c.id === po.vendor_id)
        })).sort((a: PurchaseOrder, b: PurchaseOrder) => {
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
          const at = a.created_at ? new Date(a.created_at).getTime() : 0;
          return bt - at;
        });
      }
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, vendor:customers(*)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    delete: async (id: string) => {
      if (isMock) {
        await delay(300);
        let pos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]');
        pos = pos.filter((p: PurchaseOrder) => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
        return { error: null };
      }
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      return { error };
    },
    getItems: async (poId: string) => {
      if (isMock) {
        await delay(300);
        const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.PO_ITEMS) || '[]');
        return items.filter((i: PurchaseOrderItem) => i.po_id === poId);
      }
      const { data, error } = await supabase.from('purchase_order_items').select('*').eq('po_id', poId);
      if (error) throw error;
      return data || [];
    },
    create: async (po: PurchaseOrder, items: PurchaseOrderItem[]) => {
      if (isMock) {
        await delay(500);
        const pos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]');
        const poItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.PO_ITEMS) || '[]');
        
        const newPO = {
          ...po,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
        };
        pos.push(newPO);
        
        const newItems = items.map(item => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          po_id: newPO.id,
        }));
        poItems.push(...newItems);
        
        localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
        localStorage.setItem(STORAGE_KEYS.PO_ITEMS, JSON.stringify(poItems));
        
        return { data: newPO, error: null };
      }

      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert({ ...po, user_id: userId })
        .select()
        .single();

      if (poError) return { data: null, error: poError };

      const itemsWithPOId = items.map(item => ({
        ...item,
        po_id: poData.id
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsWithPOId);

      return { data: poData, error: itemsError };
    },

    update: async (id: string, po: Partial<PurchaseOrder>, items?: PurchaseOrderItem[]) => {
      if (isMock) {
        await delay(300);
        const pos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]');
        const index = pos.findIndex((p: PurchaseOrder) => p.id === id);
        
        if (index !== -1) {
          // Prevent update if already completed to avoid stock mess
          if (pos[index].status === 'completed') {
             return { error: 'Cannot edit a received purchase order' };
          }

          pos[index] = { ...pos[index], ...po };
          localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));
          
          if (items) {
             const poItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.PO_ITEMS) || '[]');
             const newPoItems = poItems.filter((i: PurchaseOrderItem) => i.po_id !== id);
             
             const newItemsWithId = items.map(item => ({
                ...item,
                id: Math.random().toString(36).substr(2, 9),
                po_id: id,
             }));
             
             newPoItems.push(...newItemsWithId);
             localStorage.setItem(STORAGE_KEYS.PO_ITEMS, JSON.stringify(newPoItems));
          }
        }
        return { error: null };
      }
      
      // Check status first
      const { data: currentPO } = await supabase.from('purchase_orders').select('status').eq('id', id).single();
      if (currentPO?.status === 'completed') {
        return { error: 'Cannot edit a received purchase order' };
      }

      const { error: poError } = await supabase
        .from('purchase_orders')
        .update(po)
        .eq('id', id);

      if (poError) return { error: poError };

      if (items) {
        await supabase.from('purchase_order_items').delete().eq('po_id', id);
        
        const itemsWithId = items.map(item => ({
          ...item,
          po_id: id
        }));
        
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsWithId);
          
        return { error: itemsError };
      }

      return { error: null };
    },

    updateStatus: async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
      if (isMock) {
        await delay(300);
        const pos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS) || '[]');
        const index = pos.findIndex((p: PurchaseOrder) => p.id === id);
        if (index !== -1) {
          const oldStatus = pos[index].status;
          pos[index].status = status;
          localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(pos));

          // If status changed to completed, add stock
          if (oldStatus !== 'completed' && status === 'completed') {
             const poItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.PO_ITEMS) || '[]');
             const items = poItems.filter((i: PurchaseOrderItem) => i.po_id === id);
             const dbItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
             
             items.forEach((poItem: PurchaseOrderItem) => {
               const itemIndex = dbItems.findIndex((i: Item) => i.name === poItem.item_name);
               if (itemIndex !== -1) {
                 dbItems[itemIndex].stock = (dbItems[itemIndex].stock || 0) + poItem.quantity;
               }
             });
             localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(dbItems));
          }
          // If status changed FROM completed to something else, revert stock
          else if (oldStatus === 'completed' && status !== 'completed') {
             const poItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.PO_ITEMS) || '[]');
             const items = poItems.filter((i: PurchaseOrderItem) => i.po_id === id);
             const dbItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
             
             items.forEach((poItem: PurchaseOrderItem) => {
               const itemIndex = dbItems.findIndex((i: Item) => i.name === poItem.item_name);
               if (itemIndex !== -1) {
                 dbItems[itemIndex].stock = (dbItems[itemIndex].stock || 0) - poItem.quantity;
               }
             });
             localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(dbItems));
          }
        }
        return { error: null };
      }
      
      // Get current status first for Supabase logic
      const { data: currentPO } = await supabase.from('purchase_orders').select('status').eq('id', id).single();
      const oldStatus = currentPO?.status;

      const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
      
      if (!error) {
        if (oldStatus !== 'completed' && status === 'completed') {
           // Add stock logic for Supabase
           const userId = await getCurrentUserId();
           const { data: items } = await supabase.from('purchase_order_items').select('*').eq('po_id', id);
           if (items && userId) {
             for (const item of items) {
               const { data: product } = await supabase.from('items').select('id, stock').eq('name', item.item_name).eq('user_id', userId).single();
               if (product) {
                 await supabase.from('items').update({ stock: (product.stock || 0) + item.quantity }).eq('id', product.id);
               }
             }
           }
        }
        else if (oldStatus === 'completed' && status !== 'completed') {
           // Revert stock logic for Supabase
           const userId = await getCurrentUserId();
           const { data: items } = await supabase.from('purchase_order_items').select('*').eq('po_id', id);
           if (items && userId) {
             for (const item of items) {
               const { data: product } = await supabase.from('items').select('id, stock').eq('name', item.item_name).eq('user_id', userId).single();
               if (product) {
                 await supabase.from('items').update({ stock: (product.stock || 0) - item.quantity }).eq('id', product.id);
               }
             }
           }
        }
      }

      return { error };
    }
  }
};
