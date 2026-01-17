import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: '',
    address: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    logoUrl: '',
    terms: '',
    showWatermark: true,
    watermarkText: '',
    watermarkOpacity: 0.05,
    showTerms: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('company_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('company_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Company Settings</h2>
        <p className="text-gray-600 mb-8">
          These details will appear on your Invoices, Quotations, and Purchase Orders.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              name="logoUrl"
              value={settings.logoUrl}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="https://example.com/logo.png"
            />
            {settings.logoUrl && (
              <div className="mt-3">
                <img src={settings.logoUrl} alt="Logo Preview" className="h-16 object-contain border rounded p-2 bg-white" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={settings.address}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="Street Address"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / State / Zip</label>
              <input
                type="text"
                name="city"
                value={settings.city}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="City, State, Zip"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={settings.country}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Country"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              name="terms"
              value={settings.terms}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="Payment, delivery, warranty, and other terms"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Watermark</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showWatermark"
                  checked={settings.showWatermark}
                  onChange={(e) => setSettings(prev => ({ ...prev, showWatermark: e.target.checked }))}
                />
                <label htmlFor="showWatermark" className="text-sm text-gray-700">Show watermark on documents</label>
              </div>
              <input
                type="text"
                name="watermarkText"
                value={settings.watermarkText}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Watermark text (optional, defaults to company name)"
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Watermark Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={0.2}
                  step={0.01}
                  value={settings.watermarkOpacity}
                  onChange={(e) => setSettings(prev => ({ ...prev, watermarkOpacity: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-xs text-gray-600 mt-1">{(settings.watermarkOpacity * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Terms Visibility</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showTerms"
                  checked={settings.showTerms}
                  onChange={(e) => setSettings(prev => ({ ...prev, showTerms: e.target.checked }))}
                />
                <label htmlFor="showTerms" className="text-sm text-gray-700">Show Terms & Conditions block</label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
            
            {saved && (
              <span className="text-green-600 font-medium">Settings saved successfully!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
