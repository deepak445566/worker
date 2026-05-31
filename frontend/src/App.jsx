import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
// Remove VerifyOTP import
// import VerifyOTP from './components/VerifyOTP';

import { AuthProvider, useAuth } from './context/AuthContext';

// User Pages


// Worker and Admin Pages
import WorkerDashboard from './pages/Worker/WorkerDashboard';
import AdminPanel from './pages/admin/AdminPanel';
import Dashboard from './pages/User/UserDashboard';
import MyBookings from './pages/User/MyBookings';
import Services from './pages/User/Services';
import Profile from './pages/User/Profile';
import Footer from './components/Footer';
import Navbar from './components/Navbar';


// Protected Route wrapper component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'user') return <Navigate to="/user/dashboard" />;
    if (user.role === 'worker') return <Navigate to="/worker-dashboard" />;
  
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'user':
      return <Navigate to="/user/dashboard" />;
    case 'worker':
      return <Navigate to="/worker-dashboard" />;
   
    default:
      return <Navigate to="/login" />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Remove OTP verification route */}
      {/* <Route path="/verify-otp" element={<VerifyOTP />} /> */}
      <Route path="/admin" element={<AdminPanel/>}/>
      {/* Root Route - Role-based redirect */}
      <Route path="/" element={<RoleBasedRedirect />} />
      
      {/* User Routes */}
      <Route 
        path="/user/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Navbar/>
            <Dashboard />
            <Footer/>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/user/my-bookings" 
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <Navbar/>
            <MyBookings />
              <Footer/>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/user/services" 
        element={
          <ProtectedRoute allowedRoles={['user']}>
             <Navbar/>
            <Services />
              <Footer/>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/user/profile" 
        element={
          <ProtectedRoute allowedRoles={['user']}>
             <Navbar/>
            <Profile />
              <Footer/>
          </ProtectedRoute>
        } 
      />
      
      {/* Worker Route */}
      <Route 
        path="/worker-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <WorkerDashboard />
          </ProtectedRoute>
        } 
      />
      
     
      
      {/* Catch all - redirect to root */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;