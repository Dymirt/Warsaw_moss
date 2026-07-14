import { buildGreenRoute, formatApiError } from '../server/ecoApi.js'

function parseBody(body) {
  if (!body) return {}
  return typeof body === 'string' ? JSON.parse(body) : body
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  response.setHeader('Cache-Control', 'no-store')

  try {
    response.status(200).json(await buildGreenRoute(parseBody(request.body)))
  } catch (error) {
    if (error instanceof SyntaxError) {
      response.status(400).json({ error: 'Request body must be valid JSON.' })
      return
    }

    const { status, message } = formatApiError(error)
    response.status(status).json({ error: message })
  }
}
