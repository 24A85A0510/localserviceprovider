import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import LocationPickerMap from '../components/LocationPickerMap';

const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [customerLocation, setCustomerLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch service details for display
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await API.get(`/api/services/${serviceId}`);
        setService(response.data);
      } catch (err) {
        // Fallback in case base URL already includes /api
        try {
          const resFallback = await API.get(`/services/${serviceId}`);
          setService(resFallback.data);
        } catch (fErr) {
          setError('Failed to load service details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Format datetime-local output ("YYYY-MM-DDTHH:mm") to full ISO LocalDateTime ("YYYY-MM-DDTHH:mm:00")
    let formattedDate = bookingDate;
    if (bookingDate && bookingDate.length === 16) {
      formattedDate = `${bookingDate}:00`;
    }

    const payload = {
      serviceId: parseInt(serviceId, 10),
      bookingDate: formattedDate,
      address,
      notes,
      customerLatitude: customerLocation ? customerLocation.lat : null,
      customerLongitude: customerLocation ? customerLocation.lng : null,
    };

    try {
      // Direct call to /api/bookings to ensure route matches @RequestMapping("/api/bookings")
      await API.post('/api/bookings', payload);

      alert('Booking request created successfully!');
      navigate('/my-bookings');
    } catch (err) {
      if (err.response?.status === 404) {
        // Fallback retry if Axios baseURL already ends in /api
        try {
          await API.post('/bookings', payload);
          alert('Booking request created successfully!');
          navigate('/my-bookings');
          return;
        } catch (retryErr) {
          setError(retryErr.response?.data?.message || 'Failed to submit booking request.');
        }
      } else if (err.response?.status === 403) {
        setError('Access Denied: You must be logged in as a CUSTOMER to create a booking.');
      } else {
        setError(err.response?.data?.message || 'Failed to submit booking request.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px', color: '#fff' }}>Loading service...</p>;

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '40px auto',
        padding: '20px',
        border: '1px solid #333',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}
    >
      <h2>Book Service</h2>

      {service && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#222', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 5px 0' }}>{service.title}</h3>
          <p style={{ margin: 0, color: '#aaa' }}>Price: ${service.price}</p>
        </div>
      )}

      {error && (
        <p style={{ color: '#dc3545', backgroundColor: '#300', padding: '10px', borderRadius: '4px' }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Booking Date & Time</label>
          <input
            type="datetime-local"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Service Address</label>
          <input
            type="text"
            placeholder="Enter full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Interactive Location Picker Map */}
        <LocationPickerMap onSelectLocation={(pos) => setCustomerLocation(pos)} />

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Notes / Special Requests</label>
          <textarea
            placeholder="Any details for the service provider..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#222',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {submitting ? 'Submitting...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default BookService;