import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Customer = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
};

export type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  min_stock?: number;
  created_at: string;
};

export type InvoiceItem = {
  id?: string;
  invoice_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total: number;
};

export type Invoice = {
  id?: string;
  invoice_number: string;
  customer_id: string;
  date: string;
  due_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  created_at?: string;
};

export type QuotationItem = {
  id?: string;
  quotation_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total: number;
};

export type Quotation = {
  id?: string;
  quotation_number: string;
  customer_id: string;
  date: string;
  valid_until: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  payment_terms: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at?: string;
};

export type PurchaseOrderItem = {
  id?: string;
  po_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type PurchaseOrder = {
  id?: string;
  po_number: string;
  vendor_id: string; // reusing customer_id for simplicity or we can add vendors table
  date: string;
  expected_delivery: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
};
