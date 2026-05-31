import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "https://worker-ibbp.onrender.com/api/auth";

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/me`, {
        withCredentials: true
      });

      if (response.data) {
        const userData = response.data.user;
        setUser(userData);

        // worker data from backend
        if (userData.role === "worker") {
          setWorker(response.data.worker || null);
        }
      }

    } catch (error) {
      console.error("isAuth error:", error.response?.status);

      // if unauthorized, set user to null
      if (error.response?.status === 401) {
        setUser(null);
      }

    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    await fetchUserData();
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData, {
        withCredentials: true
      });

      if (response.data.success) {
        // User is automatically verified, no OTP needed
        setUser(response.data.user);
        if (response.data.worker) {
          setWorker(response.data.worker);
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password }, {
        withCredentials: true
      });

      if (response.data.success) {
        setUser(response.data.user);
        if (response.data.worker) {
          setWorker(response.data.worker);
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setWorker(null);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      worker, 
      loading, 
      logout,
      register,
      login,
      fetchUserData,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};