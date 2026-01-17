# Invoice & Quotation Management System

Sistem sederhana untuk mengelola invoice dan quotation untuk UMKM.

## Fitur Utama

- **Invoice Management**: Buat dan kelola invoice dengan detail item, pajak, dan diskon
- **Quotation Management**: Buat penawaran harga dengan syarat pembayaran
- **Customer Management**: Kelola data pelanggan
- **Item Management**: Master data produk/jasa dengan harga default
- **Multi-currency Support**: Siap untuk pengembangan multi mata uang
- **Professional Design**: UI yang bersih dan mudah digunakan

## Teknologi

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Database sudah dikonfigurasi dengan tabel-tabel berikut:
- `companies` - Data perusahaan
- `customers` - Data customer
- `items` - Master item/produk
- `invoices` - Header invoice
- `invoice_items` - Detail item invoice
- `quotations` - Header quotation
- `quotation_items` - Detail item quotation

### 3. Environment Variables

Buat file `.env` dengan isi:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Dapatkan credentials dari:
1. Login ke Supabase Dashboard
2. Pilih project Anda
3. Settings > API
4. Copy URL dan anon key

### 4. Run Development Server

```bash
npm run dev
```

Buka browser di `http://localhost:5173`

### 5. Build Production

```bash
npm run build
```

## Struktur Database

### Invoices
- Nomor invoice otomatis (format: INV/YYYYMM/XXXX)
- Link ke customer
- Detail items dengan quantity, harga, diskon, dan pajak
- Perhitungan otomatis subtotal, diskon, pajak, dan total
- Notes untuk informasi tambahan

### Quotations
- Nomor quotation otomatis (format: QUO/YYYYMM/XXXX)
- Link ke customer
- Tanggal berlaku (default 30 hari)
- Detail items
- Syarat pembayaran
- Notes

### Customers
- Nama, alamat, telepon, email
- Dapat digunakan untuk invoice dan quotation

### Items
- Master data produk/jasa
- Nama, deskripsi, harga default

## Cara Penggunaan

### 1. Tambah Customer Dulu
1. Klik menu "Customers"
2. Klik "Add Customer"
3. Isi data customer
4. Klik "Save"

### 2. Tambah Items (Opsional)
1. Klik menu "Items"
2. Klik "Add Item"
3. Isi nama, deskripsi, dan harga default
4. Klik "Save"

### 3. Buat Invoice
1. Klik menu "Invoice"
2. Pilih customer
3. Isi tanggal dan due date
4. Tambah items (klik "Add Item" untuk item baru)
5. Isi detail setiap item: nama, qty, harga, tax rate
6. Total akan dihitung otomatis
7. Klik "Save Invoice"

### 4. Buat Quotation
1. Klik menu "Quotation"
2. Pilih customer
3. Isi tanggal dan valid until
4. Tambah items
5. Isi payment terms (syarat pembayaran)
6. Klik "Save Quotation"

## Pengembangan Selanjutnya

### Fitur yang Bisa Ditambahkan:
1. **PDF Export**: Generate PDF untuk invoice/quotation
2. **Email Integration**: Kirim invoice/quotation via email
3. **Multi-bahasa**: Support Bahasa Indonesia & English
4. **Multi-currency**: Support berbagai mata uang
5. **Payment Tracking**: Track pembayaran invoice
6. **Reports**: Dashboard dan laporan penjualan
7. **Attachment Upload**: Upload file lampiran (DO yang sudah ditandatangani)
8. **Template Customization**: Customize template invoice/quotation per customer
9. **Authentication**: Login system untuk multi-user
10. **Company Profile**: Setting info perusahaan dan logo

### Teknologi untuk Fitur Lanjutan:
- **PDF Generation**: jsPDF atau react-pdf
- **Email**: Resend atau SendGrid
- **Storage**: Supabase Storage untuk attachments
- **Charts**: Recharts atau Chart.js untuk reports
- **i18n**: react-i18next untuk multi-bahasa

## Notes

- Ini adalah versi MVP (Minimum Viable Product)
- Database menggunakan RLS policy yang permissive untuk testing
- Untuk production, perlu tambah authentication dan proper RLS policies
- Total perhitungan: (Qty × Price - Discount) × (1 + Tax Rate/100)

## License

MIT
