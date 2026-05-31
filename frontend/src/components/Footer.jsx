import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-gray-800">
          
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🔧</span>
              <span className="font-bold text-xl">ServiceHub</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Your trusted partner for all professional service needs. 
              We connect you with verified and experienced professionals.
            </p>
            <div className="flex space-x-3">
              <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">✓ 100% Secure</span>
              <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">✓ Verified Pros</span>
              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded">✓ Best Price</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/user/services" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-blue-400">→</span> Find Services
                </Link>
              </li>
              <li>
                <Link to="/user/my-bookings" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-blue-400">→</span> My Bookings
                </Link>
              </li>
              <li>
                <Link to="/user/profile" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-blue-400">→</span> My Profile
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-blue-400">→</span> About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-blue-400">→</span> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Our Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/user/services?category=plumber" className="text-gray-400 hover:text-white transition-colors">
                  🔧 Plumber
                </Link>
              </li>
              <li>
                <Link to="/user/services?category=electrician" className="text-gray-400 hover:text-white transition-colors">
                  ⚡ Electrician
                </Link>
              </li>
              <li>
                <Link to="/user/services?category=carpenter" className="text-gray-400 hover:text-white transition-colors">
                  🪚 Carpenter
                </Link>
              </li>
              <li>
                <Link to="/user/services?category=cleaner" className="text-gray-400 hover:text-white transition-colors">
                  🧹 Cleaner
                </Link>
              </li>
              <li>
                <Link to="/user/services?category=ac repair" className="text-gray-400 hover:text-white transition-colors">
                  ❄️ AC Repair
                </Link>
              </li>
              <li>
                <Link to="/user/services?category=painter" className="text-gray-400 hover:text-white transition-colors">
                  🎨 Painter
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Get In Touch</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li className="flex items-center gap-3 text-gray-400">
                <span>📍</span>
                <span>123 Service Street, Tech City</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <span>📞</span>
                <a href="tel:+1234567890" className="hover:text-white">+1 (234) 567-890</a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <span>✉️</span>
                <a href="mailto:support@servicehub.com" className="hover:text-white">support@servicehub.com</a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <span>⏰</span>
                <span>24/7 Customer Support</span>
              </li>
            </ul>
            
            {/* Social Links */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-xl">📘</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <span className="text-xl">📷</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                  <span className="text-xl">🐦</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <span className="text-xl">💼</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-b border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h3>
              <p className="text-gray-400 text-sm">
                Get latest updates, new services, and special offers delivered to your inbox.
              </p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Payment Methods */}
            <div className="flex space-x-3">
              <span className="text-2xl" title="Visa">💳</span>
              <span className="text-2xl" title="Mastercard">💳</span>
              <span className="text-2xl" title="PayPal">💰</span>
              <span className="text-2xl" title="Secure Payment">🔒</span>
            </div>

            {/* Copyright */}
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; {currentYear} ServiceHub. All rights reserved. | Made with ❤️ for you</p>
            </div>

            {/* Legal Links */}
            <div className="flex space-x-4 text-xs">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/refund" className="text-gray-400 hover:text-white transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;