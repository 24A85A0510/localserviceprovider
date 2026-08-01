import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');

  const getInitialUserId = () => {
    const id = localStorage.getItem('userId');
    return id && id !== 'null' && id !== 'undefined' ? id : null;
  };

  const [userId, setUserId] = useState(getInitialUserId);

  // Sync token changes to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.clear();
      setUserRole('');
      setUserId(null);
    }
  }, [token]);

  const login = (jwtToken, userData, role) => {
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);

    // Try extracting role from argument OR decode from JWT payload
    let finalRole = role || userData?.role || userData?.authorities?.[0] || '';

    try {
      const decoded = jwtDecode(jwtToken);
      if (!finalRole && (decoded.role || decoded.authorities)) {
        finalRole = decoded.role || decoded.authorities;
      }
    } catch (e) {
      console.warn('Could not decode JWT:', e);
    }

    // Default fallback to CUSTOMER if role is still empty
    if (!finalRole) finalRole = 'CUSTOMER';

    setUserRole(finalRole);
    localStorage.setItem('role', finalRole);

    const activeUserId = userData?.id || userData?.userId || localStorage.getItem('userId');
    if (activeUserId && activeUserId !== 'null') {
      setUserId(activeUserId);
      localStorage.setItem('userId', activeUserId);
    }

    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setToken(null);
    setUserRole('');
    setUserId(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ token, userRole, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};