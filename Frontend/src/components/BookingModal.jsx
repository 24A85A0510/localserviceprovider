import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import LocationPickerMap from './LocationPickerMap';

const BookingModal = ({ service, onClose, onSuccess }) => {
  // Helper to format Date object into YYYY-MM-DDTHH:mm format for datetime-local
  const getInitialDateTime = () => {
    const now = new Date();
    // Default to 1 hour from now, rounded to 00 minutes
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Min date-time string to prevent booking in the past
  const minDateTime = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const [bookingDate, setBookingDate] = useState(getInitialDateTime());
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [customerLocation, setCustomerLocation] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Reverse geocode selected coordinates
  const handleLocationPicked = async (pos) => {
    setCustomerLocation(pos);
    if (!pos || !pos.lat || !pos.lng) return;

    try {
      setGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat}&lon=${pos.lng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
      if (!address) {
        setAddress(`Lat: ${pos.lat.toFixed(5)}, Lng: ${pos.lng.toFixed(5)}`);
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const rawToken = localStorage.getItem('token');
    const token = rawToken ? rawToken.replace(/^"(.*)"$/, '$1').trim() : null;

    if (!token || token === 'null' || token === 'undefined' || !token.startsWith('eyJ')) {
      setError('Session expired. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    if (!bookingDate) {
      setError('Please choose a valid booking date and time.');
      return;
    }

    setSubmitting(true);

    try {
      const formattedDate = bookingDate.length === 16 ? `${bookingDate}:00` : bookingDate;

      const payload = {
        serviceId: service.id,
        bookingDate: formattedDate,
        address: address.trim(),
        notes: notes.trim(),
        customerLatitude: customerLocation ? customerLocation.lat : null,
        customerLongitude: customerLocation ? customerLocation.lng : null,
      };

      await API.post('/bookings', payload);

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

  // Friendly human readable preview of selected date & AM/PM time
  const readableDateTime = useMemo(() => {
    if (!bookingDate) return '';
    const d = new Date(bookingDate);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [bookingDate]);

  return (
    <div className="booking-modal-backdrop">
      <style>{`
        .booking-modal-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .booking-modal-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 28px;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          color: #0f172a;
          box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.2);
          box-sizing: border-box;
          font-family: inherit;
        }

        .modal-head-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .modal-price-tag {
          color: #16a34a;
          font-weight: 800;
          font-size: 1.15rem;
          margin: 0 0 18px 0;
        }

        .field-group {
          margin-bottom: 16px;
        }

        .field-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .field-input {
          width: 100%;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.9rem;
          color: #0f172a !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .field-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        /* Make calendar and clock icon clearly visible and clickable */
        .field-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.85;
          filter: invert(0.2);
          padding: 4px;
        }

        .field-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        .datetime-preview-badge {
          display: inline-block;
          margin-top: 6px;
          padding: 4px 10px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .modal-actions-row {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 22px;
        }

        .btn-modal-cancel {
          padding: 10px 18px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-modal-cancel:hover {
          background: #e2e8f0;
        }

        .btn-modal-submit {
          padding: 10px 22px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .btn-modal-submit:hover {
          background: #1d4ed8;
        }

        .btn-modal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-error-box {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.84rem;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>

      <div className="booking-modal-card">
        <h3 className="modal-head-title">Book {service?.title || service?.name || 'Service'}</h3>
        <p className="modal-price-tag">Price: ₹{service?.price}</p>

        {error && (
          <div className="modal-error-box">
            <span>{error}</span>
            {error.includes('login') && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              >
                Log In
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* DATE & TIME PICKER */}
          <div className="field-group">
            <label className="field-label">
              <span>Date & Time:</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                Tap calendar icon to change
              </span>
            </label>
            <input
              type="datetime-local"
              required
              min={minDateTime}
              className="field-input"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
            {readableDateTime && (
              <div className="datetime-preview-badge">
                📅 Scheduled: {readableDateTime}
              </div>
            )}
          </div>

          {/* SERVICE ADDRESS */}
          <div className="field-group">
            <label className="field-label">
              <span>Service Address:</span>
              {geocoding && (
                <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '500' }}>
                  Resolving address...
                </span>
              )}
            </label>
            <input
              type="text"
              required
              placeholder="Enter street address or pick on map..."
              className="field-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* MAP PICKER */}
          <div className="field-group">
            <label className="field-label">Select Location on Map:</label>
            <LocationPickerMap onSelectLocation={handleLocationPicked} />
          </div>

          {/* NOTES */}
          <div className="field-group">
            <label className="field-label">Notes (Optional):</label>
            <textarea
              rows={3}
              placeholder="Any specific requirements or instructions..."
              className="field-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" onClick={onClose} className="btn-modal-cancel">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-modal-submit">
              {submitting ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;