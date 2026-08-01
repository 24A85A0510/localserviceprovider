import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const BookingModal = ({ service, onClose, onSuccess }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Step 1: Extract and sanitize token
    const rawToken = localStorage.getItem('token');
    const token = rawToken ? rawToken.replace(/^"(.*)"$/, '$1').trim() : null;

    // Step 2: Validate token presence and JWT structure ('eyJ')
    if (!token || token === 'null' || token === 'undefined' || !token.startsWith('eyJ')) {
      setError('Session expired. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    setSubmitting(true);

    try {
      // Step 3: Format datetime-local string (YYYY-MM-DDTHH:mm:ss)
      const formattedDate = bookingDate
        ? bookingDate.length === 16
          ? `${bookingDate}:00`
          : bookingDate
        : '';

      await API.post('/bookings', {
        serviceId: service.id,
        bookingDate: formattedDate,
        address: address.trim(),
        notes: notes.trim(),
      });

      alert('Booking request submitted successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Booking submission error:', err.response || err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired or unauthorized. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to submit booking.';
        setError(typeof msg === 'string' ? msg : 'Failed to submit booking.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '25px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          border: '1px solid #333',
          color: '#fff',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Book {service?.title || service?.name}</h3>
        <p style={{ color: '#28a745', fontWeight: 'bold', fontSize: '18px', margin: '5px 0 15px 0' }}>
          Price: ₹{service?.price}
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#721c24',
              color: '#f8d7da',
              padding: '10px 14px',
              borderRadius: '4px',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
            }}
          >
            <span>{error}</span>
            {error.includes('login') && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginLeft: '10px',
                  whiteSpace: 'nowrap',
                }}
              >
                Log In Now
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Date & Time:</label>
            <input
              type="datetime-local"
              required
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#111',
                color: '#fff',
                border: '1px solid #444',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Service Address:</label>
            <input
              type="text"
              required
              placeholder="Enter street address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#111',
                color: '#fff',
                border: '1px solid #444',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Notes (Optional):</label>
            <textarea
              rows={3}
              placeholder="Any specific requirements or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: '#111',
                color: '#fff',
                border: '1px solid #444',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {submitting ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;