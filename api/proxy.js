// api/proxy.js
import axios from 'axios';

export default async function handler(req, res) {
  const { resource_id, limit } = req.query;

  try {
    console.log('Fetching data from external API...');
    const response = await axios.get('https://api.um.warszawa.pl/api/action/datastore_search', {
      params: {
        resource_id,
        limit,
      },
      timeout: 10000, // Increase timeout to 10 seconds
    });

    console.log('Data fetched from external API:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
}
