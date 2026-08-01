import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, userRole } = useContext(AuthContext);

  // 1. Redirect unauthenticated users to /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Normalize user role string (handles "ROLE_PROVIDER", "PROVIDER", etc.)
  const normalizedUserRole = userRole?.replace(/^ROLE_/, '').toUpperCase();

  // 3. Check role permission if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.replace(/^ROLE_/, '').toUpperCase()
    );

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // Intelligently redirect unauthorized users to their correct home base
      if (normalizedUserRole === 'ADMIN') return <Navigate to="/admin" replace />;
      if (normalizedUserRole === 'PROVIDER') return <Navigate to="/profile" replace />;
      return <Navigate to="/my-bookings" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;