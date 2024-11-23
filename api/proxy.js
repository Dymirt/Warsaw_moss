export default async function handler(req, res) {
	const apiUrl = `https://api.um.warszawa.pl/api/action/datastore_search/?resource_id=ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba&limit=5`;

	const response = await fetch(apiUrl);
	const data = await response.json();

	res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate");
	res.status(200).json(data);
  }
