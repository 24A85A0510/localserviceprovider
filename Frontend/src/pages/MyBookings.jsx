import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import ProviderReviews from '../components/ProviderReviews';
import LiveTrackingMap from '../components/LiveTrackingMap';
import PaymentModal from '../components/PaymentModal';

// Status badge configuration helper
const STATUS_CONFIG = {
  ACCEPTED: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
  ON_THE_WAY: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
  COMPLETED: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
  PAID: { bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.5)' },
  PENDING: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', border: 'rgba(250, 204, 21, 0.3)' },
  REJECTED: { bg: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: 'rgba(248, 113, 113, 0.3)' },
  CANCELLED: { bg: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: 'rgba(248, 113, 113, 0.3)' },
};

const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'ON_THE_WAY', 'COMPLETED', 'PAID', 'CANCELLED', 'REJECTED'];

const StatusBadge = ({ status }) => {
  const safeStatus = status ? String(status).toUpperCase() : 'PENDING';
  const config = STATUS_CONFIG[safeStatus] || STATUS_CONFIG.PENDING;

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.025em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        display: 'inline-block',
      }}
    >
      {safeStatus}
    </span>
  );
};

// Guarded Analytics Component
const AnalyticsOverview = ({ analytics = {} }) => {
  const safeAnalytics = analytics || {};
  return (
    <div style={{ margin: '24px 0 32px 0' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#f8fafc', fontWeight: '600' }}>
        📈 Business Overview
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Revenue', value: `₹${Number(safeAnalytics.totalEarnings || 0).toFixed(2)}`, color: '#4ade80' },
          { label: 'Completed Jobs', value: safeAnalytics.completedBookingsCount || 0, color: '#38bdf8' },
          { label: 'Pending Requests', value: safeAnalytics.pendingBookingsCount || 0, color: '#facc15' },
          { label: 'Total Orders', value: safeAnalytics.totalBookingsCount || 0, color: '#e2e8f0' },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>{item.label}</p>
            <h2 style={{ margin: '8px 0 0 0', color: item.color, fontSize: '24px', fontWeight: '700' }}>
              {item.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
};

const TabFilters = ({ tabs = [], activeTab, onSelectTab, counts = {} }) => (
  <div
    role="tablist"
    style={{
      display: 'flex',
      gap: '8px',
      margin: '24px 0',
      flexWrap: 'wrap',
      borderBottom: '1px solid #334155',
      paddingBottom: '16px',
    }}
  >
    {tabs.map((tab) => {
      const active = activeTab === tab;
      const count = counts[tab] || 0;

      return (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onSelectTab(tab)}
          style={{
            padding: '8px 16px',
            backgroundColor: active ? '#2563eb' : '#1e293b',
            color: active ? '#ffffff' : '#94a3b8',
            border: active ? '1px solid #3b82f6' : '1px solid #334155',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: active ? '600' : '500',
            fontSize: '13px',
            transition: 'all 0.2s ease',
          }}
        >
          {tab} {count > 0 && `(${count})`}
        </button>
      );
    })}
  </div>
);

const BookingCard = ({
  booking = {},
  isProvider,
  isReviewed,
  onOpenDetails,
  onStatusUpdate,
  onCancel,
  onOpenReview,
  onOpenPayment,
}) => {
  const status = booking.status ? String(booking.status).toUpperCase() : 'PENDING';

  // Safely resolve customer latitude and longitude from booking object
  const lat = booking.customerLatitude ?? booking.customerLat ?? booking.latitude;
  const lng = booking.customerLongitude ?? booking.customerLng ?? booking.longitude;
  const customerLocation = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null;

  return (
    <div
      style={{
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '18px' }}>
            {booking.serviceTitle || `Service #${booking.serviceId || booking.id}`}
          </h3>
          <p style={{ margin: '4px 0', color: '#cbd5e1', fontSize: '14px' }}>
            <strong>Date & Time:</strong> {booking.bookingDate ? new Date(booking.bookingDate).toLocaleString() : 'N/A'}
          </p>
          <p style={{ margin: '4px 0', color: '#cbd5e1', fontSize: '14px' }}>
            <strong>Address:</strong> {booking.address || 'Not Provided'}
          </p>
          {booking.notes && (
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              <strong>Notes:</strong> {booking.notes}
            </p>
          )}
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
            {isProvider ? `Customer: ${booking.customerName || 'N/A'}` : `Provider: ${booking.providerName || 'N/A'}`}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
          <StatusBadge status={status} />

          <button
            type="button"
            onClick={() => onOpenDetails(booking)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            👁️ Details
          </button>

          {/* Provider Actions */}
          {isProvider && status === 'PENDING' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => onStatusUpdate(booking.id, 'ACCEPTED')}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onStatusUpdate(booking.id, 'REJECTED')}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                Reject
              </button>
            </div>
          )}

          {isProvider && status === 'ACCEPTED' && (
            <button
              type="button"
              onClick={() => onStatusUpdate(booking.id, 'ON_THE_WAY')}
              style={{
                padding: '6px 14px',
                backgroundColor: '#a855f7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                marginTop: '4px',
              }}
            >
              🚗 Start Journey (On The Way)
            </button>
          )}

          {isProvider && status === 'ON_THE_WAY' && (
            <button
              type="button"
              onClick={() => onStatusUpdate(booking.id, 'COMPLETED')}
              style={{
                padding: '6px 14px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                marginTop: '4px',
              }}
            >
              Mark Completed
            </button>
          )}

          {/* Customer Actions */}
          {!isProvider && status === 'PENDING' && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              style={{
                padding: '6px 14px',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              ✕ Cancel Booking
            </button>
          )}

          {!isProvider && status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => onOpenPayment(booking)}
              style={{
                padding: '6px 14px',
                backgroundColor: '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3)',
              }}
            >
              💳 Pay Now
            </button>
          )}

          {!isProvider && (status === 'COMPLETED' || status === 'PAID') && (
            <button
              type="button"
              onClick={() => onOpenReview(booking)}
              style={{
                padding: '6px 14px',
                backgroundColor: isReviewed ? '#16a34a' : '#eab308',
                color: isReviewed ? '#fff' : '#0f172a',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                marginTop: '4px',
              }}
            >
              {isReviewed ? '✓ View Review & Reply' : '⭐ Leave a Review'}
            </button>
          )}

          {status === 'PAID' && (
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                marginTop: '4px',
              }}
            >
              ✅ Payment Received
            </span>
          )}
        </div>
      </div>

      {/* Live Map Tracking view with customerLocation passed */}
      {status === 'ON_THE_WAY' && LiveTrackingMap && (
        <LiveTrackingMap
          bookingId={booking.id}
          isProvider={isProvider}
          customerLocation={customerLocation}
        />
      )}
    </div>
  );
};

const BookingDetailsModal = ({ booking = {}, isProvider, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '520px',
          width: '100%',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '20px' }}>Booking #{booking.id || 'N/A'}</h3>
          <StatusBadge status={booking.status} />
        </div>

        <hr style={{ borderColor: '#334155', margin: '16px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#f8fafc' }}>Service:</strong> {booking.serviceTitle || `Service #${booking.serviceId}`}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#f8fafc' }}>Scheduled Date:</strong> {booking.bookingDate ? new Date(booking.bookingDate).toLocaleString() : 'N/A'}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#f8fafc' }}>Service Address:</strong> {booking.address || 'N/A'}
          </p>

          <hr style={{ borderColor: '#334155', margin: '4px 0' }} />

          {isProvider ? (
            <>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#f8fafc' }}>Customer Name:</strong> {booking.customerName || 'N/A'}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#f8fafc' }}>Customer Email:</strong> {booking.customerEmail || 'N/A'}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#f8fafc' }}>Customer Phone:</strong> {booking.customerPhone || 'N/A'}
              </p>
            </>
          ) : (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#f8fafc' }}>Provider Name:</strong> {booking.providerName || 'N/A'}
            </p>
          )}

          {booking.notes && (
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
              <strong style={{ color: '#f8fafc' }}>Special Notes:</strong> {booking.notes}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '24px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Close Details
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  const { userRole } = useContext(AuthContext);
  const rawRole = (userRole || localStorage.getItem('role') || '').toUpperCase();
  const isProvider = rawRole.includes('PROVIDER');

  const fetchBookingsAndAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');

    const endpoint = isProvider ? '/bookings/provider' : '/bookings/customer';

    try {
      const response = await API.get(endpoint);
      const data = Array.isArray(response.data) ? response.data : [];
      setBookings(data);

      const existingReviewed = new Set(
        data.filter((b) => b && (b.hasReview || b.reviewed || b.reviewStatus === 'REVIEWED')).map((b) => b.id)
      );
      setReviewedBookingIds((prev) => new Set([...prev, ...existingReviewed]));

      if (isProvider) {
        try {
          const analyticsRes = await API.get('/bookings/provider/analytics');
          setAnalytics(analyticsRes.data || {});
        } catch (aErr) {
          console.warn('Analytics endpoint unavailable:', aErr);
        }
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to fetch data.';
      setError(typeof errMsg === 'string' ? errMsg : 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  }, [isProvider]);

  useEffect(() => {
    fetchBookingsAndAnalytics();
  }, [fetchBookingsAndAnalytics]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const statusValue = String(newStatus).toUpperCase();
      await API.put(`/bookings/${bookingId}/status?status=${statusValue}`);

      alert(`Booking status updated to ${statusValue}`);
      fetchBookingsAndAnalytics();
    } catch (err) {
      console.error('Status update error:', err);
      const serverMsg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.response?.data?.message;
      alert(serverMsg || 'Failed to update booking status.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    await handleStatusUpdate(bookingId, 'CANCELLED');
  };

  const markBookingAsReviewed = (bookingId) => {
    setReviewedBookingIds((prev) => new Set(prev).add(bookingId));
  };

  const tabCounts = useMemo(() => {
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    return TABS.reduce((acc, tab) => {
      acc[tab] = tab === 'ALL'
        ? safeBookings.length
        : safeBookings.filter((b) => b && String(b.status).toUpperCase() === tab).length;
      return acc;
    }, {});
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    if (activeTab === 'ALL') return safeBookings;
    return safeBookings.filter((booking) => booking && String(booking.status).toUpperCase() === activeTab);
  }, [bookings, activeTab]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#f8fafc', padding: '20px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>
        {isProvider ? 'Provider Dashboard' : 'My Bookings'}
      </h2>

      {/* Provider Business Analytics Summary */}
      {isProvider && analytics && <AnalyticsOverview analytics={analytics} />}

      {/* Provider Feedback Header View */}
      {isProvider && ProviderReviews && <ProviderReviews />}

      {isProvider && (
        <h3 style={{ marginTop: '32px', fontSize: '20px', fontWeight: '600' }}>
          Incoming Booking Requests
        </h3>
      )}

      {error && (
        <div
          style={{
            color: '#f87171',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '16px 0',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Status Tab Filters */}
      {!loading && bookings.length > 0 && (
        <TabFilters
          tabs={TABS}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={tabCounts}
        />
      )}

      {/* Main Content Area */}
      {loading ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: '30px 0' }}>Loading bookings...</p>
      ) : filteredBookings.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: '30px 0' }}>
          {bookings.length === 0
            ? 'No bookings found.'
            : `No bookings found with status "${activeTab}".`}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((booking) => {
            if (!booking) return null;
            const isReviewed =
              reviewedBookingIds.has(booking.id) ||
              booking.hasReview ||
              booking.reviewed;

            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                isProvider={isProvider}
                isReviewed={isReviewed}
                onOpenDetails={setSelectedBookingForDetails}
                onStatusUpdate={handleStatusUpdate}
                onCancel={handleCancelBooking}
                onOpenReview={setSelectedBookingForReview}
                onOpenPayment={setSelectedBookingForPayment}
              />
            );
          })}
        </div>
      )}

      {/* Detailed Booking View Modal */}
      {selectedBookingForDetails && (
        <BookingDetailsModal
          booking={selectedBookingForDetails}
          isProvider={isProvider}
          onClose={() => setSelectedBookingForDetails(null)}
        />
      )}

      {/* Payment Processing Modal */}
      {selectedBookingForPayment && PaymentModal && (
        <PaymentModal
          booking={selectedBookingForPayment}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={() => {
            setSelectedBookingForPayment(null);
            fetchBookingsAndAnalytics();
          }}
        />
      )}

      {/* Review Modal Pop-up */}
      {selectedBookingForReview && ReviewModal && (
        <ReviewModal
          booking={selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          onSuccess={() => {
            markBookingAsReviewed(selectedBookingForReview.id);
            fetchBookingsAndAnalytics();
          }}
          onAlreadyReviewed={() => {
            markBookingAsReviewed(selectedBookingForReview.id);
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;