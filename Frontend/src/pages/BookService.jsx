import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import LocationPickerMap from '../components/LocationPickerMap';

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);

  // Default to 1 hour ahead rounded to the top of the hour
  const getInitialDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0, 0, 0);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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

  // Fetch service details for price and name
  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const res = await API.get(`/services/${serviceId}`);
        setService(res.data);
      } catch (err) {
        console.error('Failed to load service details:', err);
        // Fallback to fetch from list if singular endpoint differs
        try {
          const listRes = await API.get('/services');
          const found = (Array.isArray(listRes.data) ? listRes.data : listRes.data?.content || []).find(
            (s) => String(s.id) === String(serviceId)
          );
          if (found) setService(found);
          else setError('Service details could not be found.');
        } catch {
          setError('Failed to load service details.');
        }
      } finally {
        setLoadingService(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  // Reverse Geocode coordinates to address string
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
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (!bookingDate) {
      setError('Please select a valid booking date and time.');
      return;
    }

    setSubmitting(true);

    try {
      const formattedDate = bookingDate.length === 16 ? `${bookingDate}:00` : bookingDate;

      const payload = {
        serviceId: Number(serviceId),
        bookingDate: formattedDate,
        address: address.trim(),
        notes: notes.trim(),
        customerLatitude: customerLocation ? customerLocation.lat : null,
        customerLongitude: customerLocation ? customerLocation.lng : null,
      };

      await API.post('/bookings', payload);

      alert('Booking request submitted successfully!');
      navigate('/my-bookings');
    } catch (err) {
      console.error('Booking submission error:', err.response || err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired or unauthorized. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
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
    <div className="book-page-shell">
      <style>{`
        .book-page-shell {
          max-width: 680px;
          margin: 0 auto;
          color: #0f172a;
          padding: 10px 0 30px 0;
        }

        .book-page-header {
          margin-bottom: 24px;
        }

        .book-page-header h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .book-page-header p {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        .book-card-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px 36px;
          box-shadow: 0 4px 15px -3px rgba(15, 23, 42, 0.05);
        }

        .service-summary-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 24px;
        }

        .service-summary-pill h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e40af;
        }

        .service-summary-pill span {
          font-size: 1.25rem;
          font-weight: 800;
          color: #16a34a;
        }

        .book-group-block {
          margin-bottom: 20px;
        }

        .book-group-block label {
          display: flex;
          justify-content: space-between;
          font-size: 0.86rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
        }

        .book-input-styled {
          width: 100%;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 0.92rem;
          color: #0f172a !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }

        .book-input-styled:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .book-input-styled::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.85;
          filter: invert(0.2);
          padding: 4px;
        }

        .book-datetime-badge {
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

        textarea.book-input-styled {
          resize: vertical;
          min-height: 90px;
        }

        .btn-book-submit {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 13px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          transition: background 0.15s ease;
        }

        .btn-book-submit:hover {
          background: #1d4ed8;
        }

        .btn-book-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .book-alert-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="book-page-header">
        <h1>Book Service</h1>
        <p>Confirm scheduled time, service location, and requirements</p>
      </div>

      <div className="book-card-container">
        {service && (
          <div className="service-summary-pill">
            <div>
              <h3>{service.title || service.name}</h3>
              <small style={{ color: '#64748b' }}>Provider: {service.providerName || 'Certified Expert'}</small>
            </div>
            <span>₹{service.price}</span>
          </div>
        )}

        {error && <div className="book-alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Booking Date & Time */}
          <div className="book-group-block">
            <label>
              <span>Booking Date & Time:</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                Tap calendar icon to choose
              </span>
            </label>
            <input
              type="datetime-local"
              required
              min={minDateTime}
              className="book-input-styled"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
            {readableDateTime && (
              <div className="book-datetime-badge">
                📅 Scheduled: {readableDateTime}
              </div>
            )}
          </div>

          {/* Service Address */}
          <div className="book-group-block">
            <label>
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
              placeholder="Enter street address or choose on map below..."
              className="book-input-styled"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Location Picker Map */}
          <div className="book-group-block">
            <label>Select Location on Map:</label>
            <LocationPickerMap onSelectLocation={handleLocationPicked} />
          </div>

          {/* Notes */}
          <div className="book-group-block">
            <label>Notes / Special Requests (Optional):</label>
            <textarea
              rows="3"
              placeholder="Any details for the service provider..."
              className="book-input-styled"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-book-submit"
            disabled={submitting || loadingService}
          >
            {submitting ? 'Confirming Booking...' : 'Confirm Booking →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookService;