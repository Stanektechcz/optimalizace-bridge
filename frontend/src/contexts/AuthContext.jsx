/**
 * Authentication Context
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        const storedUser = authService.getUser();
        if (storedUser) {
          // Try to verify token is still valid by fetching profile
          try {
            const userData = await authService.getProfile();
            setUser(userData);
          } catch (err) {
            // Token expired or invalid, use stored user data
            console.warn('Could not fetch fresh profile, using stored data:', err.message);
            setUser(storedUser);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      console.log('AuthContext: Starting login for user:', username);
      const data = await authService.login(username, password);
      console.log('AuthContext: Login successful, user data:', data.user);
      setUser(data.user);
      return data;
    } catch (err) {
      console.error('AuthContext: Login failed:', err);
      console.error('AuthContext: Error response:', err.response?.data);
      const errorMessage = err.response?.data?.detail || 'Přihlášení selhalo';
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrace selhala');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
