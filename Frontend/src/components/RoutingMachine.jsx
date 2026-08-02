import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

const RoutingMachine = ({ providerCoords, customerCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !providerCoords || !customerCoords) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(providerCoords.lat, providerCoords.lng),
        L.latLng(customerCoords.lat, customerCoords.lng),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: '#2563eb', weight: 5, opacity: 0.8 }],
      },
    }).addTo(map);

    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        // Safe fallback for map control cleanup
      }
    };
  }, [map, providerCoords, customerCoords]);

  return null;
};

export default RoutingMachine;