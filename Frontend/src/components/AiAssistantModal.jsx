import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function AiAssistantModal({ isOpen, onClose }) {
  const [problem, setProblem] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Quick helper to fill location using browser GPS
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Local Area';
          setLocation(city);
        } catch (err) {
          setLocation('Local Area');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
      }
    );
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if ((!problem.trim() && !imageFile) || loading) return;

    setLoading(true);
    setError(null);

    try {
      let res;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (problem.trim()) formData.append('problem', problem);
        if (location.trim()) formData.append('location', location);

        res = await API.post('/ai/diagnose', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await API.post('/ai/detect', { problem, location });
      }

      setResult(res.data);
    } catch (err) {
      console.error('AI Assistant error:', err);
      setError('Could not analyze your request. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toUpperCase()) {
      case 'EMERGENCY': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#10b981';
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
              AI Smart Diagnosis & Nearby Match
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#94a3b8' }}>
          Upload a photo or describe the issue. Our AI detects the repair need, estimates prices, and ranks the nearest specialist providers.
        </p>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Image Upload Area */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Upload Photo of the Issue (Optional)
            </label>

            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%', maxHeight: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #38bdf8' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.85)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#1e293b',
                  border: '2px dashed rgba(56, 189, 248, 0.4)',
                  cursor: 'pointer',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>📸</span>
                <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 500 }}>
                  Click to select or capture image
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Supports JPG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Problem Description */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
              Describe the problem {!imageFile && <span style={{ color: '#f87171' }}>*</span>}
            </label>
            <textarea
              rows="2"
              required={!imageFile}
              placeholder={imageFile ? "Add additional notes (optional)..." : "e.g. Washbasin pipe joint is cracked and leaking water..."}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.9rem',
                marginTop: '6px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Location with Auto-Detect */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                Your City / Location
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                {detectingLocation ? '📍 Detecting...' : '📍 Auto-Detect Location'}
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. Kurnool, Kalugotla"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.9rem',
                marginTop: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.85rem', padding: '4px 0' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!problem.trim() && !imageFile)}
            style={{
              padding: '11px',
              backgroundColor: loading ? '#1d4ed8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: loading || (!problem.trim() && !imageFile) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            {loading ? '🔍 Diagnosing & Ranking Providers...' : '✨ Find Top Ranked Providers'}
          </button>
        </form>

        {/* AI Results & Ranked Providers */}
        {result && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.95rem' }}>
                  {result.matchedCategoryName || 'General Service'}
                </span>
                <span
                  style={{
                    backgroundColor: `${getUrgencyColor(result.urgency)}22`,
                    color: getUrgencyColor(result.urgency),
                    border: `1px solid ${getUrgencyColor(result.urgency)}`,
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}
                >
                  {result.urgency || 'MEDIUM'} URGENCY
                </span>
              </div>

              <p style={{ margin: '8px 0', fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                {result.assistantMessage}
              </p>

              <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
                Est. Cost Range: ₹{result.estimatedMinCost} - ₹{result.estimatedMaxCost}
              </div>
            </div>

            {/* Providers List */}
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: '#cbd5e1' }}>
              Top Match Ranked Providers:
            </h4>

            {result.recommendedServices && result.recommendedServices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.recommendedServices.map((service, idx) => (
                  <div
                    key={service.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ maxWidth: '72%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#f8fafc' }}>
                          {service.title || service.name}
                        </span>

                        {service.matchScore && (
                          <span
                            style={{
                              backgroundColor: service.matchScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                              color: service.matchScore >= 80 ? '#34d399' : '#38bdf8',
                              border: `1px solid ${service.matchScore >= 80 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                              fontSize: '0.72rem',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              fontWeight: 700,
                            }}
                          >
                            🔥 {service.matchScore}% Match
                          </span>
                        )}
                      </div>

                      {service.matchReason && (
                        <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '3px' }}>
                          {service.matchReason}
                        </div>
                      )}

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
                        ₹{service.price} • Provider: {service.providerName || 'Local Verified Provider'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/book-service/${service.id}`);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                No registered providers found in this category for your area yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}