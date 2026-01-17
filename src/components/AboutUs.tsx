import { Users, Target, Shield } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64 bg-blue-600">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 opacity-90"></div>
          <div className="relative h-full flex items-center justify-center text-center px-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">About Us</h1>
              <p className="text-blue-100 text-xl max-w-2xl">
                Empowering businesses with modern solutions for efficient management and growth.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
              <p className="text-gray-600">
                To simplify business operations through intuitive and powerful software solutions.
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Team</h3>
              <p className="text-gray-600">
                A dedicated team of experts passionate about delivering excellence and innovation.
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Values</h3>
              <p className="text-gray-600">
                Integrity, customer focus, and continuous improvement drive everything we do.
              </p>
            </div>
          </div>

          <div className="prose max-w-none text-gray-600">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h3>
            <p className="mb-4">
              Founded in 2024, we recognized the need for a comprehensive business management tool that could adapt to the needs of modern enterprises. Starting with a simple invoice generator, we've grown into a full-suite platform serving thousands of customers worldwide.
            </p>
            <p>
              We believe that software should be an enabler, not a hurdle. That's why we focus relentlessly on user experience and reliability, ensuring that you can focus on what matters most - growing your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
