import React, { useState } from 'react';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);
  const [amount] = useState(booking.service?.price || 500); // Fallback amount

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: amount,
          paymentMethod: paymentMethod,
        }),
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        alert('🎉 Payment successful!');
        onSuccess(updatedBooking);
        onClose();
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Network error during payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', width: '360px', color: '#f8fafc', border: '1px solid #334155'
      }}>
        <h3 style={{ marginTop: 0, color: '#38bdf8' }}>💳 Complete Payment</h3>
        <p><strong>Service:</strong> {booking.serviceName || 'Local Service'}</p>
        <p><strong>Amount:</strong> ₹{amount}</p>

        <div style={{ margin: '16px 0' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Select Payment Method:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }}
          >
            <option value="CARD">Credit / Debit Card</option>
            <option value="UPI">UPI / Google Pay</option>
            <option value="NET_BANKING">Net Banking</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{ flex: 1, padding: '10px', backgroundColor: '#22c55e', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : `Pay ₹${amount}`}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', backgroundColor: '#64748b', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;