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

  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [socket, setSocket] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [dateFilter, setDateFilter] = useState('thisWeek');
  const [reconnecting, setReconnecting] = useState(false);

  const autoRejectTimerRef = useRef(null);
  const audioRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // ========== AUDIO SETUP ==========
  const initAudio = useCallback(() => {
    if (audioRef.current) return;
    audioRef.current = new Audio('/song/noti.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.8;
    audioRef.current.addEventListener('error', () => {
      audioRef.current.src = '/noti.mp3';
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
    audioRef.current.play().catch(() => alert('⚠️ Unable to play sound. Please click allow when prompted.'));
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
        alert('🔊 Sound enabled! You will hear notifications for new bookings.');
      } catch {
        alert('⚠️ Could not enable sound. Please click "Test Sound" first and allow audio playback.');
      }
    } else {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setSoundEnabled(false);
      localStorage.removeItem('workerSoundEnabled');
      alert('🔇 Sound disabled');
    }
  }, [soundEnabled, initAudio]);

  useEffect(() => {
    initAudio();
    const savedSound = localStorage.getItem('workerSoundEnabled');
    setSoundEnabled(savedSound === 'true');
  }, [initAudio]);

  // ========== BOOKING API CALLS ==========
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://worker-ibbp.onrender.com'}/api/bookings/worker/my-bookings`,
        { withCredentials: true }
      );
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  const updateBookingStatus = useCallback(async (bookingId, action) => {
    if (!bookingId) return;
    clearTimeout(autoRejectTimerRef.current);
    setActionLoading(bookingId);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'https://worker-ibbp.onrender.com'}/api/bookings/${action}/${bookingId}`,
        {},
        { withCredentials: true }
      );
      setNotification(null);
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} booking`);
    } finally {
      setActionLoading(null);
    }
  }, [fetchBookings]);

  const handleCompleteBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Have you completed this service? Make sure you have finished the job.')) return;
    setActionLoading(bookingId);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL || 'https://worker-ibbp.onrender.com'}/api/bookings/booking/${bookingId}/complete`,
        {},
        { withCredentials: true }
      );
      await fetchBookings();
      alert('✅ Booking marked as complete! Payment will be processed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setActionLoading(null);
    }
  }, [fetchBookings]);

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

  // ========== SOCKET CONNECTION WITH RETRY LOGIC ==========
  const connectSocket = useCallback(() => {
    if (!user?._id) return null;

    const API_URL = process.env.REACT_APP_API_URL || 'https://worker-ibbp.onrender.com';
    
    // Get token from cookies
    const getToken = () => {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') return value;
      }
      return null;
    };

    const token = getToken();
    
    if (!token) {
      console.log('No token found, skipping socket connection');
      return null;
    }

    const newSocket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      
      // Join worker's room with user ID
      newSocket.emit('join', user._id);
      console.log(`Worker joined room: ${user._id}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      // Attempt to reconnect if not intentional
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
      
      reconnectAttemptsRef.current++;
      if (reconnectAttemptsRef.current >= 5) {
        setReconnecting(true);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setReconnecting(false);
      newSocket.emit('join', user._id);
    });

    newSocket.on('newBooking', (data) => {
      console.log('📢 New booking notification:', data);
      
      if (soundEnabled) {
        playNotificationSound();
      }

      clearTimeout(autoRejectTimerRef.current);

      setNotification({
        message: data.message,
        booking: data.booking,
        showActions: true,
        timestamp: Date.now()
      });

      // Auto-reject after 30 seconds
      autoRejectTimerRef.current = setTimeout(() => {
        if (data.booking?._id && notification?.showActions) {
          updateBookingStatus(data.booking._id, 'reject');
          setNotification(null);
        }
      }, 30000);

      fetchBookings();
    });

    return newSocket;
  }, [user?._id, soundEnabled, playNotificationSound, updateBookingStatus, fetchBookings, notification]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) return;

    const newSocket = connectSocket();
    setSocket(newSocket);

    return () => {
      if (autoRejectTimerRef.current) {
        clearTimeout(autoRejectTimerRef.current);
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user?._id, connectSocket]);

  // Manual reconnect function
  const handleReconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setTimeout(() => {
        const newSocket = connectSocket();
        setSocket(newSocket);
      }, 1000);
    } else {
      const newSocket = connectSocket();
      setSocket(newSocket);
    }
  }, [socket, connectSocket]);

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
    
    // Refresh bookings every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchBookings();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Timer for notification countdown
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

  // ========== STATISTICS CALCULATIONS ==========
  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.bookingStatus === 'completed');
    const accepted = bookings.filter(b => b.bookingStatus === 'accepted');
    
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.bookingStatus === 'pending').length,
      accepted: accepted.length,
      completed: completed.length,
      rejected: bookings.filter(b => b.bookingStatus === 'rejected').length,
      totalEarnings: completed.reduce((sum, b) => sum + (b.workerAmount || 0), 0),
      pendingEarnings: accepted.reduce((sum, b) => sum + (b.workerAmount || 0), 0),
      totalJobs: bookings.length,
      completionRate: bookings.length > 0 ? ((completed.length / bookings.length) * 100).toFixed(1) : 0
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
    
    const filtered = bookings.filter(b => {
      if (b.bookingStatus !== 'completed') return false;
      const bookingDate = new Date(b.date);
      bookingDate.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'thisMonth') {
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      }
      return bookingDate >= startDate && bookingDate <= endDate;
    });
    
    filtered.forEach(booking => {
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

  const filteredBookings = useMemo(() => 
    bookings.filter(booking => filter === 'all' ? true : booking.bookingStatus === filter),
    [bookings, filter]
  );

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
        </div>
      );
    }
    return null;
  }, []);

  const handleLogout = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem('workerSoundEnabled');
    logout();
    navigate('/login');
  }, [socket, logout, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Reconnection Banner */}
      {reconnecting && !isConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center">
          <p className="text-sm">⚠️ Connection lost. Reconnecting... </p>
        </div>
      )}

      {/* Offline Status Indicator */}
      {!isConnected && (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Offline</span>
            <button 
              onClick={handleReconnect}
              className="bg-white text-red-500 px-3 py-1 rounded-md text-xs font-semibold hover:bg-gray-100 transition"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Online Status Indicator */}
      {isConnected && (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Online</span>
          </div>
        </div>
      )}

      {/* Fixed Top Notification Popup */}
      {notification?.showActions && notification.booking && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down shadow-2xl">
          <div className="bg-white border-b-2 border-black rounded-b-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-black to-gray-800 px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🔔</span>
                  <span className="font-bold text-white">New Booking Request!</span>
                </div>
                <button 
                  onClick={closeNotification} 
                  className="text-white/80 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-black">{notification.booking.service}</h3>
                  <p className="text-gray-500 text-sm">👤 {notification.booking.userId?.name || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-black">₹{notification.booking.totalAmount}</p>
                  <p className="text-xs text-gray-400">Total Amount</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-black">
                    {formatDate(notification.booking.date)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-semibold text-black">{notification.booking.time}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-gray-700 truncate">{notification.booking.location || 'Address provided'}</p>
                  </div>
                  <button 
                    onClick={() => openInMaps(notification.booking.location)} 
                    className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold whitespace-nowrap hover:bg-gray-800 transition"
                  >
                    View Map →
                  </button>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-100">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Earnings (90%):</span>
                  <span className="font-bold text-green-600 text-lg">₹{notification.booking.workerAmount}</span>
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
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === notification.booking._id ? 'Processing...' : '✓ ACCEPT'}
                </button>
                <button 
                  onClick={() => updateBookingStatus(notification.booking._id, 'reject')} 
                  disabled={actionLoading === notification.booking._id}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
                >
                  ✗ REJECT
                </button>
              </div>
            </div>
            
            <div className="h-1 bg-gray-200">
              <div 
                className="h-full bg-black transition-all duration-1000 ease-linear" 
                style={{ width: `${(timeLeft / 30) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around items-center py-2">
          <div className="flex flex-col items-center px-3">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600 mt-1">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
          
          <button onClick={testSound} className="flex flex-col items-center p-2">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0-14.9a5 5 0 00-1.414 1.414M12 4v16" />
            </svg>
            <span className="text-xs text-gray-700 mt-1">Test</span>
          </button>
          
          {!soundEnabled ? (
            <button onClick={toggleSound} className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15.536a5 5 0 001.414 1.414m0-14.9a5 5 0 00-1.414 1.414M12 4v16" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l5 5-5 5M7 7l-5 5 5 5" />
              </svg>
              <span className="text-xs text-gray-700 mt-1">Enable</span>
            </button>
          ) : (
            <button onClick={toggleSound} className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0-14.9a5 5 0 00-1.414 1.414M12 4v16" />
              </svg>
              <span className="text-xs text-green-600 mt-1">ON</span>
            </button>
          )}
          
          <button onClick={handleLogout} className="flex flex-col items-center p-2">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-xs text-red-600 mt-1">Exit</span>
          </button>
        </div>
      </nav>

      {/* Desktop Navbar */}
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
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700 font-medium">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <button 
                onClick={testSound} 
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition font-medium"
              >
                Test Sound
              </button>
              
              {!soundEnabled ? (
                <button 
                  onClick={toggleSound} 
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition font-medium"
                >
                  Enable Sound
                </button>
              ) : (
                <button 
                  onClick={toggleSound} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Disable Sound
                </button>
              )}
              
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
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
          <div className="border-t border-gray-200 py-3 px-4 space-y-3 bg-white shadow-lg">
            <div className="flex items-center space-x-3 py-2">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-black text-base">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Connection Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                {!isConnected && (
                  <button 
                    onClick={handleReconnect}
                    className="ml-auto text-xs bg-black text-white px-3 py-1 rounded-lg"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sound Status Banner */}
      {!soundEnabled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mx-3 mt-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">🔔</span>
            <p className="text-xs text-gray-700 flex-1">
              Click <strong className="font-semibold">"Test Sound"</strong> first, then <strong className="font-semibold">"Enable Sound"</strong> to get audio alerts for new bookings
            </p>
            <div className="flex gap-2">
              <button 
                onClick={testSound} 
                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition"
              >
                Test Sound
              </button>
              <button 
                onClick={toggleSound} 
                className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition"
              >
                Enable Sound
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sound Enabled Banner */}
      {soundEnabled && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2 mx-3 mt-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔊</span>
            <p className="text-xs text-gray-700">Sound notifications are <strong className="text-green-700">ON</strong> - You'll hear alerts for new bookings</p>
            <button 
              onClick={testSound} 
              className="ml-auto px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition"
            >
              Test
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your service business today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Total Earnings</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900">
                  ₹{stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Completed Jobs</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Pending Requests</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm">Active Jobs</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900">{stats.accepted}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-base md:text-lg font-bold text-gray-900">Weekly Earnings</h2>
              <div className="flex gap-1">
                <button 
                  onClick={() => setSelectedChart('bar')} 
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                    selectedChart === 'bar' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Bar
                </button>
                <button 
                  onClick={() => setSelectedChart('line')} 
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                    selectedChart === 'line' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Line
                </button>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 px-2 py-1.5 text-xs rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>
            </div>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === 'bar' ? (
                  <BarChart data={weeklyData}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill: '#666', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="earnings" fill="#1a1a1a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={weeklyData}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fill: '#666', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="earnings" stroke="#1a1a1a" strokeWidth={3} dot={{ fill: '#1a1a1a', r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">Booking Status Distribution</h2>
            <div className="h-64 md:h-80">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statusData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">No booking data available</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base md:text-xl font-bold text-gray-900">Service Requests</h2>
              
              <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
                {['pending', 'accepted', 'completed', 'rejected', 'all'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                      filter === status
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {status}
                    <span className="ml-1.5 text-xs opacity-75">
                      ({status === 'all' ? stats.total : stats[status]})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                <p className="mt-3 text-gray-500">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">No {filter !== 'all' ? filter : ''} bookings found</p>
                <p className="text-sm text-gray-400 mt-1">When customers book your services, they'll appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking) => (
                  <div key={booking._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {booking.bookingStatus === 'pending' && '⏳'}
                          {booking.bookingStatus === 'accepted' && '✅'}
                          {booking.bookingStatus === 'completed' && '🎉'}
                          {booking.bookingStatus === 'rejected' && '❌'}
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{booking.service}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            👤 {booking.userId?.name || 'Unknown Customer'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(booking.bookingStatus)}`}>
                        {booking.bookingStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>📅 {formatDate(booking.date)}</span>
                        <span>•</span>
                        <span>⏰ {booking.time}</span>
                      </div>
                      {booking.location && booking.location !== 'Address not specified' && (
                        <button
                          onClick={() => openInMaps(booking.location)}
                          className="text-gray-900 text-xs flex items-center gap-1 font-medium hover:text-gray-600 transition"
                        >
                          📍 View Map →
                        </button>
                      )}
                    </div>

                    {booking.workerAmount && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Earnings (90%):</span>
                          <span className="font-bold text-gray-900 text-base">₹{booking.workerAmount}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {booking.bookingStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => updateBookingStatus(booking._id, 'accept')}
                            disabled={actionLoading === booking._id}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold active:scale-95 hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {actionLoading === booking._id ? 'Processing...' : '✓ Accept Booking'}
                          </button>
                          <button
                            onClick={() => updateBookingStatus(booking._id, 'reject')}
                            disabled={actionLoading === booking._id}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold active:scale-95 hover:bg-red-700 transition disabled:opacity-50"
                          >
                            ✗ Reject Booking
                          </button>
                        </>
                      )}
                      
                      {booking.bookingStatus === 'accepted' && (
                        <button
                          onClick={() => handleCompleteBooking(booking._id)}
                          disabled={actionLoading === booking._id}
                          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold active:scale-95 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {actionLoading === booking._id ? 'Processing...' : '✓ Mark as Complete'}
                        </button>
                      )}
                      
                      {booking.bookingStatus === 'completed' && (
                        <div className="w-full text-center px-4 py-2.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                          🎉 Service Completed - Payment Processed
                        </div>
                      )}
                      
                      {booking.bookingStatus === 'rejected' && (
                        <div className="w-full text-center px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
                          ❌ Booking Rejected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-bounce {
          animation: bounce 0.5s infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default WorkerDashboard;