// components/CommissionReport.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

const CommissionReport = () => {
  const [data, setData] = useState({
    totalBookings: 0,
    totalCommission: 0,
    bookings: []
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChart, setSelectedChart] = useState('bar');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
  
      const response = await axios.get(
        'https://worker-ibbp.onrender.com/api/admin/commissions',
        {withCredentials:true}
      );
      setData(response.data);
      processChartData(response.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch commission data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (bookings) => {
    const monthlyData = {};
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, commission: 0, count: 0 };
      }
      monthlyData[month].commission += booking.adminCommission || 0;
      monthlyData[month].count++;
    });
    setChartData(Object.values(monthlyData).slice(-6));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredBookings = data.bookings.filter(booking => {
    if (searchTerm) {
      return booking._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (booking.serviceType && booking.serviceType.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true;
  });

  const filteredStats = {
    count: filteredBookings.length,
    commission: filteredBookings.reduce((sum, b) => sum + (b.adminCommission || 0), 0)
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-black">{label}</p>
          <p className="text-xs text-gray-600 mt-1">
            Commission: <span className="font-bold text-black">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading commission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - Premium Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-black">{data.totalBookings}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">All time bookings</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Commission</p>
              <p className="text-2xl font-bold text-black">{formatCurrency(data.totalCommission)}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Platform earnings (10%)</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Avg Commission</p>
              <p className="text-2xl font-bold text-black">
                {formatCurrency(data.totalBookings > 0 ? data.totalCommission / data.totalBookings : 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Per booking average</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Filtered Results</p>
              <p className="text-3xl font-bold text-black">{filteredStats.count}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Commission: {formatCurrency(filteredStats.commission)}</p>
        </div>
      </div>

      {/* Chart Section - Premium Design */}
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-black">Commission Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Monthly commission breakdown</p>
            </div>
            <div className="flex gap-2">
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
              <button
                onClick={() => setSelectedChart('line')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChart === 'line' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Line Chart
              </button>
              <button
                onClick={() => setSelectedChart('area')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChart === 'area' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Area Chart
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {selectedChart === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="commission" fill="#000000" name="Commission (₹)" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : selectedChart === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="commission" stroke="#000000" strokeWidth={3} name="Commission (₹)" dot={{ fill: '#000000', r: 6 }} />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="commission" stroke="#000000" fill="#000000" fillOpacity={0.1} name="Commission (₹)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search and Filter Bar - Premium Design */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Booking ID or Service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-2 focus:ring-gray-100 transition-all text-black placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'week' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'month' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table - Premium Design */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold text-black">Commission Details</h3>
              <p className="text-sm text-gray-500 mt-1">Track all platform commissions from bookings</p>
            </div>
            <div className="bg-gray-100 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-black">
                {filteredBookings.length} records
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Commission (10%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((booking, index) => (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition">
                        <span className="text-xs font-bold text-black">#</span>
                      </div>
                      <span className="text-sm font-mono text-black font-medium">
                        {booking._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">{formatDate(booking.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 text-black rounded-lg text-xs font-medium">
                      {booking.serviceType || booking.service || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{booking.userId?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">{booking.workerId?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-black">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm font-bold text-black">
                        {formatCurrency(booking.adminCommission)}
                      </span>
                      <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg">No commission records found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter</p>
          </div>
        )}

        {/* Footer Summary - Premium Design */}
        {filteredBookings.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-500">Showing {filteredBookings.length} of {data.bookings.length} records</p>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Total Commission</p>
                  <p className="text-xl font-bold text-black">{formatCurrency(filteredStats.commission)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Average per Booking</p>
                  <p className="text-xl font-bold text-black">
                    {formatCurrency(filteredStats.count > 0 ? filteredStats.commission / filteredStats.count : 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionReport;