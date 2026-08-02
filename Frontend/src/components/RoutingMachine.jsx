import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';

const RoutingMachine = ({ providerCoords, customerCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !providerCoords || !customerCoords) return;

    // Create the routing control for the shortest driving route
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(providerCoords.lat, providerCoords.lng),
        L.latLng(customerCoords.lat, customerCoords.lng),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // Prevents panel creation where supported
      createMarker: () => null, // Prevents duplicate default markers
      lineOptions: {
        styles: [{ color: '#2563eb', weight: 5, opacity: 0.8 }],
      },
    }).addTo(map);

    // Explicitly hide the turn-by-turn itinerary container DOM element
    const container = routingControl.getContainer();
    if (container) {
      container.style.display = 'none';
    }

    // Cleanup route when coordinates update or component unmounts
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