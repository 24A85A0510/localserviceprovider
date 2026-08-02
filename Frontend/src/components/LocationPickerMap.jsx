import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons for React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function LocationMarker({ position, setPosition, onSelectLocation }) {
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      onSelectLocation(newPos);
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const LocationPickerMap = ({ onSelectLocation }) => {
  const defaultCenter = { lat: 16.5062, lng: 80.6480 }; // Vijayawada default center
  const [position, setPosition] = useState(null);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(currentPos);
          onSelectLocation(currentPos);
        },
        () => alert('Could not fetch location. Please click on the map manually.')
      );
    }
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
          Select Location on Map
        </label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{
            padding: '4px 8px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          📍 Use My Location
        </button>
      </div>

      <div style={{ height: '200px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #444' }}>
        <MapContainer center={[defaultCenter.lat, defaultCenter.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <LocationMarker position={position} setPosition={setPosition} onSelectLocation={onSelectLocation} />
        </MapContainer>
      </div>
      {position && (
        <small style={{ color: '#4ade80', marginTop: '4px', display: 'block', fontSize: '12px' }}>
          ✓ Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </small>
      )}
    </div>
  );
};

export default LocationPickerMap;