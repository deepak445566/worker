import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const WorkersList = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState('pie');
  const [stats, setStats] = useState({
    totalWorkers: 0,
    availableWorkers: 0,
    totalEarnings: 0,
    totalJobs: 0
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
  
      const response = await axios.get(
        'https://worker-ibbp.onrender.com/api/admin/workers',
        {withCredentials:true}
      );
      setWorkers(response.data.workers);
      calculateStats(response.data.workers);
    } catch (error) {
      toast.error('Failed to fetch workers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workersList) => {
    const available = workersList.filter(w => w.workerInfo?.isAvailable).length;
    const totalEarnings = workersList.reduce((sum, w) => sum + (w.workerInfo?.stats?.totalEarnings || 0), 0);
    const totalJobs = workersList.reduce((sum, w) => sum + (w.workerInfo?.stats?.totalJobs || 0), 0);
    
    setStats({
      totalWorkers: workersList.length,
      availableWorkers: available,
      totalEarnings: totalEarnings,
      totalJobs: totalJobs
    });
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.workerInfo?.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.phone?.includes(searchTerm)
  );

  const getServiceDistribution = () => {
    const serviceCount = {};
    workers.forEach(worker => {
      const service = worker.workerInfo?.service || 'Unknown';
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });
    return Object.entries(serviceCount).map(([name, value]) => ({ name, value }));
  };

  const serviceData = getServiceDistribution();
  const COLORS = [
  '#6366F1', // Indigo
  '#22C55E', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#8B5CF6'  // Purple
];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-black">{label}</p>
          <p className="text-xs text-gray-600 mt-1">
            Workers: <span className="font-bold text-black">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const ViewDetailsModal = ({ worker, onClose }) => {
    if (!worker) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-5 rounded-t-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {worker.name?.charAt(0) || 'W'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">Worker Details</h3>
                  <p className="text-sm text-gray-500">{worker.email}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-black transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-lg text-black mb-4 flex items-center gap-2">
                <span className="text-xl">👤</span> Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="font-semibold text-black">{worker.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="font-semibold text-black break-all">{worker.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="font-semibold text-black">{worker.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Member Since</p>
                  <p className="font-semibold text-black">{new Date(worker.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Service Information */}
            {worker.workerInfo && (
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-lg text-black mb-4 flex items-center gap-2">
                  <span className="text-xl">🔧</span> Service Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Service Type</p>
                    <p className="font-semibold text-black">{worker.workerInfo.service || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hourly Rate</p>
                    <p className="font-bold text-2xl text-black">₹{worker.workerInfo.price || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Experience</p>
                    <p className="font-semibold text-black">{worker.workerInfo.experience || 0} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      worker.workerInfo.isAvailable 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {worker.workerInfo.isAvailable ? '● Available' : '● Unavailable'}
                    </span>
                  </div>
                  {worker.workerInfo.rating && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rating</p>
                      <p className="font-semibold flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        {worker.workerInfo.rating} / 5
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Work Statistics */}
            {worker.workerInfo?.stats && (
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-lg text-black mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span> Work Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{worker.workerInfo.stats.totalJobs}</p>
                    <p className="text-xs text-gray-500">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{worker.workerInfo.stats.completedJobs}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{worker.workerInfo.stats.currentBookings}</p>
                    <p className="text-xs text-gray-500">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">₹{worker.workerInfo.stats.totalEarnings}</p>
                    <p className="text-xs text-gray-500">Earnings</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workers data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Workers</p>
              <p className="text-3xl font-bold text-black">{stats.totalWorkers}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Available Workers</p>
              <p className="text-3xl font-bold text-black">{stats.availableWorkers}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Jobs</p>
              <p className="text-3xl font-bold text-black">{stats.totalJobs}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-black truncate">₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Distribution Chart */}
      {serviceData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-black">Service Distribution</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedChart('pie')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChart === 'pie' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pie Chart
              </button>
              <button
                onClick={() => setSelectedChart('bar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChart === 'bar' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bar Chart
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'pie' ? (
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={serviceData}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#000000" name="Workers" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Workers List Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-black">Workers Management</h2>
              <p className="text-sm text-gray-500 mt-1">Manage and monitor all registered workers</p>
            </div>
            <div className="bg-gray-100 rounded-full px-4 py-2">
              <span className="text-sm font-semibold text-black">
                {filteredWorkers.length} / {workers.length} Workers
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search workers by name, email or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-100 transition-all text-black placeholder-gray-400"
              />
            </div>
          </div>

          {/* Workers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <div key={worker._id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Header */}
                <div className="bg-black p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-black font-bold text-2xl">
                        {worker.name?.charAt(0) || 'W'}
                      </span>
                    </div>
                    <div className="flex-1 text-white">
                      <h3 className="font-bold text-base truncate">{worker.name}</h3>
                      <p className="text-xs opacity-80 truncate">{worker.email}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  {worker.workerInfo && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Service</span>
                        <span className="font-semibold text-black bg-gray-100 px-2 py-1 rounded-lg text-xs">
                          {worker.workerInfo.service || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Hourly Rate</span>
                        <span className="font-bold text-xl text-black">₹{worker.workerInfo.price || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Rating</span>
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-black">{worker.workerInfo.rating || 0}/5</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Status</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          worker.workerInfo.isAvailable 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {worker.workerInfo.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      
                      {/* Stats Preview */}
                      {worker.workerInfo.stats && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Jobs</p>
                              <p className="font-bold text-black text-base">{worker.workerInfo.stats.totalJobs}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Earnings</p>
                              <p className="font-bold text-black text-sm truncate">₹{worker.workerInfo.stats.totalEarnings}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowModal(true);
                        }}
                        className="mt-4 w-full bg-black text-white py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-300 text-sm font-semibold flex items-center justify-center gap-2 group"
                      >
                        <span>View Details</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredWorkers.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">No workers found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <ViewDetailsModal 
          worker={selectedWorker} 
          onClose={() => {
            setShowModal(false);
            setSelectedWorker(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkersList;