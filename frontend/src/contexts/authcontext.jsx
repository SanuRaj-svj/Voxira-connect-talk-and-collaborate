import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STORAGE_KEY = 'holo-user';

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);

  const authenticate = async (endpoint, payload) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || 'Authentication failed.');
      }

      const nextUser = {
        name: payload.name || result.name || 'User',
        email: payload.username,
        token: result.token || null,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const login = (username, password) =>
    authenticate('login', { username, password });

  const register = (name, username, password) =>
    authenticate('register', { name, username, password });

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}