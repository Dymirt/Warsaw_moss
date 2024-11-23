import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MdOutlineMyLocation } from "react-icons/md";
import React, { useState, useEffect } from "react";
import "./Maps.css";
import axios from 'axios';

import "./Maps.css";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        const response = await axios.get('https://api.um.warszawa.pl/api/action/datastore_search', {
          params: {
            resource_id: 'ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba',
            limit: 5,
          },
        });

        console.log('Data fetched:', response.data);
        setData(response.data.result.records);
        setLoading(false);
        alert(JSON.stringify(response.data.result.records)); // Show the response data in an alert
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
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
        {data.map((record, index) => (
          <Marker key={index} position={[record.latitude, record.longitude]}>
            <Popup>
              {record.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
