import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RoutingMachine from './RoutingMachine';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LiveTrackingMap = ({ bookingId, isProvider, customerLocation }) => {
  const [providerCoords, setProviderCoords] = useState(null);

  useEffect(() => {
    let watchId = null;

    const baseBackendUrl = import.meta.env.VITE_BACKEND_URL || 'https://localserviceprovider.onrender.com';
    const secureWsUrl = baseBackendUrl.replace(/^http:\/\//, 'https://') + '/ws-location';

    const client = new Client({
      webSocketFactory: () => new SockJS(secureWsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Connected to WebSocket | Role: ${isProvider ? 'Provider' : 'Customer'} | BookingID: ${bookingId}`);

        if (!isProvider) {
          const destination = `/topic/booking/${bookingId}`;
          client.subscribe(destination, (message) => {
            const data = JSON.parse(message.body);
            if (data.latitude && data.longitude) {
              setProviderCoords({ lat: data.latitude, lng: data.longitude });
            }
          });
        }

        if (isProvider && 'geolocation' in navigator) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setProviderCoords({ lat: latitude, lng: longitude });

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

  // Fallback map center point (defaults to Vijayawada if no coords exist yet)
  const defaultCenter = providerCoords
    ? [providerCoords.lat, providerCoords.lng]
    : customerLocation
    ? [customerLocation.lat, customerLocation.lng]
    : [16.5062, 80.6480];

  return (
    <div style={{ marginTop: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '10px 16px', fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>
        {isProvider ? '📡 Live Broadcasting Location...' : '📍 Live Provider Tracking'}
      </div>

      <div style={{ height: '320px', width: '100%', backgroundColor: '#1e293b' }}>
        {providerCoords || customerLocation ? (
          <MapContainer center={defaultCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Provider Pin */}
            {providerCoords && (
              <Marker position={[providerCoords.lat, providerCoords.lng]}>
                <Popup>{isProvider ? 'You (Provider)' : 'Provider Location'}</Popup>
              </Marker>
            )}

            {/* Customer Pin */}
            {customerLocation && (
              <Marker position={[customerLocation.lat, customerLocation.lng]}>
                <Popup>Customer Location</Popup>
              </Marker>
            )}

            {/* Shortest Navigation Route */}
            {providerCoords && customerLocation && (
              <RoutingMachine
                providerCoords={providerCoords}
                customerCoords={customerLocation}
              />
            )}
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