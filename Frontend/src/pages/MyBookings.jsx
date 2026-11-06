import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import ProviderReviews from '../components/ProviderReviews';
import LiveTrackingMap from '../components/LiveTrackingMap';
import PaymentModal from '../components/PaymentModal';

// Status badge styling system
const STATUS_CONFIG = {
  ACCEPTED: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  WAITING_APPROVAL: { bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' },
  CONFIRMED: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  APPROVED: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  ON_THE_WAY: { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' },
  COMPLETED: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  PAID: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  PENDING: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  REJECTED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  CANCELLED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const TABS = ['ALL', 'PENDING', 'WAITING_APPROVAL', 'CONFIRMED', 'ON_THE_WAY', 'COMPLETED', 'PAID', 'CANCELLED', 'REJECTED'];

const StatusBadge = ({ status }) => {
  const safeStatus = status ? String(status).toUpperCase() : 'PENDING';
  const config = STATUS_CONFIG[safeStatus] || STATUS_CONFIG.PENDING;

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '700',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        display: 'inline-block',
      }}
    >
      {safeStatus.replace('_', ' ')}
    </span>
  );
};

// Guarded Analytics Component
const AnalyticsOverview = ({ analytics = {} }) => {
  const safeAnalytics = analytics || {};
  return (
    <div style={{ margin: '10px 0 24px 0' }}>
      <h3 style={{ marginBottom: '14px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
        📈 Business Overview
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Revenue', value: `₹${Number(safeAnalytics.totalEarnings || 0).toFixed(2)}`, color: '#16a34a' },
          { label: 'Completed Jobs', value: safeAnalytics.completedBookingsCount || 0, color: '#2563eb' },
          { label: 'Pending Requests', value: safeAnalytics.pendingBookingsCount || 0, color: '#ca8a04' },
          { label: 'Total Orders', value: safeAnalytics.totalBookingsCount || 0, color: '#0f172a' },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{item.label}</p>
            <h2 style={{ margin: '6px 0 0 0', color: item.color, fontSize: '1.5rem', fontWeight: '800' }}>
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
      margin: '20px 0',
      flexWrap: 'wrap',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '14px',
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
            backgroundColor: active ? '#2563eb' : '#ffffff',
            color: active ? '#ffffff' : '#64748b',
            border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: active ? '700' : '500',
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
        >
          {tab.replace('_', ' ')} {count > 0 && `(${count})`}
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
  onProposePrice,
  onRespondQuote,
  onOpenReview,
  onOpenPayment,
}) => {
  const status = booking.status ? String(booking.status).toUpperCase() : 'PENDING';
  const isPaid = (booking.paymentStatus && String(booking.paymentStatus).toUpperCase() === 'PAID') || status === 'PAID';
  const [quoteInput, setQuoteInput] = useState(booking.amount || '');

  const lat = booking.customerLatitude ?? booking.customerLat ?? booking.latitude;
  const lng = booking.customerLongitude ?? booking.customerLng ?? booking.longitude;
  const customerLocation = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null;

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
            {booking.serviceTitle || `Service #${booking.serviceId || booking.id}`}
          </h3>
          <p style={{ margin: '4px 0', color: '#475569', fontSize: '14px' }}>
            <strong style={{ color: '#0f172a' }}>Date & Time:</strong> {booking.bookingDate ? new Date(booking.bookingDate).toLocaleString() : 'N/A'}
          </p>
          <p style={{ margin: '4px 0', color: '#475569', fontSize: '14px' }}>
            <strong style={{ color: '#0f172a' }}>Address:</strong> {booking.address || 'Not Provided'}
          </p>
          {booking.amount != null && (
            <p style={{ margin: '4px 0', color: '#16a34a', fontSize: '15px', fontWeight: '700' }}>
              Quoted Amount: ₹{booking.amount}
            </p>
          )}
          {booking.notes && (
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '13px' }}>
              <strong>Notes:</strong> {booking.notes}
            </p>
          )}
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
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
              backgroundColor: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            👁️ Details
          </button>

          {/* Provider: Propose / Update Quote Section */}
          {isProvider && (status === 'PENDING' || status === 'ACCEPTED') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  placeholder="Set Total ₹"
                  value={quoteInput}
                  onChange={(e) => setQuoteInput(e.target.value)}
                  style={{
                    width: '110px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => onProposePrice(booking.id, quoteInput)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ea580c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13px',
                  }}
                >
                  Send Quote
                </button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Customer must approve before start</span>
            </div>
          )}

          {/* Provider: Waiting on Customer Approval Indicator */}
          {isProvider && status === 'WAITING_APPROVAL' && (
            <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>
              ⏳ Waiting for customer to accept ₹{booking.amount}
            </span>
          )}

          {/* Provider: Start Journey after Customer Confirms */}
          {isProvider && status === 'CONFIRMED' && (
            <button
              type="button"
              onClick={() => onStatusUpdate(booking.id, 'ON_THE_WAY')}
              style={{
                padding: '6px 14px',
                backgroundColor: '#9333ea',
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

          {/* Provider: Complete the Job */}
          {isProvider && status === 'ON_THE_WAY' && (
            <button
              type="button"
              onClick={() => onStatusUpdate(booking.id, 'COMPLETED')}
              style={{
                padding: '6px 14px',
                backgroundColor: '#2563eb',
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

          {/* Customer: Reviews & Decides on Quote */}
          {!isProvider && status === 'WAITING_APPROVAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginTop: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Provider Quoted: <span style={{ color: '#16a34a' }}>₹{booking.amount}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onRespondQuote(booking.id, true)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13px',
                  }}
                >
                  ✓ Accept Quote
                </button>
                <button
                  type="button"
                  onClick={() => onRespondQuote(booking.id, false)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13px',
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          )}

          {/* Customer: Confirmed Notice (Awaiting Service Completion) */}
          {!isProvider && (status === 'CONFIRMED' || status === 'ON_THE_WAY') && !isPaid && (
            <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', marginTop: '4px' }}>
              {status === 'ON_THE_WAY' ? '🚗 Provider is on the way!' : `✓ Quote approved (₹${booking.amount}). Service scheduled.`}
            </span>
          )}

          {/* Customer: Cancel button for pending bookings */}
          {!isProvider && status === 'PENDING' && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              style={{
                padding: '6px 14px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
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

          {/* Customer: Payment is strictly unlocked ONLY after completion */}
          {!isProvider && status === 'COMPLETED' && !isPaid && (
            <button
              type="button"
              onClick={() => onOpenPayment(booking)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
              }}
            >
              💳 Pay ₹{booking.amount || booking.servicePrice || ''}
            </button>
          )}

          {/* Customer: Review prompt */}
          {!isProvider && (status === 'COMPLETED' || isPaid) && (
            <button
              type="button"
              onClick={() => onOpenReview(booking)}
              style={{
                padding: '6px 14px',
                backgroundColor: isReviewed ? '#f0fdf4' : '#fefce8',
                color: isReviewed ? '#16a34a' : '#ca8a04',
                border: isReviewed ? '1px solid #bbf7d0' : '1px solid #fef08a',
                fontWeight: '600',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                marginTop: '4px',
              }}
            >
              {isReviewed ? '✓ View Review & Reply' : '⭐ Leave a Review'}
            </button>
          )}

          {/* Paid Confirmation Badge */}
          {isPaid && (
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '520px',
          width: '100%',
          color: '#0f172a',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Booking #{booking.id || 'N/A'}</h3>
          <StatusBadge status={booking.status} />
        </div>

        <hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#475569' }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>Service:</strong> {booking.serviceTitle || `Service #${booking.serviceId}`}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>Scheduled Date:</strong> {booking.bookingDate ? new Date(booking.bookingDate).toLocaleString() : 'N/A'}
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#0f172a' }}>Service Address:</strong> {booking.address || 'N/A'}
          </p>
          {booking.amount != null && (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Quoted Price:</strong> ₹{booking.amount}
            </p>
          )}

          <hr style={{ borderColor: '#e2e8f0', margin: '4px 0' }} />

          {isProvider ? (
            <>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#0f172a' }}>Customer Name:</strong> {booking.customerName || 'N/A'}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#0f172a' }}>Customer Email:</strong> {booking.customerEmail || 'N/A'}
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#0f172a' }}>Customer Phone:</strong> {booking.customerPhone || 'N/A'}
              </p>
            </>
          ) : (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#0f172a' }}>Provider Name:</strong> {booking.providerName || 'N/A'}
            </p>
          )}

          {booking.notes && (
            <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>Special Notes:</strong> {booking.notes}
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
            borderRadius: '8px',
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

  // Provider proposes price
  const handleProposePrice = async (bookingId, amount) => {
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid price greater than 0.');
      return;
    }
    try {
      await API.put(`/bookings/${bookingId}/propose-price?amount=${Number(amount)}`);
      alert(`Quote of ₹${amount} sent to customer for approval.`);
      fetchBookingsAndAnalytics();
    } catch (err) {
      console.error('Propose price error:', err);
      alert(err.response?.data?.message || err.response?.data || 'Failed to send quote.');
    }
  };

  // Customer responds to quote
  const handleRespondQuote = async (bookingId, accept) => {
    const actionText = accept ? 'accept and confirm' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionText} this price quote?`)) {
      return;
    }
    try {
      await API.put(`/bookings/${bookingId}/respond-quote?accept=${accept}`);
      alert(accept ? 'Quote accepted! Booking confirmed.' : 'Quote rejected.');
      fetchBookingsAndAnalytics();
    } catch (err) {
      console.error('Respond quote error:', err);
      alert(err.response?.data?.message || err.response?.data || 'Failed to process decision.');
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: '#0f172a' }}>
      <h2 style={{ fontSize: '1.65rem', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>
        {isProvider ? 'Provider Dashboard' : 'My Bookings'}
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
        {isProvider ? 'Manage incoming job orders, send price quotes, and fulfill requests' : 'Track and manage your scheduled service reservations and quotes'}
      </p>

      {/* Provider Business Analytics Summary */}
      {isProvider && analytics && <AnalyticsOverview analytics={analytics} />}

      {/* Provider Feedback Header View */}
      {isProvider && ProviderReviews && <ProviderReviews />}

      {isProvider && (
        <h3 style={{ marginTop: '28px', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
          Incoming Booking Requests
        </h3>
      )}

      {error && (
        <div
          style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
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
        <p style={{ color: '#64748b', fontStyle: 'italic', margin: '30px 0' }}>Loading bookings...</p>
      ) : filteredBookings.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📋</span>
          <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>No Bookings Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            {bookings.length === 0
              ? 'You have not booked any services yet. Check out the Browse Services tab!'
              : `No bookings found matching status "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                onProposePrice={handleProposePrice}
                onRespondQuote={handleRespondQuote}
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