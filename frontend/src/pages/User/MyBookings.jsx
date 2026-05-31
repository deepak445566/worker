import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

const MyBookings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [myBookings, setMyBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const [showChartModal, setShowChartModal] = useState(false);

  // Fetch user's bookings
  const fetchMyBookings = async () => {
    setLoading(true);
    try {
   
      
      const response = await axios.get('https://worker-ibbp.onrender.com/api/bookings/my-bookings', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setMyBookings(response.data.bookings || []);
        setBookingStats(response.data.stats || {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          completed: 0,
          totalSpent: 0
        });
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setMyBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Filter bookings based on status
  const getFilteredBookings = () => {
    if (filter === 'all') return myBookings;
    return myBookings.filter(booking => booking.bookingStatus === filter);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      rejected: '❌',
      completed: '🎉',
      cancelled: '🚫'
    };
    return icons[status] || '📋';
  };

  const getLocationString = (location) => {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      if (location.address) return location.address;
      if (location.lat && location.lng) return `${location.lat}, ${location.lng}`;
      return JSON.stringify(location);
    }
    return 'Not specified';
  };

  // Chart data
  const statusChartData = bookingStats ? [
    { name: 'Pending', value: bookingStats.pending, color: '#EAB308' },
    { name: 'Accepted', value: bookingStats.accepted, color: '#22C55E' },
    { name: 'Completed', value: bookingStats.completed, color: '#3B82F6' },
    { name: 'Rejected', value: bookingStats.rejected, color: '#EF4444' },
    { name: 'Cancelled', value: bookingStats.cancelled || 0, color: '#6B7280' }
  ] : [];

  // Monthly booking data
  const getMonthlyData = () => {
    const months = {};
    myBookings.forEach(booking => {
      const date = new Date(booking.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!months[month]) {
        months[month] = { month, bookings: 0, amount: 0 };
      }
      months[month].bookings++;
      months[month].amount += booking.totalAmount;
    });
    return Object.values(months).slice(-6);
  };

  const monthlyData = getMonthlyData();

 

  const filteredBookings = getFilteredBookings();

  const COLORS = ['#EAB308', '#22C55E', '#3B82F6', '#EF4444', '#6B7280'];

  return (
    <div className="min-h-screen bg-white">
    

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-blue-100">View and manage all your service bookings in one place</p>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Pie Chart */}
          <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Booking Status Distribution</h2>
              <button 
                onClick={() => setShowChartModal(true)}
                className="text-blue-600 text-sm hover:text-blue-700"
              >
                View Full Stats →
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Bookings Area Chart */}
          {monthlyData.length > 0 && (
            <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-black mb-4">Monthly Booking Trends</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="bookings" stroke="#3B82F6" fill="#93C5FD" name="Number of Bookings" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {bookingStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white shadow-lg rounded-2xl p-4 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-black">{bookingStats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">↑ 12% from last month</p>
            </div>
            <div className="bg-white shadow-lg rounded-2xl p-4 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-2xl p-4 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{bookingStats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-2xl p-4 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-600">₹{bookingStats.totalSpent}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white shadow-lg rounded-2xl mb-6 border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap gap-2 px-6 py-2">
              {['all', 'pending', 'accepted', 'completed', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    filter === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status}
                  {status !== 'all' && bookingStats && (
                    <span className={`ml-2 text-xs ${filter === status ? 'text-white' : 'text-gray-400'}`}>
                      ({bookingStats[status] || 0})
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-black">
              {filter === 'all' ? 'All Bookings' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings`}
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-3 text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 text-lg">No {filter !== 'all' ? filter : ''} bookings found</p>
              {filter === 'all' && (
                <button
                  onClick={() => navigate('/user/services')}
                  className="mt-4 px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Book a Service →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {booking.service === 'Plumber' && '🔧'}
                              {booking.service === 'Electrician' && '⚡'}
                              {booking.service === 'Carpenter' && '🪚'}
                              {booking.service === 'Painter' && '🎨'}
                              {booking.service === 'Cleaner' && '🧹'}
                              {booking.service === 'Mechanic' && '🔩'}
                              {booking.service === 'Gardener' && '🌿'}
                              {booking.service === 'AC Repair' && '❄️'}
                              {!['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Cleaner', 'Mechanic', 'Gardener', 'AC Repair'].includes(booking.service) && '🔧'}
                            </span>
                            <h3 className="font-bold text-xl text-black">
                              {booking.service}
                            </h3>
                          </div>
                          {booking.worker && (
                            <p className="text-sm text-gray-600 mt-1">
                              👨‍🔧 Service Provider: {booking.worker.name || 'N/A'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getStatusIcon(booking.bookingStatus)}</span>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(booking.bookingStatus)}`}>
                            {getStatusText(booking.bookingStatus)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>⏰ {booking.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <svg className="h-4 w-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{getLocationString(booking.location)}</span>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg p-2">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>₹{booking.totalAmount}</span>
                        </div>
                      </div>

                      {booking.workerAmount && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">💰 Worker Earnings (90%):</span>
                            <span className="font-semibold text-green-600">₹{booking.workerAmount}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-600">🏢 Admin Fee (10%):</span>
                            <span className="text-gray-500">₹{booking.adminCommission}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black">Booking Statistics</h2>
                <button
                  onClick={() => setShowChartModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3B82F6" name="Number of Bookings" radius={[8, 8, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statusChartData.map((item, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS[index] }}></div>
                    <p className="text-sm font-semibold text-black">{item.name}</p>
                    <p className="text-xl font-bold" style={{ color: COLORS[index] }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;