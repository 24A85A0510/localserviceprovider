import { useState, useEffect } from 'react';
import API from '../api/axios';

const ProviderReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracks active reply input states: { [reviewId]: "reply text" }
  const [replyInputs, setReplyInputs] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const fetchProviderReviews = async () => {
    try {
      const response = await API.get('/reviews/provider');
      setReviews(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load provider reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderReviews();
  }, []);

  const handleReplySubmit = async (reviewId) => {
    const text = replyInputs[reviewId]?.trim();
    if (!text) return;

    setSubmittingId(reviewId);
    try {
      await API.post(`/reviews/${reviewId}/reply`, { reply: text });
      setActiveReplyId(null);
      setReplyInputs((prev) => ({ ...prev, [reviewId]: '' }));
      fetchProviderReviews(); // Reload list to show saved reply
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to submit reply.');
    } finally {
      setSubmittingId(null);
    }
  };

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
      : '0.0';

  if (loading) return <p style={{ color: '#aaa' }}>Loading customer feedback...</p>;

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #333',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h3 style={{ margin: 0, color: '#fff' }}>Customer Feedback & Reviews</h3>
        <div
          style={{
            backgroundColor: '#262626',
            padding: '8px 16px',
            borderRadius: '6px',
            color: '#ffc107',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          ⭐ {totalReviews > 0 ? `${avgRating} / 5.0` : 'No Ratings Yet'} ({totalReviews}{' '}
          {totalReviews === 1 ? 'review' : 'reviews'})
        </div>
      </div>

      {reviews.length === 0 ? (
        <p style={{ color: '#888', margin: 0 }}>No customer reviews received yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                backgroundColor: '#222',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #333',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                  {rev.serviceTitle || 'Service'}
                </span>
                <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                  {'⭐'.repeat(rev.rating)} ({rev.rating}/5)
                </span>
              </div>

              <p style={{ margin: '6px 0', color: '#ddd', fontSize: '14px' }}>
                "{rev.comment || 'No written comment provided.'}"
              </p>

              <span style={{ fontSize: '12px', color: '#777' }}>
                By Customer #{rev.customerId || rev.customerName || 'User'}
              </span>

              {/* Display Existing Provider Reply */}
              {rev.reply ? (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    backgroundColor: '#18222d',
                    borderLeft: '3px solid #007bff',
                    borderRadius: '4px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', color: '#70b5ff', fontWeight: 'bold' }}>
                    Your Response:
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#ccc' }}>
                    {rev.reply}
                  </p>
                </div>
              ) : (
                /* Reply Button / Text Input */
                <div style={{ marginTop: '10px' }}>
                  {activeReplyId === rev.id ? (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Write a response..."
                        value={replyInputs[rev.id] || ''}
                        onChange={(e) =>
                          setReplyInputs({ ...replyInputs, [rev.id]: e.target.value })
                        }
                        style={{
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #444',
                          backgroundColor: '#111',
                          color: '#fff',
                          fontSize: '13px',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleReplySubmit(rev.id)}
                          disabled={submittingId === rev.id}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        >
                          {submittingId === rev.id ? 'Sending...' : 'Submit Reply'}
                        </button>
                        <button
                          onClick={() => setActiveReplyId(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#444',
                            color: '#ccc',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReplyId(rev.id)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: 'transparent',
                        color: '#007bff',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      💬 Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderReviews;