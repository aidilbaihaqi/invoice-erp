import { FileText, FileCheck, Users, Package, ShoppingCart, Info, Phone, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

type Page = 'dashboard' | 'invoices' | 'quotations' | 'po' | 'customers' | 'items' | 'about' | 'contact' | 'settings';

type NavbarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
};

export default function Navbar({ currentPage, onNavigate, onLogout }: NavbarProps) {
  const navItems: { id: Page; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'quotations', label: 'Quotations', icon: FileCheck },
    { id: 'po', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'contact', label: 'Contact Us', icon: Phone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Business Suite</h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
