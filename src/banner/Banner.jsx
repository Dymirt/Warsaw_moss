import React, { useState } from "react";
import { FaMapMarkerAlt, FaBus, FaCar, FaBicycle, FaWalking } from "react-icons/fa";

const Banner = () => {
  const [location, setLocation] = useState("");

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation("My Location"); // Optionally, reverse geocode to get a name
        },
        () => {
          alert("Unable to fetch your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const Title = "Explore the Warsaw with us";

  return (
    <div className="banner-cont rounded-3xl overflow-hidden fixed bg-white">
      <div className="header-banner text-white p-3">
        <h3 className="text-2xl font-bold mb-6 text-center">{Title}</h3>
        <div className="space-y-4">
          {/* Input for Destination A */}
          <div className="relative">
            <input
              type="text"
              value={location || ""}
              placeholder="Enter your location"
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <FaMapMarkerAlt
              onClick={getCurrentLocation}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tomato cursor-pointer"
            />
          </div>

          {/* Input for Destination B */}
          <div>
            <input
              type="search"
              placeholder="Enter destination"
              className="w-full px-4 py-3 rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Transportation Icons */}
          <div className="flex justify-between items-center mt-4 text-white">
            <button className="flex flex-col items-center text-center hover:text-blue-300">
              <FaCar size={24} />
              <span className="text-sm mt-1">Car</span>
            </button>
            <button className="flex flex-col items-center text-center hover:text-blue-300">
              <FaBus size={24} />
              <span className="text-sm mt-1">Bus</span>
            </button>
            <button className="flex flex-col items-center text-center hover:text-blue-300">
              <FaBicycle size={24} />
              <span className="text-sm mt-1">Bike</span>
            </button>
            <button className="flex flex-col items-center text-center hover:text-blue-300">
              <FaWalking size={24} />
              <span className="text-sm mt-1">Walk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
