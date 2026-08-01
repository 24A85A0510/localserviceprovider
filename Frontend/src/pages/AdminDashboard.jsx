import { useState, useEffect } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalServices: 0, totalBookings: 0 });
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [deleteUserId, setDeleteUserId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Reset search term when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, servicesRes, bookingsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/services'),
        API.get('/admin/bookings'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setServices(servicesRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      setDeleteUserId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // 1. Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // 2. Filtered Services
  const filteredServices = services.filter((s) => {
    const query = searchTerm.toLowerCase();
    const title = s.title ? s.title.toLowerCase() : '';
    const category = s.categoryName ? s.categoryName.toLowerCase() : '';
    const location = s.location ? s.location.toLowerCase() : '';
    const provider = s.providerName ? s.providerName.toLowerCase() : '';

    return title.includes(query) || category.includes(query) || location.includes(query) || provider.includes(query);
  });

  // 3. Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const query = searchTerm.toLowerCase();
    const customer = (b.customerName || b.customerEmail || b.customer?.name || '').toLowerCase();
    const service = (b.serviceTitle || b.service?.title || '').toLowerCase();
    const status = (b.status || '').toLowerCase();

    return customer.includes(query) || service.includes(query) || status.includes(query);
  });

  if (loading) return <p style={{ textAlign: 'center', color: '#fff', marginTop: '50px' }}>Loading Admin Portal...</p>;

  return (
    <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: '20px' }}>🛠️ Admin Control Panel</h2>
      {error && <p style={{ color: '#dc3545', backgroundColor: '#3a1619', padding: '10px', borderRadius: '4px' }}>{error}</p>}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleTabChange('overview')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'overview' ? '#007bff' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Platform Overview
        </button>
        <button
          onClick={() => handleTabChange('users')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'users' ? '#007bff' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => handleTabChange('services')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'services' ? '#007bff' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          All Services ({services.length})
        </button>
        <button
          onClick={() => handleTabChange('bookings')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'bookings' ? '#007bff' : '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          All Bookings ({bookings.length})
        </button>
      </div>

      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '10px', border: '1px solid #333', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '1rem' }}>Total Users</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{stats.totalUsers}</p>
          </div>
          <div style={{ backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '10px', border: '1px solid #333', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '1rem' }}>Total Services</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#17a2b8' }}>{stats.totalServices}</p>
          </div>
          <div style={{ backgroundColor: '#1e1e1e', padding: '24px', borderRadius: '10px', border: '1px solid #333', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#aaa', fontSize: '1rem' }}>Total Bookings</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{stats.totalBookings}</p>
          </div>
        </div>
      )}

      {/* 2. User Management Tab */}
      {activeTab === 'users' && (
        <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '24px', border: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: '1',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #444',
                backgroundColor: '#121212',
                color: '#fff',
                fontSize: '0.95rem',
                minWidth: '200px',
              }}
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #444',
                backgroundColor: '#121212',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PROVIDER">Provider</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', backgroundColor: '#121212' }}>
                  <th style={{ padding: '12px 10px' }}>ID</th>
                  <th style={{ padding: '12px 10px' }}>Name</th>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Role</th>
                  <th style={{ padding: '12px 10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '12px 10px' }}>{u.id}</td>
                      <td style={{ padding: '12px 10px' }}>{u.name || 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>{u.email}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor: u.role === 'ADMIN' ? '#dc3545' : u.role === 'PROVIDER' ? '#17a2b8' : '#28a745',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setDeleteUserId(u.id)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                      No matching users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Services Management Tab */}
      {activeTab === 'services' && (
        <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '24px', border: '1px solid #333' }}>
          {/* Services Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 Search title, category, location, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #444',
                backgroundColor: '#121212',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', backgroundColor: '#121212' }}>
                  <th style={{ padding: '12px 10px' }}>ID</th>
                  <th style={{ padding: '12px 10px' }}>Title</th>
                  <th style={{ padding: '12px 10px' }}>Price</th>
                  <th style={{ padding: '12px 10px' }}>Category</th>
                  <th style={{ padding: '12px 10px' }}>Location</th>
                  <th style={{ padding: '12px 10px' }}>Provider Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '12px 10px' }}>{s.id}</td>
                      <td style={{ padding: '12px 10px' }}>{s.title}</td>
                      <td style={{ padding: '12px 10px', color: '#28a745', fontWeight: 'bold' }}>₹{s.price}</td>
                      <td style={{ padding: '12px 10px' }}>{s.categoryName || 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>{s.location || 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>{s.providerName || `ID: ${s.providerId}`}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                      No matching services found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Bookings Management Tab */}
      {activeTab === 'bookings' && (
        <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '24px', border: '1px solid #333' }}>
          {/* Bookings Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 Search customer, service, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #444',
                backgroundColor: '#121212',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left', backgroundColor: '#121212' }}>
                  <th style={{ padding: '12px 10px' }}>ID</th>
                  <th style={{ padding: '12px 10px' }}>Customer</th>
                  <th style={{ padding: '12px 10px' }}>Service</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                  <th style={{ padding: '12px 10px' }}>Booking Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '12px 10px' }}>{b.id}</td>
                      <td style={{ padding: '12px 10px' }}>{b.customerName || b.customerEmail || b.customer?.name || 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>{b.serviceTitle || b.service?.title || 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor:
                              b.status === 'CONFIRMED' || b.status === 'APPROVED' || b.status === 'COMPLETED'
                                ? '#28a745'
                                : b.status === 'CANCELLED' || b.status === 'REJECTED'
                                ? '#dc3545'
                                : '#ffc107',
                            color: b.status === 'PENDING' ? '#000' : '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                      No matching bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deletion Modal */}
      {deleteUserId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#222',
              padding: '25px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid #444',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Confirm User Deletion</h3>
            <p style={{ color: '#ccc', lineHeight: '1.5' }}>
              Are you sure you want to delete user ID <strong>{deleteUserId}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setDeleteUserId(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUserId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;