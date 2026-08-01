import { useState, useEffect } from 'react';
import API from '../api/axios';

const ReviewModal = ({ booking, onClose, onSuccess, onAlreadyReviewed }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Existing review data if already reviewed
  const [existingReview, setExistingReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  const isReviewed = booking.hasReview || booking.reviewed || booking.reviewStatus === 'REVIEWED';

  useEffect(() => {
    // If the booking is already reviewed, fetch the review details to show comment & reply
    if (isReviewed) {
      const fetchExistingReview = async () => {
        setLoadingReview(true);
        try {
          const res = await API.get(`/reviews/service/${booking.serviceId}`);
          const reviews = Array.isArray(res.data) ? res.data : [];
          // Match review by bookingId
          const found = reviews.find((r) => String(r.bookingId) === String(booking.id));
          if (found) {
            setExistingReview(found);
          }
        } catch (err) {
          console.error('Failed to fetch review details:', err);
        } finally {
          setLoadingReview(false);
        }
      };

      fetchExistingReview();
    }
  }, [booking, isReviewed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await API.post('/reviews', {
        bookingId: booking.id,
        rating: Number(rating),
        comment: comment.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit review.';

      if (msg.toLowerCase().includes('already exists')) {
        onAlreadyReviewed();
        onClose();
      } else {
        setError(msg);
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
        <h3 style={{ marginTop: 0 }}>
          {isReviewed ? 'Your Review & Provider Reply' : `Review for ${booking.serviceTitle || 'Service'}`}
        </h3>

        {/* --- VIEW MODE: When review already exists --- */}
        {isReviewed ? (
          loadingReview ? (
            <p style={{ color: '#aaa' }}>Loading review...</p>
          ) : existingReview ? (
            <div>
              <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '6px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Your Rating:</span>
                  <span style={{ color: '#ffc107' }}>{'⭐'.repeat(existingReview.rating)} ({existingReview.rating}/5)</span>
                </div>
                <p style={{ margin: '8px 0', color: '#ddd', fontStyle: 'italic' }}>
                  "{existingReview.comment || 'No written comment.'}"
                </p>
              </div>

              {/* Provider Response Highlight Box */}
              {existingReview.reply ? (
                <div
                  style={{
                    marginTop: '15px',
                    padding: '12px 15px',
                    backgroundColor: '#18222d',
                    borderLeft: '4px solid #007bff',
                    borderRadius: '4px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', color: '#70b5ff', fontWeight: 'bold' }}>
                    Response from Provider:
                  </p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#e0e0e0' }}>
                    {existingReview.reply}
                  </p>
                </div>
              ) : (
                <p style={{ color: '#777', fontSize: '13px', marginTop: '15px', fontStyle: 'italic' }}>
                  The provider hasn't replied to this review yet.
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
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
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: '#28a745' }}>✓ Review submitted!</p>
              <button onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Close
              </button>
            </div>
          )
        ) : (
          /* --- SUBMIT MODE: New Review Form --- */
          <form onSubmit={handleSubmit}>
            {error && (
              <p style={{ color: '#dc3545', backgroundColor: '#300', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
                {error}
              </p>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Rating:</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: '#111',
                  color: '#fff',
                  border: '1px solid #444',
                }}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excellent</option>
                <option value={4}>⭐⭐⭐⭐ (4/5) Good</option>
                <option value={3}>⭐⭐⭐ (3/5) Average</option>
                <option value={2}>⭐⭐ (2/5) Poor</option>
                <option value={1}>⭐ (1/5) Terrible</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Comment:</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
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
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;