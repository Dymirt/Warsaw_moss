import { formatApiError, getAirQuality } from '../server/ecoApi.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  response.setHeader('Cache-Control', 'no-store')

  try {
    response.status(200).json(await getAirQuality(process.env.WARSAW_API_TOKEN))
  } catch (error) {
    const { status, message } = formatApiError(error)
    response.status(status).json({ error: message })
  }
}
