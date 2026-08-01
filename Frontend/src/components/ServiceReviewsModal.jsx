import { useState, useEffect } from 'react';
import API from '../api/axios';

const ServiceReviewsModal = ({ service, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceReviews = async () => {
      try {
        const res = await API.get(`/reviews/service/${service.id}`);
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load service reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceReviews();
  }, [service.id]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';

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
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid #333',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Reviews for {service.title}</h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#888',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#262626',
            padding: '10px 15px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'inline-block',
            color: '#ffc107',
            fontWeight: 'bold',
          }}
        >
          ⭐ {reviews.length > 0 ? `${avgRating} / 5.0` : 'No ratings yet'} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
        </div>

        {loading ? (
          <p style={{ color: '#aaa' }}>Loading customer feedback...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: '#777' }}>No reviews submitted for this service yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  backgroundColor: '#222',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#ddd' }}>
                    {rev.customerName || `Customer #${rev.customerId}`}
                  </span>
                  <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                    {'⭐'.repeat(rev.rating)} ({rev.rating}/5)
                  </span>
                </div>

                <p style={{ margin: '6px 0', color: '#ccc', fontSize: '14px' }}>
                  "{rev.comment || 'No written feedback provided.'}"
                </p>

                {/* Provider Reply Display */}
                {rev.reply && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      backgroundColor: '#18222d',
                      borderLeft: '3px solid #007bff',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '12px', color: '#70b5ff', fontWeight: 'bold' }}>
                      Provider Response:
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e0e0e0' }}>
                      {rev.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceReviewsModal;