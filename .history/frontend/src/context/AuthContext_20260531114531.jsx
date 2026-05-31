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

  // ✅ Save token to multiple locations
  const saveToken = (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      sessionStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ Token saved to localStorage, sessionStorage, and axios headers');
      return true;
    }
    return false;
  };

  // ✅ Get token from storage
  const getToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  };

  // ✅ Clear token
  const clearToken = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    console.log('🗑️ Token cleared');
  };

  // ✅ Fetch user data
  const fetchUserData = async () => {
    const token = getToken();
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_URL}/me`, {
        withCredentials: true
      });

      if (response.data) {
        setUser(response.data.user);
        if (response.data.user?.role === "worker") {
          setWorker(response.data.worker);
        }
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      if (error.response?.status === 401) {
        clearToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData, {
        withCredentials: true
      });

      console.log('Register response:', response.data);

      if (response.data.success) {
        // Save token from response
        if (response.data.token) {
          saveToken(response.data.token);
        }
        
        setUser(response.data.user);
        if (response.data.worker) {
          setWorker(response.data.worker);
        }
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // ✅ Login
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password }, {
        withCredentials: true
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        // Save token from response
        if (response.data.token) {
          saveToken(response.data.token);
        }
        
        setUser(response.data.user);
        if (response.data.worker) {
          setWorker(response.data.worker);
        }
        
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    clearToken();
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
      getToken,
      saveToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};