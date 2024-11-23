import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MdOutlineMyLocation } from "react-icons/md";
import L from "leaflet"; // Import leaflet for custom icon
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
          map.setView(userPosition, 18);

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
      onClick={handleLocate}
      className="fixed bottom-[10vh] right-[6vh] z-[19999] text-white border-none rounded-lg cursor-pointer p-4 bg-black text-x"
    >
      <MdOutlineMyLocation />
    </button>
  );
}

export default function Map() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  // Create a custom "tomato" colored marker icon
  const locationIcon = new L.DivIcon({
    className: 'location-icon',  // This will allow you to add custom CSS styles to the icon
    html: `<div style="background-color: tomato; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [24, 24], // Size of the custom icon
    iconAnchor: [12, 12], // Anchor the icon to the center of the marker
    popupAnchor: [0, -15], // Position the popup slightly above the marker
  });

  return (
    <div className="MapContainer">
      {/* Map centered on Warsaw initially */}
      <MapContainer center={[52.2298, 21.0118]} zoom={13} scrollWheelZoom={false} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker for the user's location with the custom tomato-colored icon */}
        {position && (
          <Marker position={position} icon={locationIcon}>
            <Popup>
              You are here: <br /> {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Locate Button */}
        <LocateButton setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
