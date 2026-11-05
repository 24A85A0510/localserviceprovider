import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import CustomerDashboard from './pages/CustomerDashboard';
import CreateService from './pages/CreateService';
import EditService from './pages/EditService';
import BookService from './pages/BookService';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';

function App() {
  const location = useLocation();

  // Public paths where the standalone top Navbar should be shown
  const publicPaths = ['/', '/login', '/register', '/oauth2/redirect'];
  const showStandaloneNavbar = publicPaths.includes(location.pathname);

  return (
    <>
      {showStandaloneNavbar && <Navbar />}
      <Routes>
        {/* PUBLIC FULL-WIDTH ROUTES (NO SIDEBAR) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

        {/* AUTHENTICATED DASHBOARD ROUTES (HANDLES ITS OWN SIDEBAR & TOPBAR) */}
        <Route element={<DashboardLayout />}>
          {/* Main Customer Landing Overview */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Browse & Discovery Catalog */}
          <Route path="/services" element={<Services />} />

          {/* Customer Routes */}
          <Route
            path="/book-service/:serviceId"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Common Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Provider Routes */}
          <Route
            path="/provider-dashboard"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-service"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <CreateService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-service/:id"
            element={
              <ProtectedRoute allowedRoles={['PROVIDER']}>
                <EditService />
              </ProtectedRoute>
            }
          />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;