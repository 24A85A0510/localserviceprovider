import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function AiAssistantModal({ isOpen = true, onClose }) {
  const [problem, setProblem] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const navigate = useNavigate();

  // If explicitly passed false, hide; otherwise render if mounted
  if (isOpen === false) return null;

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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
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
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#0f172a',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>✨</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e40af' }}>
              AI Smart Diagnosis & Nearby Match
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '1.3rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748b' }}>
          Upload a photo or describe the issue. Our AI detects the repair need, estimates prices, and ranks the nearest specialist providers.
        </p>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Image Upload Area */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
              Upload Photo of the Issue (Optional)
            </label>

            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%', maxHeight: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2563eb' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: '#ef4444',
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
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '2px dashed #93c5fd',
                  cursor: 'pointer',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>📸</span>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
              Describe the problem {!imageFile && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            <textarea
              rows="2"
              required={!imageFile}
              placeholder={imageFile ? "Add additional notes (optional)..." : "e.g. Washbasin pipe joint is cracked and leaking water..."}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.9rem',
                marginTop: '6px',
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* Location with Auto-Detect */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                Your City / Location
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.78rem',
                  fontWeight: 600,
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
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.9rem',
                marginTop: '6px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: '0.85rem', padding: '4px 0', fontWeight: 500 }}>
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
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading || (!problem.trim() && !imageFile) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            }}
          >
            {loading ? '🔍 Diagnosing & Ranking Providers...' : '✨ Find Top Ranked Providers'}
          </button>
        </form>

        {/* AI Results & Ranked Providers */}
        {result && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#1e40af', fontSize: '1rem' }}>
                  {result.matchedCategoryName || 'General Service'}
                </span>
                <span
                  style={{
                    backgroundColor: `${getUrgencyColor(result.urgency)}22`,
                    color: getUrgencyColor(result.urgency),
                    border: `1px solid ${getUrgencyColor(result.urgency)}`,
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: 800,
                  }}
                >
                  {result.urgency || 'MEDIUM'} URGENCY
                </span>
              </div>

              <p style={{ margin: '8px 0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                {result.assistantMessage}
              </p>

              <div style={{ fontSize: '0.88rem', color: '#16a34a', fontWeight: 700 }}>
                Est. Cost Range: ₹{result.estimatedMinCost} - ₹{result.estimatedMaxCost}
              </div>
            </div>

            {/* Providers List */}
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: '#334155', fontWeight: 700 }}>
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
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ maxWidth: '72%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                          {service.title || service.name}
                        </span>

                        {service.matchScore && (
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
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
                        <div style={{ fontSize: '0.76rem', color: '#2563eb', marginTop: '3px', fontWeight: 500 }}>
                          {service.matchReason}
                        </div>
                      )}

                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
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
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
                No registered providers found in this category for your area yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}