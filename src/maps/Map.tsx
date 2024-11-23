import { MapContainer, Marker, Popup, TileLayer, useMap, Circle, LayerGroup, LayersControl, Polyline } from "react-leaflet";
import { MdOutlineMyLocation } from "react-icons/md";
import React, { useState, useEffect } from "react";
import "./Maps.css";
import airPolutionData from './air_polution.json'; // Import the JSON file
import axios from 'axios';

const center = [52.2298, 21.0118];

function LocateButton({ setPosition }: { setPosition: (position: [number, number]) => void }) {
  const map = useMap();

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPosition: [number, number] = [latitude, longitude];

          // Center the map and zoom to maximum detail
          map.setView(userPosition, 18); // Use zoom level 18 for high detail

          // Update the state with the user's position
          setPosition(userPosition);
        },
        (error) => {
          console.error("Error fetching geolocation:", error);
          alert("Unable to fetch location. Please ensure location services are enabled.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <button
      onClick={handleLocate} className="fixed bottom-[10vh] right-[6vh] z-[19999] text-white border-none rounded-lg cursor-pointer p-4 bg-black text-x">
     <MdOutlineMyLocation />
    </button>
  );
}

export default function Map() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    try {
      console.log('Data fetched:', airPolutionData);
      setData(airPolutionData.result);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await axios.get('https://api.openrouteservice.org/v2/directions/driving-car', {
          params: {
            api_key: '5b3ce3597851110001cf62482931dab54e86458889bdec69775508ee', // Replace with your OpenRouteService API key
            start: '21.0118,52.2298', // Starting point (longitude,latitude)
            end: '21.080555,52.245703' // Ending point (longitude,latitude)
          }
        });

        const coordinates = response.data.features[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRoute(coordinates);
      } catch (err) {
        console.error('Error fetching route:', err);
      }
    };

    fetchRoute();
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="MapContainer">
      {/* Map centered on Warsaw initially */}
      <MapContainer center={[52.2298, 21.0118]} zoom={13} scrollWheelZoom={false} style={{ height: "100%" }}>

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Marker for the user's location */}
        {position && (
          <Marker position={position}>
            <Popup>
              You are here: <br /> {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Locate Button */}
        <LocateButton setPosition={setPosition} />
        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Layer group with circles">
            <LayerGroup>
              {data.map((record, index) => {
                const values = record.data.map((d: any) => d.value);
                const fillColor = `rgba(${values[0]*10}, ${values[1]*10}, ${values[2]*10}, ${values[3]*10})`; // Assuming the 4th value is a percentage for alpha
                return (
                  <Circle
                    key={index}
                    center={[record.lat, record.lon]}
                    pathOptions={{ fillColor }}
                    radius={800}
                  />
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        {/* Polyline for the route */}
        {route.length > 0 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </div>
  );
}
