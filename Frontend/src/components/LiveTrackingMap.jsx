import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons for React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LiveTrackingMap = ({ bookingId, isProvider }) => {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    let watchId = null;

    // Dynamically choose backend URL (Uses HTTPS on Render, http on localhost)
    const backendUrl = process.env.REACT_APP_API_BASE_URL || 'https://localserviceprovider.onrender.com';

    // Connect to Spring Boot WebSocket Endpoint over HTTPS/WSS
    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws-location`),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Connected to WebSocket | Role: ${isProvider ? 'Provider' : 'Customer'} | BookingID: ${bookingId}`);

        // 1. CUSTOMER: Subscribe to provider updates
        if (!isProvider) {
          const destination = `/topic/booking/${bookingId}`;
          console.log(`📡 Subscribing customer to: ${destination}`);

          client.subscribe(destination, (message) => {
            const data = JSON.parse(message.body);
            console.log('📍 Received location update:', data);
            if (data.latitude && data.longitude) {
              setCoords([data.latitude, data.longitude]);
            }
          });
        }

        // 2. PROVIDER: Start GPS Watcher once WebSocket connection is ACTIVE
        if (isProvider && 'geolocation' in navigator) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCoords([latitude, longitude]);

              console.log(`📤 Provider sending location: ${latitude}, ${longitude}`);
              client.publish({
                destination: '/app/update-location',
                body: JSON.stringify({
                  bookingId: Number(bookingId),
                  latitude: latitude,
                  longitude: longitude,
                }),
              });
            },
            (err) => console.error('Geolocation Error:', err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
          );
        }
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
      },
    });

    client.activate();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      client.deactivate();
    };
  }, [bookingId, isProvider]);

  return (
    <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '10px 16px', fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>
        {isProvider ? '📡 Live Broadcasting Location...' : '📍 Live Provider Tracking'}
      </div>

      <div style={{ height: '300px', width: '100%', backgroundColor: '#1e293b' }}>
        {coords ? (
          <MapContainer center={coords} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={coords}>
              <Popup>
                {isProvider ? 'Your Current Location' : 'Provider is here!'}
              </Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
            {isProvider ? 'Fetching GPS location...' : 'Waiting for provider to start moving...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;