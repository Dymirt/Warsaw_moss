import airPolutionData from "../../moc_data/air_polution.json";
import React, { useEffect, useState } from "react";
import {Circle, LayerGroup, LayersControl } from "react-leaflet";


export const AirSensors: React.FC = () => {

	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

  return (
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
  );
}
