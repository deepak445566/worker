import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const WorkerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State Variables
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [dateFilter, setDateFilter] = useState('thisWeek');
  const [chartReady, setChartReady] = useState(false);

  const autoRejectTimerRef = useRef(null);
  const audioRef = useRef(null);
  const chartContainerRef = useRef(null);

  // ========== GET TOKEN FROM LOCALSTORAGE ==========
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('✅ Token found in localStorage');
      return token;
    }
    console.log('❌ No token found in localStorage');
    return null;
  }, []);

  // ========== AUDIO SETUP ==========
  const initAudio = useCallback(() => {
    if (audioRef.current) return;
    audioRef.current = new Audio('/song/noti.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.8;
    audioRef.current.addEventListener('error', () => {
      console.log('Audio file not found, using fallback');
      audioRef.current.src = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3';
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(err => console.log('Audio play error:', err));
  }, [soundEnabled]);

  const testSound = useCallback(() => {
    if (!audioRef.current) initAudio();
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => alert('⚠️ Unable to play sound. Please click "Enable Sound" first.'));
  }, [initAudio]);

  const toggleSound = useCallback(async () => {
    if (!soundEnabled) {
      if (!audioRef.current) initAudio();
      try {
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setSoundEnabled(true);
        localStorage.setItem('workerSoundEnabled', 'true');
        alert('🔊 Sound notifications enabled!');
      } catch {
        alert('⚠️ Could not enable sound. Please click "Allow" if browser asks for permission.');
      }
    } else {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setSoundEnabled(false);
      localStorage.removeItem('workerSoundEnabled');
      alert('🔇 Sound notifications disabled');
    }
  }, [soundEnabled, initAudio]);

  useEffect(() => {
    initAudio();
    const savedSound = localStorage.getItem('workerSoundEnabled');
    if (savedSound === 'true') {
      setSoundEnabled(true);
    }
  }, [initAudio]);

  // ========== CHART SETUP ==========
  useEffect(() => {
    const checkChartContainer = () => {
      if (chartContainerRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setChartReady(true);
        }
      }
    };
    
    checkChartContainer();
    window.addEventListener('resize', checkChartContainer);
    setTimeout(checkChartContainer, 100);
    
    return () => window.removeEventListener('resize', checkChartContainer);
  }, []);

  // ========== BOOKING API CALLS ==========
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.get(
        'https://worker-ibbp.onrender.com/api/bookings/worker/my-bookings',
        { 
          withCredentials: true,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      if (response.data.success) {
        setBookings(response.data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, getAuthToken]);

  const updateBookingStatus = useCallback(async (bookingId, action) => {
    if (!bookingId) return;
    clearTimeout(autoRejectTimerRef.current);
    setActionLoading(bookingId);
    try {
      const token = getAuthToken();
      await axios.put(
        `https://worker-ibbp.onrender.com/api/bookings/${action}/${bookingId}`,
        {},
        { 
          withCredentials: true,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      setNotification(null);
      await fetchBookings();
      if (action === 'accept') {
        alert('✅ Booking accepted successfully!');
      } else {
        alert('❌ Booking rejected');
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setActionLoading(null);
    }
  }, [fetchBookings, getAuthToken]);

  const handleCompleteBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Have you completed this service? Make sure you have collected payment.')) return;
    setActionLoading(bookingId);
    try {
      const token = getAuthToken();
      await axios.put(
        `https://worker-ibbp.onrender.com/api/bookings/booking/${bookingId}/complete`,
        {},
        { 
          withCredentials: true,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      await fetchBookings();
      alert('✅ Booking marked as complete!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setActionLoading(null);
    }
  }, [fetchBookings, getAuthToken]);

  const openInMaps = useCallback((location) => {
    if (!location || location === 'Address not specified') {
      alert('No location available for this booking');
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  }, []);

  const closeNotification = useCallback(() => {
    clearTimeout(autoRejectTimerRef.current);
    setNotification(null);
  }, []);

  // ========== SOCKET CONNECTION ==========
  useEffect(() => {
    if (!user?._id) {
      console.log('No user ID, skipping socket connection');
      return;
    }

    const token = getAuthToken();
    
    if (!token) {
      console.error('❌ No authentication token found for socket connection');
      console.log('Please logout and login again');
      return;
    }
    
    console.log('🔌 Initializing socket connection with token...');
    
    const newSocket = io('https://worker-ibbp.onrender.com', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      setIsConnected(true);
      setSocketId(newSocket.id);
      newSocket.emit('join', user._id);
      console.log(`📡 Joined room: ${user._id}`);
    });

    newSocket.on('connected', (data) => {
      console.log('📡 Server confirmed connection:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${reason}`);
      setIsConnected(false);
      setSocketId(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      newSocket.emit('join', user._id);
    });

    newSocket.on('reconnecting', (attemptNumber) => {
      console.log(`🔄 Attempting to reconnect... (${attemptNumber})`);
      setIsConnected(false);
    });

    newSocket.on('newBooking', (data) => {
      console.log('🔔 New booking received:', data);
      
      if (soundEnabled) {
        playNotificationSound();
      }

      clearTimeout(autoRejectTimerRef.current);

      setNotification({
        message: data.message,
        booking: data.booking,
        showActions: true
      });

      autoRejectTimerRef.current = setTimeout(() => {
        if (data.booking?._id) {
          updateBookingStatus(data.booking._id, 'reject');
          setNotification(null);
        }
      }, 30000);

      fetchBookings();
    });

    newSocket.on('bookingStatusUpdate', (data) => {
      console.log('📢 Booking status update:', data);
      fetchBookings();
    });

    setSocket(newSocket);

    return () => {
      clearTimeout(autoRejectTimerRef.current);
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?._id, soundEnabled, playNotificationSound, updateBookingStatus, fetchBookings, getAuthToken]);

  // Fetch bookings on mount
  useEffect(() => {
    fetchBookings();
    
    const interval = setInterval(() => {
      if (isConnected) {
        fetchBookings();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchBookings, isConnected]);

  // Timer for notification
  useEffect(() => {
    if (!notification?.showActions) return;
    setTimeLeft(30);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [notification]);

  // ========== STATISTICS ==========
  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.bookingStatus === 'completed');
    const accepted = bookings.filter(b => b.bookingStatus === 'accepted');
    const pending = bookings.filter(b => b.bookingStatus === 'pending');
    const rejected = bookings.filter(b => b.bookingStatus === 'rejected');
    
    return {
      total: bookings.length,
      pending: pending.length,
      accepted: accepted.length,
      completed: completed.length,
      rejected: rejected.length,
      totalEarnings: completed.reduce((sum, b) => sum + (b.workerAmount || 0), 0),
      pendingEarnings: accepted.reduce((sum, b) => sum + (b.workerAmount || 0), 0),
      completionRate: bookings.length > 0 ? ((completed.length / bookings.length) * 100).toFixed(1) : 0,
    };
  }, [bookings]);

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({ day, earnings: 0, bookings: 0 }));
    
    const now = new Date();
    let startDate, endDate;
    
    if (dateFilter === 'thisWeek') {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateFilter === 'lastWeek') {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const filteredBookings = bookings.filter(b => {
      if (b.bookingStatus !== 'completed') return false;
      const bookingDate = new Date(b.date);
      bookingDate.setHours(0, 0, 0, 0);
      if (dateFilter === 'thisMonth') {
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      }
      return bookingDate >= startDate && bookingDate <= endDate;
    });
    
    filteredBookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      let dayIndex = bookingDate.getDay();
      dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      if (data[dayIndex]) {
        data[dayIndex].earnings += booking.workerAmount || 0;
        data[dayIndex].bookings += 1;
      }
    });
    
    return data;
  }, [bookings, dateFilter]);

  const statusData = useMemo(() => [
    { name: 'Completed', value: stats.completed, color: '#10B981' },
    { name: 'Pending', value: stats.pending, color: '#F59E0B' },
    { name: 'Accepted', value: stats.accepted, color: '#3B82F6' },
    { name: 'Rejected', value: stats.rejected, color: '#EF4444' },
  ].filter(item => item.value > 0), [stats]);

  const filteredBookings = useMemo(() => {
    if (filter === 'all') return bookings;
    return bookings.filter(booking => booking.bookingStatus === filter);
  }, [bookings, filter]);

  const getStatusBadge = useCallback((status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return config[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-black">{label}</p>
          <p className="text-xs text-gray-600 mt-1">
            Earnings: <span className="font-bold text-black">₹{payload[0].value}</span>
          </p>
          {payload[0].payload.bookings > 0 && (
            <p className="text-xs text-gray-500">
              Bookings: {payload[0].payload.bookings}
            </p>
          )}
        </div>
      );
    }
    return null;
  }, []);

  const handleLogout = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem('authToken');
    logout();
    navigate('/login');
  }, [socket, logout, navigate]);

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      
      {/* Audio Element */}
      <audio ref={audioRef} preload="auto" />
      
      {/* ========== NEW BOOKING NOTIFICATION POPUP ========== */}
      {notification?.showActions && notification.booking && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-black overflow-hidden">
            <div className="bg-black px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🔔</span>
                  <span className="font-bold text-white">New Booking Request!</span>
                </div>
                <button onClick={closeNotification} className="text-white/80 hover:text-white text-xl font-bold">✕</button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-black">{notification.booking.service}</h3>
                  <p className="text-gray-500 text-sm">👤 Customer</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-black">₹{notification.booking.totalAmount}</p>
                  <p className="text-xs text-gray-400">Total Amount</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-black">
                    {new Date(notification.booking.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-semibold text-black">{notification.booking.time}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-gray-700 truncate">
                      {notification.booking.location || 'Address provided'}
                    </p>
                  </div>
                  <button 
                    onClick={() => openInMaps(notification.booking.location)} 
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
                  >
                    View Map →
                  </button>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Earnings (90%):</span>
                  <span className="font-bold text-black text-lg">₹{notification.booking.workerAmount}</span>
                </div>
              </div>
              
              <div className="text-center mb-3">
                <span className={`text-sm ${timeLeft <= 5 ? 'text-red-500 animate-pulse font-bold' : 'text-gray-500'}`}>
                  ⏱️ Auto-reject in: {timeLeft} seconds
                </span>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => updateBookingStatus(notification.booking._id, 'accept')} 
                  disabled={actionLoading === notification.booking._id}
                  className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition active:scale-95 disabled:opacity-50"
                >
                  ✓ ACCEPT
                </button>
                <button 
                  onClick={() => updateBookingStatus(notification.booking._id, 'reject')} 
                  disabled={actionLoading === notification.booking._id}
                  className="flex-1 py-3 bg-gray-200 text-black rounded-xl font-bold hover:bg-gray-300 transition active:scale-95 disabled:opacity-50"
                >
                  ✗ REJECT
                </button>
              </div>
            </div>
            
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-black transition-all duration-1000" style={{ width: `${(timeLeft / 30) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ========== CONNECTION STATUS BANNER ========== */}
      {!isConnected && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-3 mt-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm text-red-700 flex-1">
              ⚠️ You are offline. New booking notifications may be delayed.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {isConnected && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2 mx-3 mt-3 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-green-700 flex-1">
              ✅ Connected to server • Ready to receive bookings
            </p>
            {socketId && (
              <span className="text-[10px] text-green-600 font-mono">
                ID: {socketId.slice(-6)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========== SOUND STATUS BANNER ========== */}
      {!soundEnabled && (
        <div className="bg-gray-50 border-l-4 border-black p-3 mx-3 mt-3 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">🔔</span>
            <p className="text-xs text-gray-700 flex-1">
              Click <strong>"Test Sound"</strong> first, then <strong>"Enable Sound"</strong> to get audio alerts
            </p>
            <div className="flex gap-2">
              <button onClick={testSound} className="px-3 py-1 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Test</button>
              <button onClick={toggleSound} className="px-3 py-1 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800">Enable</button>
            </div>
          </div>
        </div>
      )}

      {soundEnabled && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2 mx-3 mt-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔊</span>
            <p className="text-xs text-gray-700 flex-1">Sound notifications are <strong>ON</strong></p>
            <button onClick={testSound} className="px-2 py-1 bg-black text-white rounded text-xs">Test</button>
            <button onClick={toggleSound} className="px-2 py-1 bg-gray-200 text-black rounded text-xs">Disable</button>
          </div>
        </div>
      )}

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around items-center py-3">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected && <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping" />}
            </div>
            <span className="text-xs text-gray-600 mt-1">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
          
          <button onClick={testSound} className="flex flex-col items-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0-14.9a5 5 0 00-1.414 1.414M12 4v16" />
            </svg>
            <span className="text-xs text-black mt-1">Test</span>
          </button>
          
          {!soundEnabled ? (
            <button onClick={toggleSound} className="flex flex-col items-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.536a5 5 0 001.414 1.414m0-14.9a5 5 0 00-1.414 1.414M12 4v16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l5 5-5 5M7 7l-5 5 5 5" />
              </svg>
              <span className="text-xs text-black mt-1">OFF</span>
            </button>
          ) : (
            <button onClick={toggleSound} className="flex flex-col items-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0-14.9a5 5 0 00-1.414 1.414M12 4v16" />
              </svg>
              <span className="text-xs text-green-600 mt-1">ON</span>
            </button>
          )}
          
          <button onClick={handleLogout} className="flex flex-col items-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs text-red-500 mt-1">Exit</span>
          </button>
        </div>
      </nav>

      {/* ========== DESKTOP NAVBAR ========== */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 hidden md:block shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/worker/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🔧</span>
              </div>
              <span className="font-bold text-xl text-black">WorkHub</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isConnected && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />}
                </div>
                <span className="text-sm text-gray-600">{isConnected ? 'Online' : 'Offline'}</span>
              </div>
              
              <button onClick={testSound} className="px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Test Sound</button>
              
              {!soundEnabled ? (
                <button onClick={toggleSound} className="px-3 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800">Enable Sound</button>
              ) : (
                <button onClick={toggleSound} className="px-3 py-1.5 bg-gray-200 text-black rounded-lg text-sm hover:bg-gray-300">Disable Sound</button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <span className="text-gray-700 font-medium">{user?.name}</span>
              </div>
              
              <button onClick={handleLogout} className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== MOBILE HEADER ========== */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden shadow-sm">
        <div className="flex justify-between items-center px-4 py-3">
          <Link to="/worker/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white">🔧</span>
            </div>
            <span className="font-bold text-lg text-black">WorkHub</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 py-3 px-4 space-y-2 bg-white">
            <div className="flex items-center space-x-3 py-2">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">{user?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-black">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Connection Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">{isConnected ? 'Connected to server' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening with your service business today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Total Earnings</p>
                <p className="text-lg md:text-3xl font-bold text-black">₹{stats.totalEarnings}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Completed Jobs</p>
                <p className="text-lg md:text-3xl font-bold text-black">{stats.completed}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Pending Requests</p>
                <p className="text-lg md:text-3xl font-bold text-black">{stats.pending}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Active Jobs</p>
                <p className="text-lg md:text-3xl font-bold text-black">{stats.accepted}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base md:text-lg font-bold text-black">Earnings Overview</h2>
              <div className="flex gap-1">
                <button onClick={() => setSelectedChart('bar')} className={`px-2 py-1 text-xs rounded ${selectedChart === 'bar' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>Bar</button>
                <button onClick={() => setSelectedChart('line')} className={`px-2 py-1 text-xs rounded ${selectedChart === 'line' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>Line</button>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border border-gray-300 px-2 py-1 text-xs rounded bg-white ml-2">
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '300px', minHeight: '300px' }}>
              {chartReady && (
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChart === 'bar' ? (
                    <BarChart data={weeklyData}>
                      <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill: '#666', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="earnings" fill="#000000" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={weeklyData}>
                      <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill: '#666', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="earnings" stroke="#000000" strokeWidth={3} dot={{ fill: '#000000', r: 5 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-black mb-4">Booking Status Distribution</h2>
            <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
              {statusData.length > 0 && chartReady && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {statusData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {statusData.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No booking data available</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg md:text-xl font-bold text-black">Service Requests</h2>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {['pending', 'accepted', 'completed', 'rejected', 'all'].map((status) => (
                  <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition ${filter === status ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {status} <span className="ml-1 text-xs opacity-75">({status === 'all' ? stats.total : stats[status]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
                <p className="mt-3 text-gray-500">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500">No {filter !== 'all' ? filter : ''} bookings found</p>
                <p className="text-xs text-gray-400 mt-1">When customers book your service, they'll appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {booking.bookingStatus === 'pending' && '⏳'}
                          {booking.bookingStatus === 'accepted' && '✅'}
                          {booking.bookingStatus === 'completed' && '🎉'}
                          {booking.bookingStatus === 'rejected' && '❌'}
                        </span>
                        <div>
                          <h3 className="font-bold text-black text-base">{booking.service}</h3>
                          <p className="text-xs text-gray-500">👤 {booking.userId?.name || 'Customer'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(booking.bookingStatus)}`}>
                        {booking.bookingStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>📅 {new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>⏰ {booking.time}</span>
                      </div>
                    </div>

                    {booking.location && booking.location !== 'Address not specified' && (
                      <button onClick={() => openInMaps(booking.location)} className="text-black text-xs flex items-center gap-1 font-medium mb-3 hover:underline">
                        📍 View Location on Map →
                      </button>
                    )}

                    {booking.workerAmount && (
                      <div className="bg-green-50 rounded-lg p-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Your Earnings:</span>
                          <span className="font-bold text-black">₹{booking.workerAmount}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {booking.bookingStatus === 'pending' && (
                        <>
                          <button onClick={() => updateBookingStatus(booking._id, 'accept')} disabled={actionLoading === booking._id} className="flex-1 py-2 bg-black text-white rounded-lg text-sm font-semibold active:scale-95 hover:bg-gray-800 transition disabled:opacity-50">✓ Accept</button>
                          <button onClick={() => updateBookingStatus(booking._id, 'reject')} disabled={actionLoading === booking._id} className="flex-1 py-2 bg-gray-200 text-black rounded-lg text-sm font-semibold active:scale-95 hover:bg-gray-300 transition disabled:opacity-50">✗ Reject</button>
                        </>
                      )}
                      {booking.bookingStatus === 'accepted' && (
                        <button onClick={() => handleCompleteBooking(booking._id)} disabled={actionLoading === booking._id} className="w-full py-2 bg-black text-white rounded-lg text-sm font-semibold active:scale-95 hover:bg-gray-800 transition disabled:opacity-50">✓ Mark as Completed</button>
                      )}
                      {booking.bookingStatus === 'completed' && (
                        <div className="w-full text-center py-2 bg-gray-100 text-black rounded-lg text-sm font-semibold">🎉 Service Completed - {new Date(booking.updatedAt).toLocaleDateString()}</div>
                      )}
                      {booking.bookingStatus === 'rejected' && (
                        <div className="w-full text-center py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">❌ Booking Rejected</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .animate-bounce { animation: bounce 0.5s infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default WorkerDashboard;