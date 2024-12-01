import React, { useEffect, useState } from "react";
import TreesData from "../../moc_data/trees.json";
import {Circle, LayerGroup, LayersControl } from "react-leaflet";

interface TreeRecord {
	x_wgs84: number;
	y_wgs84: number;
	_id: number;
  }

export const Trees: React.FC = () => {

	const [data, setData] = useState<TreeRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		try {
		  console.log('Data fetched:', TreesData);
		  setData(TreesData.result.records);
		  setLoading(false);
		} catch (err) {
		  console.error('Error fetching data:', err);
		  setError(err instanceof Error ? err.message : 'Failed to fetch data');
		  setLoading(false);
		}
	  }, []); // Empty dependency array to run only once on mount

	  if (loading) {
		return <div>Loading...</div>;
	  }

	  if (error) {
		return <div>Error: {error}</div>;
	  }

  return (
	<LayersControl position="topright">
	<LayersControl.Overlay checked name="Layer group with circles">
	  <LayerGroup>
		{data.map((record, index) => {
		  return (
			<Circle
			  key={ record._id }
			  center={[ record.y_wgs84, record.x_wgs84]}
			  pathOptions={{ color: "green", fillColor: "green" }}
			  radius={10}
			/>
		  );
		})}
	  </LayerGroup>
	</LayersControl.Overlay>
  </LayersControl>
  );
}

