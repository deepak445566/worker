import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import BookingPage from './BookingPage';

const Services = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [showBookingPage, setShowBookingPage] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWorkersList, setShowWorkersList] = useState(false);

  const services = [
    { name: 'Plumber', icon: '🔧', description: 'Pipe installation & repair', workers: 12 },
    { name: 'Electrician', icon: '⚡', description: 'Wiring & electrical work', workers: 8 },
    { name: 'Carpenter', icon: '🪚', description: 'Furniture & woodwork', workers: 6 },
    { name: 'Painter', icon: '🎨', description: 'Wall painting & finishes', workers: 10 },
    { name: 'Cleaner', icon: '🧹', description: 'Home & office cleaning', workers: 15 },
    { name: 'Mechanic', icon: '🔧', description: 'Repair & maintenance', workers: 7 },
    { name: 'Gardener', icon: '🌱', description: 'Garden care & landscaping', workers: 5 },
    { name: 'AC Repair', icon: '❄️', description: 'AC service & repair', workers: 9 },
    { name: 'Appliance Repair', icon: '🔌', description: 'Home appliance repair', workers: 11 },
    { name: 'Home Cleaning', icon: '🧹', description: 'Complete home cleaning', workers: 14 },
    { name: 'Deep Cleaning', icon: '🧼', description: 'Deep cleaning service', workers: 8 },
    { name: 'Sofa Cleaning', icon: '🛋️', description: 'Sofa & upholstery cleaning', workers: 6 },
    { name: 'Bathroom Cleaning', icon: '🚿', description: 'Bathroom deep cleaning', workers: 7 },
    { name: 'Kitchen Cleaning', icon: '🍳', description: 'Kitchen cleaning service', workers: 9 },
    { name: 'AC Installation', icon: '🌬️', description: 'AC installation service', workers: 5 },
    { name: 'Refrigerator Repair', icon: '🧊', description: 'Fridge repair service', workers: 4 },
    { name: 'Washing Machine Repair', icon: '🧺', description: 'Washing machine repair', workers: 6 },
    { name: 'RO Repair', icon: '💧', description: 'RO water purifier repair', workers: 4 },
    { name: 'Salon at Home', icon: '💇‍♀️', description: 'Salon services at home', workers: 20 },
    { name: 'Cook', icon: '👨‍🍳', description: 'Professional cooks', workers: 12 },
    { name: 'House Maid', icon: '🧺', description: 'Household help', workers: 25 }
  ];

  const fetchWorkersByService = async (service) => {
    setLoading(true);
    setError('');
    setSelectedService(service);
    setShowWorkersList(true);
    
    try {
    
      const url = `https://worker-ibbp.onrender.com/api/services/?service=${service}`;
      
    const response = await axios.get(url, {
  withCredentials: true
});
      
      if (response.data.success) {
        setWorkers(response.data.workers);
        if (response.data.workers.length === 0) {
          setError(`No workers available for ${service} service at the moment.`);
        }
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(err.response?.data?.message || 'Failed to fetch workers');
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToServices = () => {
    setShowWorkersList(false);
    setSelectedService('');
    setWorkers([]);
    setError('');
  };

  const openBookingModal = (worker) => {
    setSelectedWorker(worker);
    setShowBookingPage(true);
  };

  const closeBookingModal = () => {
    setShowBookingPage(false);
    setSelectedWorker(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show Services Grid or Workers List */}
        {!showWorkersList ? (
          // Services Grid View - Premium Design
          <div>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
                <span className="text-3xl">🔧</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
                Our Professional Services
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Choose from a wide range of professional services delivered right to your doorstep
              </p>
              <div className="flex justify-center mt-4">
                <div className="w-20 h-0.5 bg-black rounded-full"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <div
                  key={index}
                  onClick={() => fetchWorkersByService(service.name)}
                  className="group cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                        {service.icon}
                      </span>
                      <div className="bg-gray-100 rounded-full px-2 py-1">
                        <span className="text-xs font-medium text-gray-600">
                          {service.workers}+ Experts
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-xl text-black mb-2">
                      {service.name}
                    </h3>
                    
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">(4.8)</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-400">Starting from</span>
                        <p className="text-lg font-bold text-black">₹499<small className="text-xs font-normal text-gray-400">/hr</small></p>
                      </div>
                      
                      <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition flex items-center gap-2">
                        <span>Book Now</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Workers List View - Premium Design
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleBackToServices}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Services
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">{services.find(s => s.name === selectedService)?.icon || '🔧'}</span>
                </div>
                <h2 className="text-xl font-bold text-black">
                  {selectedService} Professionals
                </h2>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {error && (
                <div className="m-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
                  <p className="mt-3 text-gray-500">Loading workers...</p>
                </div>
              ) : workers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-500 text-lg">No workers found for {selectedService}</p>
                  <p className="text-gray-400 text-sm mt-2">Please check back later or try another service</p>
                  <button
                    onClick={handleBackToServices}
                    className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Browse Other Services
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker, idx) => (
                      <div 
                        key={worker._id} 
                        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="p-5">
                          {/* Worker Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative">
                              {worker.userId?.profileImage ? (
                                <img 
                                  src={worker.userId.profileImage} 
                                  alt={worker.userId?.name}
                                  className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                  </svg>
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-black group-hover:text-gray-700 transition">
                                {worker.userId?.name || 'Unknown'}
                              </h3>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm font-semibold text-black">4.8</span>
                                <span className="text-xs text-gray-400">(124 reviews)</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-100 rounded-lg px-2 py-1">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700 text-xs font-medium">Verified</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Worker Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Service</span>
                              <span className="font-medium text-black">{worker.service}</span>
                            </div>
                            
                            {worker.experience && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Experience</span>
                                <span className="font-medium text-black">{worker.experience} years</span>
                              </div>
                            )}
                            
                            {worker.phone && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Contact</span>
                                <span className="font-medium text-black">{worker.phone}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Pricing Section */}
                          {(worker.price || worker.rate) && (
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Hourly Rate</span>
                                <div>
                                  <span className="text-xl font-bold text-black">₹{worker.price || worker.rate}</span>
                                  <span className="text-xs text-gray-400">/hour</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-xs text-gray-500">Platform fee (10%)</span>
                                <span className="text-xs font-medium text-gray-700">+₹{Math.round((worker.price || worker.rate) * 0.1)}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs font-semibold text-black">Total charge</span>
                                <span className="text-sm font-bold text-black">₹{Math.round((worker.price || worker.rate) * 1.1)}</span>
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => openBookingModal(worker)}
                            className="w-full bg-black text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2"
                          >
                            <span>Book Now</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Page Modal */}
      {showBookingPage && selectedWorker && (
        <BookingPage
          worker={selectedWorker}
          onClose={closeBookingModal}
          onSuccess={() => {
            closeBookingModal();
            navigate('/user/my-bookings');
          }}
        />
      )}
    </div>
  );
};

export default Services;