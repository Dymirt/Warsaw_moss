import axios from 'axios';

export default async function handler(req, res) {
  const { resource_id, limit } = req.query;

  try {
    const response = await axios.get('https://api.um.warszawa.pl/api/action/datastore_search', {
      params: {
        resource_id,
        limit,
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
}
