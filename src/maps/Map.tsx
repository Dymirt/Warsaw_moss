import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "./Maps.css";
import axios from 'axios';

export default function Map() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        const response = await axios.get(
          'https://cors-anywhere.herokuapp.com/https://api.um.warszawa.pl/api/action/datastore_search',
          {
            params: {
              resource_id: 'ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba',
			  limit: 5,
            },
			headers: {
				"Origin": "https://warsaw-moss.vercel.app", // Explicitly set your app's origin
				"X-Requested-With": "XMLHttpRequest" // Commonly used to signify an AJAX request
			  }
          }
        );

        console.log('Data fetched:', response.data);
		console.log('response' + JSON.stringify(response.data));
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
      <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[51.505, -0.09]}>
          <Popup>
            This is a popup
          </Popup>
        </Marker>
        <Marker position={[51.505, -0.10]}>
          <Popup>
            This is a popup
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
